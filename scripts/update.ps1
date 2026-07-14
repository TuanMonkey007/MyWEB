# Cập nhật code mới trên Windows Server — chạy trong thư mục gốc project:
#   powershell -ExecutionPolicy Bypass -File .\scripts\update.ps1
# Dữ liệu (C:\appdata) không bị ảnh hưởng.
#
# Lưu ý: script DỪNG service trước khi build vì Windows khóa file .dll
# đang chạy (prisma generate sẽ lỗi EPERM nếu app còn chạy), xong khởi động lại.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
    Write-Error "Hãy chạy script từ thư mục gốc project (nơi có package.json)."
}

$nssm = "C:\tools\nssm.exe"
$hasService = [bool](Get-Service MyWEB -ErrorAction SilentlyContinue) -and (Test-Path $nssm)

Write-Host "[1/5] git pull..." -ForegroundColor Cyan
git pull
if ($LASTEXITCODE -ne 0) { Write-Error "git pull thất bại" }

if ($hasService) {
    Write-Host "[2/5] Dừng service MyWEB (giải phóng file bị khóa)..." -ForegroundColor Cyan
    & $nssm stop MyWEB | Out-Null
    Start-Sleep -Seconds 3
} else {
    Write-Host "[2/5] Không thấy service MyWEB — bỏ qua bước dừng" -ForegroundColor Yellow
}

$buildOk = $false
try {
    Write-Host "[3/5] npm install..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Error "npm install thất bại" }

    Write-Host "[4/5] prisma generate + migrate + build..." -ForegroundColor Cyan
    npx prisma generate
    if ($LASTEXITCODE -ne 0) { Write-Error "prisma generate thất bại" }
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { Write-Error "prisma migrate thất bại" }
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Error "npm run build thất bại" }
    $buildOk = $true
}
finally {
    if ($hasService) {
        Write-Host "[5/5] Khởi động lại service MyWEB..." -ForegroundColor Cyan
        & $nssm start MyWEB | Out-Null
    } else {
        Write-Host "[5/5] Không có service — khởi động tay: npm start" -ForegroundColor Yellow
    }
    if ($buildOk) {
        Write-Host "Cập nhật thành công." -ForegroundColor Green
    } else {
        Write-Host "Cập nhật THẤT BẠI — app được khởi động lại với bản build cũ. Xem lỗi phía trên." -ForegroundColor Red
    }
}
