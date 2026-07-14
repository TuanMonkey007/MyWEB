# Hướng dẫn deploy lên VPS Windows Server

> VPS chỉ có một ổ **C:** — mọi đường dẫn bên dưới đều nằm trên C:.
> Bố trí thư mục:
>
> | Đường dẫn | Vai trò |
> |---|---|
> | `C:\apps\MyWEB` | Code (clone từ GitHub) |
> | `C:\appdata` | **Dữ liệu**: `finance.db` + `uploads\` + `logs\` — nằm NGOÀI code, `git pull` không đụng tới |
> | `C:\backup` | Bản sao lưu hằng ngày |
> | `C:\tools` | `nssm.exe`, `caddy.exe` |

Kiến trúc:

```
Internet ──443/HTTPS──▶ Caddy (tự lo SSL) ──▶ Next.js service (localhost:3000)
                                               └─▶ C:\appdata\finance.db + C:\appdata\uploads
```

---

## Bước 1 — Cài công cụ nền (một lần, PowerShell "Run as Administrator")

```powershell
winget install OpenJS.NodeJS.LTS      # Node.js 22 LTS (app cần Node 20.9+)
winget install Git.Git
winget install GitHub.cli             # để clone repo private
```

Đóng và mở lại PowerShell cho PATH có hiệu lực, rồi đăng nhập GitHub:

```powershell
gh auth login
# Chọn: GitHub.com → HTTPS → Login with a web browser
```

Tải thêm 2 file thủ công vào `C:\tools`:

- **NSSM** (chạy app như Windows Service): https://nssm.cc/download → giải nén, lấy `win64\nssm.exe` → `C:\tools\nssm.exe`
- **Caddy** (reverse proxy + SSL tự động): https://caddyserver.com/download (Windows amd64) → `C:\tools\caddy\caddy.exe`

## Bước 2 — Clone code và cài đặt lần đầu

```powershell
mkdir C:\apps ; cd C:\apps
gh repo clone TuanMonkey007/MyWEB
cd MyWEB
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-first-time.ps1
```

Script sẽ tự động: kiểm tra Node ≥ 20 → tạo `C:\appdata` → tạo `.env` (hỏi mật khẩu đăng nhập — nên dùng ký tự không dấu) → `npm install` → migrate + seed database → build → đăng ký & chạy service **MyWEB** qua NSSM.

Xong bước này, mở `http://localhost:3000` trên VPS phải thấy trang đăng nhập.

## Bước 3 — Trỏ domain và bật HTTPS (Caddy)

1. Ở trang quản lý DNS: tạo **A record** trỏ domain về IP của VPS.
2. Tạo file `C:\tools\caddy\Caddyfile` (thay domain của bạn):

   ```
   ten-mien-cua-ban.com {
       reverse_proxy localhost:3000
   }
   ```

3. Chạy Caddy như service:

   ```powershell
   C:\tools\nssm.exe install Caddy C:\tools\caddy\caddy.exe "run --config C:\tools\caddy\Caddyfile"
   C:\tools\nssm.exe set Caddy AppDirectory C:\tools\caddy
   C:\tools\nssm.exe set Caddy AppStdout C:\appdata\logs\caddy.log
   C:\tools\nssm.exe set Caddy AppStderr C:\appdata\logs\caddy-err.log
   C:\tools\nssm.exe start Caddy
   ```

Caddy tự xin và tự gia hạn chứng chỉ Let's Encrypt, không cần làm gì thêm về SSL.

## Bước 4 — Firewall

Mở inbound **80 + 443**, tuyệt đối **không mở 3000** (app chỉ nên vào qua HTTPS):

```powershell
New-NetFirewallRule -DisplayName "Web HTTP/HTTPS" -Direction Inbound -Protocol TCP -LocalPort 80,443 -Action Allow
```

Nếu nhà cung cấp VPS có firewall riêng trong trang quản trị thì mở 80/443 ở đó nữa.

## Bước 5 — Backup tự động hằng ngày

Backup phải gồm **cả** database **và** thư mục uploads. Đăng ký chạy `scripts\backup.ps1` lúc 2h sáng mỗi ngày:

```powershell
schtasks /Create /TN "Backup MyWEB" /SC DAILY /ST 02:00 /RU SYSTEM `
  /TR "powershell -ExecutionPolicy Bypass -File C:\apps\MyWEB\scripts\backup.ps1"
```

Script giữ 30 ngày gần nhất trong `C:\backup`. Nên định kỳ copy `C:\backup` ra nơi khác (Google Drive, máy cá nhân...) — backup nằm cùng ổ với dữ liệu không chống được hỏng ổ đĩa.

## Bước 6 — Khi có code mới

Trên máy dev: `git push`. Trên VPS:

```powershell
cd C:\apps\MyWEB
powershell -ExecutionPolicy Bypass -File .\scripts\update.ps1
```

Script tự: `git pull` → `npm install` → `prisma migrate deploy` → `npm run build` → restart service. Dữ liệu ở `C:\appdata` không bị ảnh hưởng.

---

## Xử lý sự cố

| Triệu chứng | Kiểm tra |
|---|---|
| Web không lên | `C:\tools\nssm.exe status MyWEB` · log tại `C:\appdata\logs\myweb*.log` |
| HTTPS không lên | `C:\tools\nssm.exe status Caddy` · log `C:\appdata\logs\caddy*.log` · DNS đã trỏ đúng IP chưa (`nslookup ten-mien`) · cổng 80/443 đã mở chưa |
| Quên mật khẩu đăng nhập | Sửa `APP_PASSWORD` trong `C:\apps\MyWEB\.env` rồi `C:\tools\nssm.exe restart MyWEB` (mọi phiên cũ tự hết hạn) |
| Lỗi sau khi update | Xem log rồi có thể quay lại bản trước: `git log --oneline` → `git checkout <commit>` → chạy lại `update.ps1` (bỏ bước git pull) |
| Service không tự chạy sau reboot | `C:\tools\nssm.exe set MyWEB Start SERVICE_AUTO_START` (mặc định NSSM đã bật) |
