#!/bin/bash
# Sao lưu database + uploads, giữ 30 ngày gần nhất. Bản Linux của backup.ps1.
#
# Đăng ký chạy hằng ngày lúc 2h sáng:
#   sudo crontab -e
#   0 2 * * * /opt/myweb/app/scripts/backup.sh >> /var/log/myweb-backup.log 2>&1

set -euo pipefail

DATA_DIR="${DATA_DIR:-/opt/myweb/data}"
BACKUP_DIR="${BACKUP_DIR:-/opt/myweb/backup}"
GIU_NGAY="${GIU_NGAY:-30}"
d=$(date +%F)

mkdir -p "$BACKUP_DIR"

# Dùng ".backup" của sqlite3 chứ KHÔNG phải cp: lệnh này lấy ảnh chụp nhất
# quán ngay cả khi app đang ghi. Chép file thô lúc có giao dịch dở dang sẽ
# ra bản backup hỏng. Thiếu sqlite3 thì lùi về cp (chấp nhận rủi ro đó).
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DATA_DIR/app.db" ".backup '$BACKUP_DIR/app-$d.db'"
else
  echo "⚠  không có sqlite3 — chép file thô, nên cài: yum install -y sqlite"
  cp "$DATA_DIR/app.db" "$BACKUP_DIR/app-$d.db"
fi

# Backup PHẢI gồm cả hai: database VÀ uploads. Thiếu một trong hai là vô dụng
# — ảnh bìa bài viết, file drive, phiếu đề xuất đều nằm ở uploads.
tar -czf "$BACKUP_DIR/uploads-$d.tar.gz" -C "$DATA_DIR" uploads

# File khoá .app-secret: thiếu nó thì các API key đã lưu trong DB không giải
# mã được, dù có database cũng vô nghĩa.
if [ -f "$DATA_DIR/.app-secret" ]; then
  cp "$DATA_DIR/.app-secret" "$BACKUP_DIR/app-secret-$d.key"
fi

find "$BACKUP_DIR" -maxdepth 1 -type f -mtime +"$GIU_NGAY" -delete

echo "Backup xong: app-$d.db + uploads-$d.tar.gz"
