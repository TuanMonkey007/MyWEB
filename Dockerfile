# ─────────────────────────────────────────────────────────────────────────
# Base: Debian 11 (bullseye) — KHÔNG phải bookworm/Alpine.
#
# Máy đích là CentOS 7: libseccomp mặc định ở đó quá cũ, nên Docker chặn
# syscall clone3 bằng EPERM thay vì ENOSYS. glibc >= 2.34 (Debian 12,
# Ubuntu 22.04) gọi clone3 trước và KHÔNG lùi về clone cũ khi bị EPERM,
# nên container sẽ chết với "Operation not permitted" ngay khi tạo thread.
# Debian 11 mang glibc 2.31 — chưa dùng clone3, nên tránh hẳn vấn đề này
# mà không phải nâng libseccomp của host hay chạy seccomp=unconfined.
#
# Nếu sau này nâng base image, phải đồng thời:
#   - đổi binaryTargets trong prisma/schema.prisma
#   - nâng libseccomp trên host CentOS 7 (hoặc đổi host)
# ─────────────────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS base
ENV NODE_ENV=production
WORKDIR /app


# ── Giai đoạn build ──────────────────────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=development

# Cần mạng ra fonts.googleapis.com: app/layout.tsx nạp Playfair Display qua
# next/font/google, thư viện này tải font LÚC BUILD rồi nhúng vào bản build.
# Mạng bị chặn ở bước này thì build fail.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Sinh Prisma Client cho đúng nền tảng container, trước khi next build
RUN npx prisma generate
RUN npm run build


# ── Giai đoạn chạy ───────────────────────────────────────────────────────
FROM base AS runner

# Chỉ cài dependency production, cài TRONG container để sharp và engine của
# Prisma lấy đúng binary Linux. Tuyệt đối không copy node_modules từ máy dev.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# prisma nằm ở dependencies (không phải devDependencies) nên generate được ở đây
COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY next.config.ts ./

# assets/ PHẢI copy thủ công: lib/export/pdf.ts đọc font Tinos lúc chạy bằng
# path.join(process.cwd(), "assets", "fonts") — không qua import, nên không
# công cụ đóng gói nào lần vết được. Thiếu thư mục này thì chức năng xuất
# PDF phiếu đề xuất trình ký sẽ hỏng, phần còn lại của app vẫn chạy bình thường.
COPY assets ./assets

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# /data là volume: chứa file SQLite, file khoá .app-secret và thư mục uploads
RUN mkdir -p /data/uploads && chown -R node:node /data /app
USER node

ENV DATABASE_URL="file:/data/app.db" \
    UPLOAD_DIR="/data/uploads" \
    PORT=3000 \
    HOSTNAME=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
