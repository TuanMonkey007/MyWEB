# Khảo sát di trú hosting — rời self-host

> Quét toàn bộ repo ngày 2026-10-14. Phạm vi: 70 route API, 30 trang, 23 model Prisma.
> Mục tiêu: không tự host trên máy Windows + IIS nữa.

## 0. Phát hiện quan trọng nhất (đọc trước)

**Module `/predict` không thể rời máy này, bất kể hosting nào.**

[app/api/predict/route.ts](app/api/predict/route.ts) gọi `execFile("python", ...)` tới
một script hard-code đường dẫn Windows:

```
C:/Users/tuannm/AppData/Local/hermes/scripts/mt5_predict.py
```

Script này đọc dữ liệu từ MetaTrader 5 — chỉ chạy trên Windows có terminal MT5 đăng nhập.
Không host nào (Cloudflare, Fly, Railway, Vercel) cho spawn subprocess Python + MT5.

**3 lựa chọn cho module này, phải chốt riêng:**
- Giữ `/predict` chạy trên máy nhà, web gọi sang qua Cloudflare Tunnel (máy nhà không cần IP tĩnh, không mở port)
- Bỏ hẳn module
- Viết lại dùng API giá của sàn thay cho MT5 (đổi hẳn nguồn dữ liệu, không còn pattern theo giờ của MT5)

Mọi ước lượng dưới đây **không bao gồm** việc này.

---

## 1. Dung lượng dữ liệu hiện tại

| Thứ | Dung lượng |
|---|---|
| `prisma/dev.db` | 396 KB |
| `uploads/` (toàn bộ) | 888 KB |

Tổng **~1,3 MB**. Đây là tin tốt: lưu trữ **không phải vấn đề** với bất kỳ hướng nào.
Đừng chọn kiến trúc phức tạp vì sợ hết đĩa — một volume 1 GB đã là thừa mứa nhiều năm.

---

## 2. Bản kiểm kê phụ thuộc

### 2.1 Filesystem — 22 file

Tất cả đọc/ghi qua `process.env.UPLOAD_DIR` hoặc `process.cwd()`:

| Tầng lưu trữ | File | Việc |
|---|---|---|
| Drive | [lib/drive.ts](lib/drive.ts) | stream + băm SHA-256 + dedup content-addressed, 2GB/file |
| Ảnh hóa đơn | [lib/upload.ts](lib/upload.ts) | nén sharp rồi `writeFile` |
| File bằng chứng | [lib/files.ts](lib/files.ts) | nén sharp, 25MB/file |
| Ảnh bìa bài viết | [lib/article-image.ts](lib/article-image.ts) | nén sharp + `existsSync` 2 vị trí |
| Khóa bí mật | [lib/secret-box.ts](lib/secret-box.ts) | `readFileSync`/`writeFileSync`/`chmodSync` file `.app-secret` cạnh DB |
| Temp DMS | [lib/dms-store.ts](lib/dms-store.ts) | ghi `.xlsx`, tự dọn sau 1 giờ |
| Temp FaceID | [lib/faceid-store.ts](lib/faceid-store.ts) | ghi file nguồn + kết quả, tự dọn |
| Mẫu Excel | [lib/export/xlsx-template.ts](lib/export/xlsx-template.ts) | `access()` file mẫu trong `templates/` |

Cộng 14 route API chỉ làm nhiệm vụ **phục vụ file từ đĩa**: `anh-bai-viet`, `attachments`,
`images`, `videos` (có range request), `drive/files/[id]`, `branding/favicon`, `favicon.ico`,
`settings/favicon`, `settings/dms-template`, `settings/export-template`,
`dms/routes`, `dms/routes/result/[token]`, `faceid/process`, `faceid/result/[token]`.

### 2.2 Native binary

| Thư viện | Dùng ở | Chạy serverless được? |
|---|---|---|
| **sharp** | [lib/upload.ts](lib/upload.ts), [lib/files.ts](lib/files.ts), [lib/article-image.ts](lib/article-image.ts), [app/api/upload/route.ts](app/api/upload/route.ts) | **Không** trên Workers (binary nền tảng). Chạy bình thường trong container |
| **pdfkit** | [lib/export/pdf.ts](lib/export/pdf.ts) | Đọc font `.afm` qua `fs` lúc runtime — đúng như comment trong [next.config.ts](next.config.ts). Phải nhúng font nếu lên Workers |

### 2.3 Xử lý nặng RAM

9 route nạp **cả file vào RAM** qua `arrayBuffer()`: `articles/cover`, `dms/routes`,
`faceid/inspect`, `proposals/import/parse`, `settings/dms-template`,
`settings/export-template`, `settings/favicon`, `upload`, và [lib/files.ts](lib/files.ts).

Nặng nhất là **exceljs** (5 file, trong đó [lib/faceid.ts](lib/faceid.ts) 535 dòng):
nạp trọn workbook vào RAM. Giới hạn RAM của Cloudflare Workers là **128 MB cho cả Free
lẫn Paid** — file chấm công vài chục nghìn dòng là OOM.

### 2.4 CPU

`scryptSync(password, salt, 64, { N: 16384 })` ở [lib/auth.ts](lib/auth.ts) mỗi lần đăng nhập,
và `scryptSync` ở [lib/secret-box.ts](lib/secret-box.ts) mỗi lần đọc secret. Trên Workers Free
(**10 ms CPU/request**) là chết chắc; Paid (mặc định 30 s) thì được, nhưng mỗi login tốn CPU
tính tiền. Cloudflare nói `node:crypto` nay "fully supported" trừ vài ngoại lệ không có scrypt
— **vẫn nên test thực tế** chứ chưa chắc.

### 2.5 Thứ chạy tốt ở mọi nơi

- **Gửi mail** — [lib/mail/drivers/](lib/mail/drivers/) chỉ dùng `fetch` tới Brevo/Resend/Mailgun. Kiến trúc này quá tốt, khỏi sửa gì.
- **Kho mật khẩu** — [lib/vault-crypto.ts](lib/vault-crypto.ts) mã hóa bằng Web Crypto **trong trình duyệt**, server chỉ giữ bản mã.
- **Markets / giá vàng** — outbound `fetch`.
- **DMS IMEI** — [lib/dmsimei/client.ts](lib/dmsimei/client.ts) dùng `fetch` + cookie jar tự quản. Chỉ vướng `secret-box` ở chỗ lưu mật khẩu IT.
- **Todos, timetable, finance, procurement (phần DB)** — Prisma thuần.

### 2.6 Hai điểm lệch khác

- [lib/prisma.ts](lib/prisma.ts) dùng singleton toàn cục — đúng cho Node, **sai cho Workers** (phải tạo client kèm adapter theo từng request).
- [proxy.ts](proxy.ts) tra DB mỗi request (`getUserByToken`). Trên Node + SQLite là ~0 ms; trên D1 là một round-trip mạng **cho mọi request**, kể cả file tĩnh.

---

## 3. Phán quyết theo module

| Module | Container + volume | Container + R2 | Workers + D1 + R2 |
|---|---|---|---|
| Todos / Timetable | ✅ nguyên xi | ✅ nguyên xi | ✅ (sửa Prisma client) |
| Finance | ✅ nguyên xi | ⚠️ viết lại `upload.ts` | ⚠️ thêm: bỏ sharp |
| Procurement | ✅ nguyên xi | ⚠️ viết lại `files.ts` | ❌ pdfkit font + exceljs RAM |
| Bài viết | ✅ nguyên xi | ⚠️ viết lại `article-image.ts` | ⚠️ thêm: bỏ sharp |
| Kho mật khẩu | ✅ nguyên xi | ✅ nguyên xi | ⚠️ `secret-box` phải bỏ fs |
| Mailtest | ✅ nguyên xi | ✅ nguyên xi | ✅ nguyên xi |
| DMS IMEI | ✅ nguyên xi | ✅ nguyên xi | ⚠️ `secret-box` |
| Markets / giá vàng | ✅ nguyên xi | ✅ nguyên xi | ✅ nguyên xi |
| DMS chuyển tuyến | ✅ nguyên xi | ⚠️ mẫu + temp sang R2 | ⚠️ exceljs RAM, file nhỏ nên qua được |
| **Drive** | ✅ nguyên xi | ⚠️ thiết kế lại dedup | ❌ body limit 100 MB vs 2 GB — phải đổi sang browser upload trực tiếp R2, dedup băm ở client |
| **FaceID** | ✅ nguyên xi | ⚠️ temp sang R2 | ❌ 128 MB RAM — rủi ro cao, có thể phải bỏ |
| **Predict** | ❌ cần Windows + MT5 | ❌ | ❌ |

---

## 4. Ước lượng công

### Hướng A — Container + volume (Fly.io / Railway / Render)

| Việc | Công |
|---|---|
| Dockerfile (Node 20, `prisma generate`, standalone build) | 2 h |
| Cấu hình volume mount cho `prisma/` + `uploads/`, env secrets | 1 h |
| Thay [scripts/backup.ps1](scripts/backup.ps1) (PowerShell) bằng backup Linux | 1 h |
| Test lại 70 route trên môi trường thật | 2 h |
| **Tổng** | **~0,75 ngày** |

**Sửa code ứng dụng: gần như bằng 0.** SQLite giữ nguyên file, `uploads/` giữ nguyên thư mục,
sharp + pdfkit + exceljs + upload 2 GB + range request chạy y như hiện tại.

Giá: ~5 USD/tháng. Deploy bằng `git push`. Không RDP, không IIS, không ARR, không win-acme.

**Hai cảnh báo thật:**
- SQLite trên volume ⇒ **chỉ chạy được 1 instance**, không scale ngang. Với app cá nhân thì không sao.
- Volume **không tự backup**. Nên thêm **Litestream** replicate SQLite liên tục lên **R2** — vẫn dùng được R2 như bạn muốn, chi phí gần như 0, mà không phải sửa một dòng code nào.

### Hướng B — Container + R2 cho file

Hướng A, cộng thêm: gom 8 tầng lưu trữ ở §2.1 vào **một interface storage duy nhất**,
rồi cài một bản chạy S3 API trỏ sang R2.

| Việc | Công |
|---|---|
| Thiết kế interface + bản `local` (giữ nguyên hành vi) | 3 h |
| Bản `r2` qua S3 client, 8 tầng lưu trữ | 5 h |
| Drive: dedup theo content-hash map sang R2 key, range request R2 hỗ trợ sẵn | 3 h |
| Di chuyển 888 KB dữ liệu cũ + test | 2 h |
| **Tổng thêm** | **~1,5 ngày** |

Đáng làm nếu bạn muốn đĩa không bao giờ là mối lo, và muốn file sống độc lập với container.

### Hướng C — Workers + D1 + R2

| Việc | Công | Rủi ro |
|---|---|---|
| Nâng Next 16.2.10 → 16.2.11 (OpenNext 1.20.2 yêu cầu `>=16.2.11`), dựng adapter | 0,5 ngày | OpenNext giờ chỉ còn ở chế độ bảo trì; Cloudflare khuyên dùng **vinext** nhưng vinext đang **beta** |
| Prisma → D1 adapter, bỏ singleton, chuyển 23 model, migration qua Wrangler | 1,5 ngày | Adapter D1 **vẫn là Preview** |
| 8 tầng lưu trữ → R2 | 2 ngày | thấp |
| Drive: browser upload trực tiếp lên R2 (presigned multipart), dedup phải băm ở client | 2 ngày | cao — đổi cả giao thức upload |
| Bỏ sharp → Cloudflare Images hoặc wasm encoder | 1 ngày | trung bình, chất lượng nén khác đi |
| pdfkit: nhúng font `.afm` vào bundle hoặc đổi thư viện | 1 ngày | trung bình |
| FaceID + exceljs trong 128 MB RAM | 1–2 ngày | **rất cao** — có thể bất khả thi, phải đẩy sang Container riêng |
| `secret-box` → Workers Secrets, bỏ `.app-secret` | 0,5 ngày | thấp |
| `proxy.ts`: tra DB mỗi request trên D1 → cần cache | 0,5 ngày | trung bình |
| Test lại 70 route | 1 ngày | — |
| **Tổng** | **~11–12 ngày** | |

Giá: Workers Paid 5 USD/tháng + D1 + R2 ≈ 5–6 USD/tháng. **Không rẻ hơn hướng A.**

---

## 5. Kết luận

| | Công | Tiền/tháng | Sửa code | Mất module |
|---|---|---|---|---|
| **A. Container + volume** | 0,75 ngày | ~5 USD | ~0 | predict |
| **B. A + R2** | 2,25 ngày | ~5 USD | 8 tầng lưu trữ | predict |
| **C. Workers + D1 + R2** | 11–12 ngày | ~5–6 USD | gần như toàn bộ tầng I/O | predict, FaceID (khả năng cao), Drive 2 GB |

**Khuyến nghị: làm hướng A ngay, thêm Litestream → R2 để backup.** Đạt đúng mục tiêu
"không tự host nữa" trong một buổi, giữ nguyên toàn bộ tính năng (trừ predict),
mà vẫn dùng R2. Khi nào thấy thực sự cần thì nâng lên B — nó là bước tiến hóa tự nhiên,
không phải làm lại.

Hướng C chỉ hợp lý nếu bạn **muốn học Workers** hoặc cần serve toàn cầu ở edge.
Xét trên app này, nó là đổi "mệt vì vận hành" thành "mệt vì viết lại", mà tiền không giảm.

---

## Nguồn tham chiếu

- [Workers platform limits](https://developers.cloudflare.com/workers/platform/limits) — RAM 128 MB, CPU, body limit
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare) — hỗ trợ Next 16, dải peer dependency
- [Cloudflare Next.js framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) — vinext là mặc định mới
- [Prisma + Cloudflare D1](https://prisma.io/docs/orm/overview/databases/cloudflare-d1) — trạng thái Preview
- [node:crypto trên Workers](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto)
