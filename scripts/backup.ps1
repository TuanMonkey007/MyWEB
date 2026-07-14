# Backup database + uploads vào C:\backup, giữ 30 ngày gần nhất.
# Đăng ký chạy hằng ngày (xem DEPLOY.md Bước 5):
#   schtasks /Create /TN "Backup MyWEB" /SC DAILY /ST 02:00 /RU SYSTEM `
#     /TR "powershell -ExecutionPolicy Bypass -File C:\apps\MyWEB\scripts\backup.ps1"

$ErrorActionPreference = "Stop"
$d = Get-Date -Format "yyyy-MM-dd"

New-Item -ItemType Directory -Force -Path C:\backup | Out-Null

# Backup PHẢI gồm cả hai: file .db VÀ thư mục uploads
Copy-Item C:\appdata\finance.db "C:\backup\finance-$d.db" -Force
Compress-Archive -Path C:\appdata\uploads -DestinationPath "C:\backup\uploads-$d.zip" -Force

# Xóa bản cũ hơn 30 ngày
Get-ChildItem C:\backup -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force

Write-Host "Backup xong: finance-$d.db + uploads-$d.zip"
