# Cài đặt lần đầu trên Windows Server — chạy trong thư mục gốc project:
#   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-first-time.ps1
# Xem hướng dẫn đầy đủ trong DEPLOY.md

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
    Write-Error "Hãy chạy script từ thư mục gốc project (nơi có package.json)."
}

# --- 1. Kiểm tra Node.js ---
try {
    $nodeVer = node --version
} catch {
    Write-Error "Chưa cài Node.js. Chạy: winget install OpenJS.NodeJS.LTS"
}
$major = [int]($nodeVer -replace '^v(\d+).*', '$1')
if ($major -lt 20) {
    Write-Error "Node $nodeVer quá cũ — cần Node 20 trở lên (winget install OpenJS.NodeJS.LTS)"
}
Write-Host "[1/5] Node $nodeVer OK" -ForegroundColor Green

# --- 2. Thư mục dữ liệu (nằm ngoài code, git pull không đụng tới) ---
New-Item -ItemType Directory -Force -Path C:\appdata, C:\appdata\uploads, C:\appdata\logs, C:\backup | Out-Null
Write-Host "[2/5] Đã tạo C:\appdata (db + uploads + logs) và C:\backup" -ForegroundColor Green

# --- 3. Tạo .env ---
if (-not (Test-Path ".env")) {
    $pw = Read-Host "Nhập APP_PASSWORD (mật khẩu đăng nhập web, nên dùng ký tự không dấu)"
    if (-not $pw) { Write-Error "Mật khẩu không được để trống." }
    @"
DATABASE_URL="file:C:/appdata/finance.db"
UPLOAD_DIR="C:/appdata/uploads"
APP_PASSWORD="$pw"
"@ | Set-Content -Path ".env" -Encoding UTF8
    Write-Host "[3/5] Đã tạo .env — dữ liệu lưu tại C:\appdata" -ForegroundColor Green
} else {
    Write-Host "[3/5] .env đã tồn tại — giữ nguyên" -ForegroundColor Yellow
}

# --- 4. Cài deps, generate Prisma Client, tạo database, seed, build ---
# Dừng service cũ nếu đang chạy — Windows khóa file .dll của process đang chạy,
# không dừng thì npm install / prisma generate lỗi EPERM
$nssm = "C:\tools\nssm.exe"
if ((Get-Service MyWEB -ErrorAction SilentlyContinue) -and (Test-Path $nssm)) {
    & $nssm stop MyWEB | Out-Null
    Start-Sleep -Seconds 3
    Write-Host "      (đã dừng service MyWEB đang chạy để tránh khóa file)" -ForegroundColor Yellow
}

npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install thất bại" }
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Error "prisma generate thất bại" }
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Write-Error "prisma migrate thất bại" }
npx prisma db seed
if ($LASTEXITCODE -ne 0) { Write-Error "prisma db seed thất bại" }
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "npm run build thất bại" }
Write-Host "[4/5] Build xong" -ForegroundColor Green

# --- 5. Đăng ký Windows Service qua NSSM ---
if (Test-Path $nssm) {
    $npmCmd = (Get-Command npm.cmd).Source
    if (Get-Service MyWEB -ErrorAction SilentlyContinue) {
        & $nssm start MyWEB
        Write-Host "[5/5] Service MyWEB đã tồn tại — khởi động lại xong" -ForegroundColor Green
    } else {
        & $nssm install MyWEB $npmCmd start
        & $nssm set MyWEB AppDirectory (Get-Location).Path
        & $nssm set MyWEB AppStdout C:\appdata\logs\myweb.log
        & $nssm set MyWEB AppStderr C:\appdata\logs\myweb-err.log
        & $nssm start MyWEB
        Write-Host "[5/5] Đã cài và chạy service MyWEB" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Kiểm tra: http://localhost:3000 — tiếp theo làm Bước 3 (domain + HTTPS qua IIS) trong DEPLOY.md" -ForegroundColor Cyan
} else {
    Write-Host "[5/5] Chưa có C:\tools\nssm.exe — tải tại https://nssm.cc/download rồi chạy lại script." -ForegroundColor Yellow
    Write-Host "      Tạm thời có thể chạy tay: npm start" -ForegroundColor Yellow
}
