#!/bin/sh
set -e

# Áp migration trước khi mở cổng. Dùng "migrate deploy" chứ không phải
# "migrate dev": deploy chỉ áp các migration đã có, không bao giờ tự sinh
# migration mới và không bao giờ reset database.
echo "→ Áp migration..."
npx prisma migrate deploy

# Cảnh báo sớm nếu quên mount volume: không có /data thì SQLite và toàn bộ
# file upload sẽ nằm trong lớp ghi của container và MẤT SẠCH khi tái tạo.
if ! mountpoint -q /data 2>/dev/null; then
  echo "⚠  /data không phải volume được mount — dữ liệu sẽ mất khi container bị xoá."
fi

echo "→ Khởi động ứng dụng..."
exec "$@"
