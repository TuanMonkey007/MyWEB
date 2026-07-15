# Hướng dẫn deploy lên VPS Windows Server

> VPS chỉ có một ổ **C:** — mọi đường dẫn bên dưới đều nằm trên C:.
> Bố trí thư mục:
>
> | Đường dẫn | Vai trò |
> |---|---|
> | `C:\apps\MyWEB` | Code (clone từ GitHub) |
> | `C:\appdata` | **Dữ liệu**: `finance.db` + `uploads\` + `logs\` — nằm NGOÀI code, `git pull` không đụng tới |
> | `C:\backup` | Bản sao lưu hằng ngày |
> | `C:\tools` | `nssm.exe` (chạy app như service), `win-acme\` (xin chứng chỉ HTTPS) |

Kiến trúc — **IIS** là tính năng có sẵn của Windows Server (không cần tải file lạ), đóng vai trò reverse proxy đứng trước app:

```
Internet ──443/HTTPS──▶ IIS + ARR (reverse proxy, HTTPS qua win-acme) ──▶ Next.js service (localhost:3000)
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

Tải thêm 1 file thủ công vào `C:\tools` (file HTTPS ở Bước 3 tải sau, lúc cần mới tải):

- **NSSM** (chạy app như Windows Service): https://nssm.cc/download → giải nén, lấy `win64\nssm.exe` → `C:\tools\nssm.exe`

## Bước 2 — Clone code và cài đặt lần đầu

```powershell
mkdir C:\apps ; cd C:\apps
gh repo clone TuanMonkey007/MyWEB
cd MyWEB
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-first-time.ps1
```

Script sẽ tự động: kiểm tra Node ≥ 20 → tạo `C:\appdata` → tạo `.env` (hỏi mật khẩu đăng nhập — nên dùng ký tự không dấu) → `npm install` → generate Prisma Client → migrate + seed database → build → đăng ký & chạy service **MyWEB** qua NSSM.

Xong bước này, mở `http://localhost:3000` trên VPS phải thấy trang đăng nhập.

## Bước 3 — Trỏ domain và bật HTTPS bằng IIS

Không cần tải phần mềm lạ ở bước này. IIS là tính năng **có sẵn** trong Windows Server, chỉ cần bật lên; 2 module mở rộng bên dưới tải trực tiếp từ trang chính thức của Microsoft (`iis.net`).

**1. Bật IIS** (PowerShell, chạy một lần):

```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

**2. Cài 2 module chính thức từ Microsoft** — tải về, double-click file cài, Next → Next → Finish:

- URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite
- Application Request Routing (ARR): https://www.iis.net/downloads/microsoft/application-request-routing

**3. Bật chế độ proxy của ARR** — gõ `inetmgr` vào Run để mở IIS Manager:

- Bấm vào **tên server** ở panel trái trên cùng (không phải một site cụ thể nào)
- Mở icon **"Application Request Routing Cache"**
- Panel phải → **"Server Proxy Settings..."** → tích **Enable proxy** → Apply

**4. Tạo site trỏ tới app** — trong IIS Manager, chuột phải **Sites** → **Add Website**:

- Site name: `MyWEB`
- Physical path: một thư mục rỗng bất kỳ, vd `C:\inetpub\myweb` (IIS chỉ dùng thư mục này để giữ `web.config`, không cần chứa gì khác)
- Binding: type `http`, Host name: điền domain của bạn (vd `ten-mien-cua-ban.com`), port `80`

**5. Tạo file `C:\inetpub\myweb\web.config`** — rule chuyển toàn bộ traffic sang Next.js đang chạy ở cổng 3000:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNode" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

**6. Trỏ DNS**: ở trang quản lý domain, tạo **A record** trỏ về IP của VPS.

Lúc này mở `http://ten-mien-cua-ban.com` phải thấy trang đăng nhập (chưa có HTTPS).

### Bật HTTPS miễn phí bằng win-acme

**win-acme** là công cụ xin chứng chỉ Let's Encrypt phổ biến nhất cho IIS — chỉ 1 file `.exe`, giải nén ra chạy ngay, không cần cài đặt:

1. Tải bản `.pluggable.zip` tại https://www.win-acme.com/ → giải nén vào `C:\tools\win-acme`
2. Chạy `C:\tools\win-acme\wacs.exe`
3. Chọn `N` (create new certificate) → chọn site IIS `MyWEB` vừa tạo → để mặc định các bước còn lại (Enter liên tục)
4. win-acme tự lấy chứng chỉ, tự gắn vào IIS binding cổng 443, và tự đăng ký Scheduled Task gia hạn mỗi ~60 ngày — không cần làm gì thêm.

Xong bước này, `https://ten-mien-cua-ban.com` chạy được.

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

Script tự: `git pull` → `npm install` → generate Prisma Client → `prisma migrate deploy` → `npm run build` → restart service. Dữ liệu ở `C:\appdata` không bị ảnh hưởng.

---

## Xử lý sự cố

| Triệu chứng | Kiểm tra |
|---|---|
| Web không lên | `C:\tools\nssm.exe status MyWEB` · log tại `C:\appdata\logs\myweb*.log` |
| Lỗi "@prisma/client did not initialize yet" | Chạy `npx prisma generate` rồi thử lại. 2 script đã tự làm bước này — chỉ gặp lỗi nếu chạy tay từng lệnh riêng lẻ và bỏ sót nó |
| Lỗi `EPERM ... rename ... .dll.node` khi update | App đang chạy nên Windows khóa file. Script đã tự dừng service trước khi build — nếu chạy lệnh tay thì phải `C:\tools\nssm.exe stop MyWEB` trước, xong `start` lại |
| Domain/HTTPS không lên | Site `MyWEB` trong IIS Manager đã "Started" chưa · đã tích "Enable proxy" ở ARR chưa (Bước 3.3) · DNS đã trỏ đúng IP chưa (`nslookup ten-mien`) · cổng 80/443 đã mở chưa |
| Cảnh báo chứng chỉ HTTPS hết hạn | Chạy lại `C:\tools\win-acme\wacs.exe` thủ công, hoặc kiểm tra Task Scheduler có task gia hạn của win-acme chạy được không |
| Quên mật khẩu user thường | Admin đặt lại trong **Cài đặt → Tài khoản & phân quyền** |
| Quên mật khẩu admin (mất hết) | Trong `C:\apps\MyWEB` chạy: `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.session.deleteMany().then(()=>p.user.deleteMany()).then(()=>console.log('OK'))"` — xóa toàn bộ tài khoản, sau đó đăng nhập `admin` + mật khẩu `APP_PASSWORD` trong `.env` để hệ thống tạo lại admin |
| Lỗi sau khi update | Xem log rồi có thể quay lại bản trước: `git log --oneline` → `git checkout <commit>` → chạy lại `update.ps1` (bỏ bước git pull) |
| Service không tự chạy sau reboot | `C:\tools\nssm.exe set MyWEB Start SERVICE_AUTO_START` (mặc định NSSM đã bật) |
