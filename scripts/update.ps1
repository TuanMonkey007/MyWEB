# Cập nhật code mới trên Windows Server — chạy trong thư mục gốc project:
#   powershell -ExecutionPolicy Bypass -File .\scripts\update.ps1
# Dữ liệu (C:\appdata) không bị ảnh hưởng.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
    Write-Error "Hãy chạy script từ thư mục gốc project (nơi có package.json)."
}

Write-Host "[1/4] git pull..." -ForegroundColor Cyan
git pull
if ($LASTEXITCODE -ne 0) { Write-Error "git pull thất bại" }

Write-Host "[2/4] npm install..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install thất bại" }

Write-Host "[3/4] prisma generate + migrate + build..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Error "prisma generate thất bại" }
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Write-Error "prisma migrate thất bại" }
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "npm run build thất bại" }

Write-Host "[4/4] Restart service..." -ForegroundColor Cyan
if (Get-Service MyWEB -ErrorAction SilentlyContinue) {
    C:\tools\nssm.exe restart MyWEB
    Write-Host "Đã cập nhật và restart service MyWEB." -ForegroundColor Green
} else {
    Write-Host "Không thấy service MyWEB — khởi động tay: npm start" -ForegroundColor Yellow
}
