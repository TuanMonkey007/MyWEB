# Triển khai bằng Docker trên CentOS 7

Thay cho [DEPLOY.md](DEPLOY.md) (Windows Server + IIS). Giữ nguyên SQLite và
lưu file trên đĩa — chỉ đổi chỗ chạy.

## Trước khi bắt đầu: hai điều phải chốt

### 1. Module `/predict` sẽ không chạy trong container

[app/api/predict/route.ts](app/api/predict/route.ts) gọi `execFile("python", ...)` tới
`C:/Users/tuannm/AppData/Local/hermes/scripts/mt5_predict.py`, đọc dữ liệu từ
MetaTrader 5 trên Windows. Container Linux không có cả Python đó lẫn MT5.

Ba lựa chọn (xem [DI-TRU-HOSTING.md](DI-TRU-HOSTING.md) mục 0): giữ `/predict` chạy ở
máy Windows rồi gọi sang, bỏ hẳn module, hoặc viết lại dùng API giá của sàn.
**Mọi bước dưới đây không bao gồm việc này** — các module còn lại chạy bình thường.

### 2. Build ở đâu

Máy Mac dev là **arm64**, máy chủ CentOS 7 là **x86_64**. Build trên Mac rồi đẩy sang
là sai kiến trúc, container không chạy.

**Cách đơn giản nhất: build thẳng trên máy chủ CentOS** (bạn đã xác nhận máy đó ra
Internet được — cần thiết, vì `next/font/google` tải Playfair Display lúc build).

Nếu buộc phải build từ Mac thì dùng `docker buildx build --platform linux/amd64`,
chậm hơn nhiều vì phải giả lập.

---

## Bước 1 — Cài Docker trên CentOS 7

CentOS 7 **đã hết hỗ trợ từ 30/06/2024**, bản Docker trong repo mặc định rất cũ.
Cài từ repo chính thức:

```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
```

> **Về lâu dài nên tính chuyển sang Rocky hoặc AlmaLinux.** CentOS 7 không còn
> vá bảo mật, và một máy chủ web công khai chạy hệ điều hành hết hỗ trợ là rủi ro thật.

## Bước 2 — Thư mục dữ liệu

```bash
sudo mkdir -p /opt/myweb/{data/uploads,backup}
sudo chown -R 1000:1000 /opt/myweb/data
```

`1000:1000` là user `node` trong container. Sai chủ sở hữu thì app không ghi được.

**Phải nằm trên ổ đĩa local.** Đừng trỏ `/opt/myweb/data` vào NFS/CIFS — khoá file
của SQLite không đáng tin trên hệ thống file mạng, dễ hỏng database.

## Bước 3 — Lấy code và cấu hình

```bash
sudo mkdir -p /opt/myweb/app && cd /opt/myweb/app
git clone https://github.com/TuanMonkey007/MyWEB.git .
cp .env.production.example .env.production
chmod 600 .env.production
```

Sửa `.env.production`: đặt `APP_PASSWORD`, và sinh `APP_SECRET` bằng
`openssl rand -hex 32`.

**Nếu dọn dữ liệu cũ sang** (bước 4) thì `APP_SECRET` phải trùng giá trị cũ, hoặc
chép luôn file `.app-secret` cũ — đổi khoá này là mọi API key mail đã lưu không
giải mã được nữa.

## Bước 4 — Dọn dữ liệu từ máy Windows

Dừng app trên Windows trước để database không bị ghi dở:

```bash
# chạy trên máy Windows, hoặc scp từ CentOS sang
scp C:/appdata/finance.db      root@centos:/opt/myweb/data/app.db
scp C:/appdata/.app-secret     root@centos:/opt/myweb/data/.app-secret
scp -r C:/appdata/uploads/*    root@centos:/opt/myweb/data/uploads/
```

```bash
sudo chown -R 1000:1000 /opt/myweb/data
```

Bỏ qua bước này nếu muốn khởi đầu trắng — app tự tạo database mới.

## Bước 5 — Chạy

```bash
cd /opt/myweb/app
docker compose up -d --build
docker compose logs -f
```

Entrypoint tự chạy `prisma migrate deploy` trước khi mở cổng, nên database cũ sẽ
được nâng cấp schema tự động.

Kiểm tra: `curl -I http://127.0.0.1:3000/login` phải trả `200`.

## Bước 6 — SELinux và firewall

SELinux bật mặc định trên CentOS 7. `docker-compose.yml` đã có hậu tố `:Z` ở volume
nên bind mount được gán nhãn đúng. Nếu vẫn gặp lỗi permission:

```bash
sudo ausearch -m avc -ts recent          # xem SELinux chặn gì
getenforce                                # Enforcing hay Permissive
```

Cổng 3000 chỉ mở trên loopback (xem `ports:` trong compose), nên không cần mở
firewall cho nó. Chỉ mở 80/443 cho reverse proxy:

```bash
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```

## Bước 7 — Reverse proxy + HTTPS

Đặt nginx hoặc Caddy phía trước. Caddy tự xin chứng chỉ Let's Encrypt:

```
tuandeptrai.io.vn {
    reverse_proxy 127.0.0.1:3000
}
```

Với nginx thì dùng `certbot`. Nhớ `client_max_body_size` đủ lớn — module Drive
nhận file tới 2GB.

## Bước 8 — Backup tự động

```bash
sudo yum install -y sqlite     # để backup.sh dùng lệnh .backup an toàn
sudo crontab -e
```

```
0 2 * * * /opt/myweb/app/scripts/backup.sh >> /var/log/myweb-backup.log 2>&1
```

Sao lưu cả database, `uploads` và `.app-secret`, giữ 30 ngày. Khác `backup.ps1` ở
một điểm: dùng `sqlite3 .backup` thay vì chép file thô, nên an toàn cả khi app
đang ghi.

**Kiểm tra thử việc phục hồi ít nhất một lần** — backup chưa từng restore thì
chưa tính là backup.

## Khi có code mới

```bash
cd /opt/myweb/app
git pull
docker compose up -d --build
```

---

## Xử lý sự cố

**Container chết ngay, log có "Operation not permitted"**
Đây là vấn đề libseccomp của CentOS 7 chặn syscall `clone3`. Dockerfile đã dùng
`node:20-bullseye` (glibc 2.31, chưa dùng clone3) để tránh. Nếu ai đó đổi base
image sang bookworm hoặc Ubuntu 22.04 thì lỗi này quay lại — hoặc trả lại base cũ,
hoặc nâng libseccomp trên host.

**Prisma báo không tìm thấy query engine**
`binaryTargets` trong `prisma/schema.prisma` phải khớp base image:
`debian-openssl-1.1.x` cho bullseye. Đổi sang Alpine thì phải là `linux-musl-*`.

**Xuất PDF phiếu đề xuất lỗi, các chức năng khác bình thường**
Thiếu thư mục `assets/` trong image. [lib/export/pdf.ts](lib/export/pdf.ts) đọc font
Tinos lúc chạy qua `process.cwd()`, Dockerfile phải `COPY assets ./assets`.

**Mất hết API key mail sau khi tái tạo container**
File `.app-secret` không nằm trên volume. Phải mount cả thư mục `/data`, không
mount riêng file `.db`.

**Build fail ở bước `next build`, lỗi liên quan font**
Máy build không ra được `fonts.googleapis.com`. `next/font/google` tải Playfair
Display lúc build. Mở outbound, hoặc đổi sang self-host font như Inter/Be Vietnam
trong [app/layout.tsx](app/layout.tsx).
