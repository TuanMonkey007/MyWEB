# Platform cá nhân dạng module

Web app cá nhân, kiến trúc module hóa. Trang chủ `/` là **trang tin công khai** (bài hướng dẫn kỹ thuật, ai cũng đọc được); các module bên trong yêu cầu đăng nhập:

1. **Quản lý Tài chính Cá nhân** (`/finance`) — ví tiền, khoản chi/thu, chuyển khoản nội bộ, đính ảnh hóa đơn, dashboard báo cáo (theo `BA-quan-ly-tai-chinh.md`).
2. **Đề xuất mua hàng** (`/procurement`) — quản lý ngân sách IT theo năm (form BM02B: nhóm khoản mục → quỹ, phân bổ 12 tháng), các đợt đề xuất mua hàng và hạng mục, file bằng chứng đính kèm, **xuất phiếu đề xuất PDF/Excel theo mẫu CT.MH-QT-01/BM01**. Thay thế file Excel "Theo dõi các đề xuất đã mua".
3. **Việc cần làm** (`/todos`) — todolist: thêm nhanh 1 dòng, ưu tiên (cao/vừa/thấp), hạn chót (quá hạn tô đỏ), ghi chú; 2 kiểu xem chuyển qua lại: **checklist** (tick hoàn thành) và **Kanban** (kéo thả Chờ làm / Đang làm / Đã xong; mobile dùng nút ← →).
4. **Kho file** (`/drive`) — drive cá nhân: thư mục lồng nhau, tải lên nhiều file (kéo thả, có tiến độ), xem/tải/đổi tên/xóa. **Lưu trữ tối ưu**:
   - **Chống trùng lặp (dedup)**: file lưu theo mã băm SHA-256 nội dung → 2 file trùng nội dung (kể cả khác tên) chỉ tốn **1 lần** dung lượng đĩa; thẻ thống kê hiển thị dung lượng đã tiết kiệm.
   - **Streaming**: up/down chảy thẳng qua đĩa, không nạp cả file vào RAM (chịu được file lớn, tối đa 2GB/file).
   - **Range request**: xem/tua video, ảnh, PDF ngay trong trình duyệt không phải tải hết; file vật lý băm theo 2 ký tự đầu hash để không dồn một chỗ. Xóa file chỉ giải phóng đĩa khi không còn bản nào trùng nội dung (đếm tham chiếu).
5. **Lọc dữ liệu FaceID** (`/faceid`) — làm sạch dữ liệu chấm công cổng bảo vệ (port từ script Python): kéo thả file Excel gốc → chọn ID loại bỏ / ID ngoại lệ từ danh sách nhân sự tự phát hiện, chỉnh tham số ca làm → chạy xử lý (lọc trùng trong cửa sổ giây, loại ID rác, xử lý user ngoại lệ, phân sheet theo khung giờ, xuất Excel định dạng). **Xử lý ngoại lệ**: mỗi ca chỉ giữ 1 lượt VÀO sớm nhất (dời trước giờ ca) + 1 lượt RA muộn nhất (dời sau giờ ca), **xóa mọi lượt ra/vào giữa giờ** → người ngoại lệ xem như có mặt suốt ca. Có **nhật ký chạy trực tiếp** (stream như console Python) và tùy chọn tên file xuất (giữ tên gốc hoặc nhập mới).

6. **Kho mật khẩu** (`/passwords`) — trình quản lý mật khẩu **mã hóa đầu-cuối** riêng từng user:
   - **Mật khẩu chủ riêng** (khác mật khẩu đăng nhập). Mật khẩu + ghi chú được mã hóa **AES-256-GCM ngay trong trình duyệt** bằng khóa dẫn xuất **PBKDF2-SHA256 600.000 vòng**; server/DB **chỉ lưu bản mã** — lộ file DB cũng không đọc được, mật khẩu chủ không bao giờ rời máy. **Quên mật khẩu chủ = mất dữ liệu, không khôi phục** (bản chất E2E).
   - **Tự khóa sau 5 phút** không dùng + nút khóa tay; copy mật khẩu **tự xóa clipboard sau 45 giây**.
   - **Sinh mật khẩu mạnh** kiểu KeePassXC (độ dài, bộ ký tự A-Z/a-z/0-9/ký hiệu, bỏ ký tự dễ nhầm, thanh đo độ mạnh); nút **copy tài khoản/mật khẩu**, **mở link nhanh**.
   - **Import/Export**: xuất bản sao lưu **đã mã hóa** (`.mwvault.json`, nhập lại cần mật khẩu chủ lúc xuất) hoặc CSV thuần tương thích KeePassXC (có cảnh báo); nhập từ cả hai định dạng.
   - *Lưu ý*: tiêu đề/tài khoản/URL lưu dạng metadata (để tìm kiếm); chỉ **mật khẩu và ghi chú** được mã hóa.

7. **DMS** (`/dms`) — công cụ nghiệp vụ DMS (port từ script Python). Chức năng đầu tiên: **Chuyển tuyến giữa nhà phân phối** — tải file dữ liệu tuyến gốc NPP A (.xls/.xlsx) + nhập mã đơn vị NPP B → sinh file import cho NPP B (đổi mã đơn vị, sinh mã tuyến = ngày + mã NVBH, từ ngày = ngày mai, đánh lại STT, giữ nguyên định dạng mẫu — font/viền/merge/độ rộng cột). Có nhật ký xử lý + cảnh báo (cột lệch, 1 NVBH gộp nhiều tuyến). Đọc được cả .xls cũ (BIFF) qua SheetJS. **Mẫu import lưu một lần** (quản trị viên lưu ở ngay trang DMS, file nằm trong `UPLOAD_DIR/templates`) — những lần chạy sau chỉ cần chọn file gốc; vẫn có thể dùng file mẫu khác cho riêng một lần chạy. Mẫu được kiểm tra cột bắt buộc (STT, Mã đơn vị, Mã tuyến, Mã NVBH, Từ ngày) ngay lúc lưu.

8. **Test Mail Relay** (`/mailtest`) — gửi mail thử để kiểm tra API key và bản ghi DNS của nhà cung cấp: form nhập địa chỉ đích / tiêu đề / nội dung (text hoặc HTML), nhật ký các lần gửi kèm mã mail. Quản trị viên chỉnh cấu hình mail ngay tại đây (xem mục Gửi mail bên dưới).

9. **Reset IMEI DMS** (`/dms-imei`, chỉ ADMIN) — clear IMEI tablet nhân viên Hữu Nghị (`huunghiv2.dmsone.vn`) để đăng nhập máy khác, khỏi mở web DMS tay: nhập mã NV → tra cứu (tên + IMEI hiện tại) → Clear IMEI (+ tùy chọn mở khóa app), có nhật ký thao tác. Tài khoản IT nhập ở Cài đặt hệ thống → Tài khoản IT DMS (mật khẩu lưu mã hóa AES-256-GCM, chỉ hiện bản che). Quyền: `dmsimei` → *Xem* / *Reset IMEI*.

10. **Bài hướng dẫn** (`/articles` quản lý · `/huong-dan` công khai) — kho tài liệu kỹ thuật kiểu diễn đàn:
   - **Trình soạn thảo trực quan** (TipTap): gõ đâu thấy đó, không phải học cú pháp. Thanh công cụ có tiêu đề, đậm/nghiêng/gạch, danh sách, trích dẫn, khối lệnh, canh lề, liên kết, chèn ảnh, chèn bảng. Mọi nút icon đều có nhãn trợ năng và trạng thái bật/tắt.
   - Nội dung lưu ra **HTML**. Bài viết bằng Markdown từ trước vẫn đọc bình thường nhờ cột `format` (`HTML` | `MARKDOWN`) — mỗi định dạng đi đường render riêng.
   - **Mỗi bài tự chọn phạm vi**: `Nháp` (chỉ tác giả + admin) · `Nội bộ` (cần đăng nhập) · `Công khai` (ai vào web cũng đọc). Bài không công khai còn được đánh `noindex` để công cụ tìm kiếm bỏ qua.
   - Trang công khai xếp theo **chuyên mục → danh sách bài** (tiêu đề, người viết, lượt xem, thời gian). Bài không đủ quyền trả **404**, không lộ cả việc bài có tồn tại.
   - Slug tự sinh từ tiêu đề tiếng Việt (`Hướng dẫn tạo VPN Site-to-Site` → `huong-dan-tao-vpn-site-to-site`), trùng thì thêm hậu tố số.
   - **An toàn XSS**: HTML luôn bị lọc ở server theo danh sách cho phép (`lib/markdown-sanitize.ts`) trước khi hiển thị — kể cả HTML do chính trình soạn sinh ra, vì dữ liệu trong DB có thể bị sửa bằng đường khác. Thuộc tính `style` chỉ nhận đúng các giá trị canh lề; mọi giá trị khác bị bỏ (đó là đường vào của `url(javascript:)`, `expression()`, `position:fixed` che màn hình).
   - **Ảnh bìa** cho từng bài (nén bằng sharp, tối đa 1600px/~500KB), phục vụ qua route công khai `/api/anh-bai-viet/<uuid>.jpg`.

**Trang chủ `/`** là trang báo: thanh chuyên mục ngang, bài nổi bật cỡ lớn ở giữa, hai cột phụ hai bên, lưới bài phía dưới. Đồng hồ thế giới chuyển sang **`/dong-ho`**, thanh đầu trang có đồng hồ thu gọn dẫn tới đó.


Thứ tự các module trên sidebar do admin cấu hình tại Cài đặt.

**Công nghệ:** Next.js (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Recharts · SQLite + Prisma · sharp.

---

## 1. Yêu cầu hệ thống

- **Node.js 20 trở lên** (khuyến nghị bản LTS) — tải tại https://nodejs.org
- Không cần cài database riêng (SQLite là 1 file `.db`).

## 2. Chạy trên máy Windows từ A → Z

Mở **PowerShell** (hoặc CMD) trong thư mục project rồi chạy lần lượt:

```powershell
# 1. Cài dependencies
npm install

# 2. Tạo file cấu hình từ mẫu
copy .env.example .env
#    Mở .env và ĐỔI APP_PASSWORD thành mật khẩu của bạn

# 3. Tạo database + bảng
npx prisma migrate dev

# 4. Seed dữ liệu: 8 ví (Tiền mặt, Momo, Zalo Pay, Viettel Money,
#    Viettin, BIDV, Exness, Vantage) + 16 danh mục thu/chi
#    + ngân sách CNTT 2026 (9 nhóm, 49 quỹ) + 5 đợt đề xuất đã theo dõi
npx prisma db seed

# 5. Chạy app (chế độ dev)
npm run dev
```

Mở trình duyệt vào **http://localhost:3000** → đăng nhập bằng mật khẩu trong `.env`.

### Biến môi trường (`.env`)

| Biến | Ý nghĩa | Ví dụ |
|---|---|---|
| `DATABASE_URL` | Đường dẫn file SQLite (tương đối so với thư mục `prisma/`) | `file:./dev.db` hoặc `file:D:/appdata/finance.db` |
| `UPLOAD_DIR` | Thư mục lưu ảnh hóa đơn | `./uploads` hoặc `D:/appdata/uploads` |
| `APP_PASSWORD` | Mật khẩu đăng nhập (bắt buộc đổi) | `mat-khau-manh` |
| `APP_SECRET` | (tùy chọn) Khóa mã hóa bí mật lưu trong DB. Bỏ trống thì tự sinh file `.app-secret` cạnh database | chuỗi ngẫu nhiên dài |

### Màu giao diện

Admin đổi **màu nhấn** ở Cài đặt → Giao diện: chọn 1 trong 9 màu gợi ý hoặc tự nhập
mã `#RRGGBB` bất kỳ. Chỉ lưu đúng một mã màu, 22 token còn lại (sáng + tối) do
`lib/theme-color.ts` tự suy ra.

Điểm đáng chú ý: hệ thống **giữ nguyên sắc và độ tươi của màu bạn chọn nhưng tự dò
độ sáng** cho tới khi đạt tương phản 4.5:1 — nên chọn màu chói như vàng chanh hay
trắng tinh thì nút vẫn đọc được, không vỡ khả năng tiếp cận. Form cài đặt hiện sẵn
ô xem trước cho cả nền sáng lẫn nền tối kèm số đo tương phản.

### Gửi mail (`lib/mail`)

Module gửi mail **trung lập với nhà cung cấp**: code nghiệp vụ chỉ gọi `sendMail(...)`,
còn dùng nhà nào là do **cấu hình** quyết định, **không sửa code**.
Không phụ thuộc SDK riêng của nhà nào (chỉ dùng `fetch` có sẵn).

Cấu hình lấy theo thứ tự **database trước, `.env` sau**:

1. **Database** — quản trị viên chỉnh ngay trên giao diện `/mailtest` → thẻ *Cấu hình mail*.
   Có hiệu lực ngay, không cần khởi động lại. **Đây là cách khuyến nghị cho production**
   (khỏi phải RDP vào máy chủ sửa file).
2. **`.env`** — dự phòng khi database chưa có gì.

API key / mật khẩu SMTP lưu trong DB được **mã hóa AES-256-GCM** (`lib/secret-box.ts`)
vì script backup chép cả file `.db` ra ngoài. Khóa chủ nằm **ngoài** database:
`APP_SECRET` trong `.env` nếu có, không thì tự sinh file `.app-secret` cạnh file database
(file này không lọt vào backup vì `backup.ps1` chỉ chép `finance.db` + thư mục `uploads`).
Mất khóa chủ thì chỉ cần nhập lại key, không mất dữ liệu nào khác.

```ts
import { sendMail } from "@/lib/mail";

await sendMail({
  to: "nguoinhan@gmail.com",
  subject: "Đề xuất đã được duyệt",
  html: "<p>Xin chào...</p>",
  attachments: [{ filename: "phieu.pdf", content: pdfBuffer }],
});
```

| Nhà cung cấp | Cần điền thêm | Ghi chú |
|---|---|---|
| `log` *(mặc định)* | — | Không gửi thật, chỉ in ra console. An toàn cho dev |
| `resend` | `RESEND_API_KEY` | HTTP API cổng 443 |
| `brevo` | `BREVO_API_KEY` | HTTP API cổng 443 |
| `mailgun` | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_REGION` | HTTP API cổng 443 |
| `smtp` | `SMTP_HOST/PORT/USER/PASS` | Dùng cho mọi nhà + mail server nội bộ. Cần `npm i nodemailer` |

Mọi driver đều cần **địa chỉ gửi** (phải thuộc tên miền đã xác minh SPF/DKIM).
Tên biến `.env` tương ứng xem trong `.env.example`.

Gửi thử để kiểm tra cấu hình + bản ghi DNS — bằng dòng lệnh:

```bash
npm run mail:test -- ten.ban@gmail.com
```

...hoặc bằng giao diện: module **Test Mail Relay** (`/mailtest`) có form nhập
địa chỉ đích / tiêu đề / nội dung (text hoặc HTML), nút gửi và nhật ký các lần
gửi gần đây kèm mã mail của nhà cung cấp. Giới hạn 20 mail/giờ mỗi tài khoản
để không đốt quota. Quyền: `mailtest` → *Xem* / *Gửi mail*.

> Trên VPS nên ưu tiên driver HTTP API (cổng 443) vì cổng SMTP 587/465 hay bị chặn.
> Không tự dựng mail server: IP VPS thường bị liệt vào danh sách đen, mail sẽ rơi vào spam.

### Quên mật khẩu đăng nhập

App chưa có chức năng "quên mật khẩu" qua mail. Khi không còn tài khoản ADMIN nào
vào được giao diện, đặt lại từ dòng lệnh **trên máy chủ**, trong thư mục project:

```bash
npm run user:reset
```

Chạy không kèm tham số để xem danh sách tài khoản, rồi:

```bash
npm run user:reset -- admin
```

Sinh sẵn mật khẩu ngẫu nhiên mạnh và in ra màn hình (không ghi vào file nào), đồng
thời **hủy mọi phiên đăng nhập cũ** của tài khoản đó. Muốn tự đặt thì thêm mật khẩu
vào sau tên đăng nhập. Đăng nhập xong nên đổi lại ở trang `/account`.

> Nếu còn một tài khoản ADMIN khác đăng nhập được thì không cần script này — vào
> `/access` đặt lại mật khẩu hộ tài khoản kia nhanh hơn.

## 3. Deploy production trên Windows Server

> **Hướng dẫn deploy VPS đầy đủ từng bước xem tại [DEPLOY.md](DEPLOY.md)** — kèm script tự động
> `scripts/deploy-first-time.ps1` (cài lần đầu), `scripts/update.ps1` (cập nhật code) và
> `scripts/backup.ps1` (sao lưu hằng ngày). Phần dưới đây là bản tóm tắt.

```powershell
# Build bản production
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed        # chỉ lần đầu
npm run build

# Chạy
npm start                  # mặc định cổng 3000
```

**Khuyến nghị cấu hình production:**

1. **Đưa dữ liệu ra ngoài thư mục code** để cập nhật code không đụng dữ liệu:
   ```
   DATABASE_URL="file:C:/appdata/finance.db"
   UPLOAD_DIR="C:/appdata/uploads"
   ```
2. **Chạy như service** (tự khởi động lại khi reboot): dùng [NSSM](https://nssm.cc/) để đăng ký `npm start` thành Windows Service.
3. **Mở qua domain + HTTPS:** dùng **IIS** (có sẵn trong Windows Server) làm reverse proxy — bật module ARR + URL Rewrite, rồi xin chứng chỉ miễn phí bằng [win-acme](https://www.win-acme.com/). Xem hướng dẫn từng bước trong [DEPLOY.md](DEPLOY.md).
4. **Đổi `APP_PASSWORD` thành mật khẩu mạnh trước khi mở public.** Đổi mật khẩu sẽ tự đăng xuất mọi phiên cũ.

## 4. Sao lưu (bắt buộc gồm CẢ HAI)

Backup phải gồm **cả** file database **và** thư mục ảnh:

- File SQLite: `prisma/dev.db` (hoặc `D:/appdata/finance.db` nếu đã đổi)
- Thư mục ảnh hóa đơn: `uploads/` (hoặc `D:/appdata/uploads`)

Ví dụ script backup hằng ngày (Task Scheduler):

```powershell
$d = Get-Date -Format "yyyy-MM-dd"
Copy-Item D:\appdata\finance.db  "D:\backup\finance-$d.db"
Compress-Archive D:\appdata\uploads "D:\backup\uploads-$d.zip" -Force
```

## 5. Cấu trúc project

```
├── prisma/
│   ├── schema.prisma        # Tài chính: Wallet, Expense, Income, Transfer, Category
│   │                        # Mua hàng: BudgetYear, BudgetGroup, BudgetFund,
│   │                        #           Proposal, ProposalItem, Attachment
│   ├── seed.ts              # 8 ví + 16 danh mục + ngân sách 2026 + đề xuất đã theo dõi
│   └── seed-data/           # procurement-2026.json (trích từ Excel BM02B)
├── app/
│   ├── login/               # Trang đăng nhập
│   ├── (main)/              # Các trang sau đăng nhập
│   │   ├── page.tsx         # [Tài chính] Dashboard: tổng tài sản, biểu đồ
│   │   ├── wallets/         # [Tài chính] Quản lý ví + số dư real-time
│   │   ├── transactions/    # [Tài chính] Danh sách gộp chi/thu/chuyển + lọc/tìm
│   │   ├── procurement/     # [Mua hàng] Tổng quan ngân sách theo năm
│   │   │   ├── proposals/   # [Mua hàng] Đợt đề xuất + chi tiết hạng mục
│   │   │   └── budget/      # [Mua hàng] Thiết lập năm/nhóm/quỹ
│   │   └── settings/        # Quản lý danh mục thu/chi
│   └── api/                 # Route Handlers (REST)
│       ├── wallets/ expenses/ incomes/ transfers/ categories/
│       ├── budget-years/ budget-groups/ budget-funds/
│       ├── proposals/ proposal-items/
│       ├── attachments/     # File bằng chứng (PDF/ảnh/Office, tối đa 25MB)
│       ├── upload/          # Ảnh hóa đơn, nén bằng sharp
│       ├── images/[name]/   # Phục vụ ảnh từ UPLOAD_DIR
│       └── auth/            # Đăng nhập / đăng xuất
├── components/              # UI (shadcn/ui, forms, charts, procurement...)
├── lib/
│   ├── balance.ts           # [Tài chính] Số dư & tổng tài sản (BR-1 → BR-5)
│   ├── procurement.ts       # [Mua hàng] Còn lại quỹ = tổng − đã chi thực tế
│   ├── transactions.ts      # Gộp + lọc giao dịch (FR-6)
│   ├── reports.ts           # Số liệu dashboard (FR-7)
│   ├── upload.ts            # Nén/resize ảnh hóa đơn
│   ├── files.ts             # Lưu/xóa file bằng chứng (UPLOAD_DIR/files)
│   └── format.ts            # Định dạng tiền VNĐ (BR-7)
└── proxy.ts                 # Chặn truy cập khi chưa đăng nhập
```

## 6. Module Đề xuất mua hàng — nghiệp vụ

- Cấu trúc: **Năm ngân sách → Nhóm khoản mục (01–09) → Quỹ** (phân bổ 12 tháng, đơn vị VNĐ). Import sẵn kế hoạch 2026 từ file BM02B.
- Mỗi **đợt đề xuất** (số + ngày) gồm nhiều **hạng mục**; mỗi hạng mục trỏ về 1 quỹ, có tiền đề xuất, trạng thái `Chờ mua / Đã mua / Huỷ`, tiền mua thực tế (VAT) khi đã mua.
- **Còn lại của quỹ = Tổng quỹ − Σ tiền thực tế các hạng mục Đã mua** (tính động — app sửa dứt điểm lỗi công thức trừ dây chuyền của file Excel cũ vốn làm sai số dư quỹ Yên Phong ~4,1 triệu). Hạng mục Huỷ không tính. Form thêm hạng mục hiển thị ngay số còn lại của quỹ để cân đối trước khi trình.
- **File bằng chứng** đính được ở 2 cấp: phiếu đề xuất (bản scan đã ký) và từng hạng mục (hóa đơn, ảnh thiết bị lỗi...). Nhận PDF/ảnh/Word/Excel/zip ≤25MB, ảnh tự nén, lưu tên UUID trong `UPLOAD_DIR/files`, xóa hạng mục/phiếu thì file xóa theo.
- Tạo năm mới có tùy chọn **sao chép cấu trúc quỹ** từ năm cũ (số tiền để 0) — tái sử dụng khi sang năm mới hoặc đổi công ty.
- **Xuất phiếu đề xuất** từ trang chi tiết đợt, theo mẫu công ty (A4 ngang, font Times):
  - **PDF — bản trình ký**: không có cột dự trù tiền.
  - **Excel — bản nháp**: thêm cột N "Dự trù (VNĐ)" + công thức tổng, cột này nằm **ngoài vùng in** nên in từ Excel vẫn sạch như bản ký.
  - **Dùng mẫu công ty**: upload file `.xlsx` mẫu thật (giữ nguyên logo, định dạng) ở trang Cài đặt — hệ thống tìm dòng tiêu đề có ô "STT", điền hạng mục vào các dòng kẻ sẵn (thiếu tự chèn thêm), điền các ô "Tổng ngân sách dự kiến/Ngày/Bộ phận đề xuất". Chưa upload mẫu thì dùng layout dựng sẵn.
  - Thông số mẫu (mã tài liệu, ấn bản, chức danh ký...) chỉnh tại `lib/export/template.ts`.
- **Nhập từ Excel** (nút "Nhập từ Excel" ở trang Đợt đề xuất): tải file phiếu đề xuất đã điền → hệ thống đọc các hạng mục (theo cột dưới ô "STT"), tự khớp "Nguồn ngân sách" với quỹ trong năm và tự dò cột dự trù (kể cả khi không có tiêu đề). Bảng xem trước cho chọn quỹ với hạng mục chưa khớp và chọn đơn vị cột dự trù (triệu đồng / VNĐ), rồi tạo thành một đợt đề xuất mới.

## Tài khoản & phân quyền (module riêng `/access`)

- **Đa tài khoản**: đăng nhập bằng username + mật khẩu (băm scrypt, phiên lưu DB — thu hồi được ngay).
- **2 vai trò**: `ADMIN` (toàn quyền mọi module + `/settings` + `/access`) và `USER` (theo quyền được cấp).
- **Phân quyền CHI TIẾT theo hành động**: tại **Phân quyền** (`/access`, chỉ admin), mỗi user có một ma trận quyền cho từng module — 4 quyền cơ bản **Xem / Thêm / Sửa / Xóa** cộng các quyền đặc biệt (Mua hàng: *Thiết lập quỹ*, *Xuất phiếu*; FaceID: *Xử lý file*). Bật "Xem" để mở khóa truy cập module rồi chọn thêm các quyền thao tác.
- **Enforce 2 lớp**: proxy kiểm tra quyền theo `method + path` (server-side, trả 403); giao diện tự **làm mờ (disable)** các nút thao tác user không có quyền (kèm tooltip). Dữ liệu trong module là chung giữa các user.
- **Tài khoản đầu tiên**: khi hệ thống chưa có user nào, đăng nhập `admin` + mật khẩu trong `APP_PASSWORD` (.env) sẽ tự tạo tài khoản quản trị.
- Mọi user tự đổi mật khẩu tại `/account` (yêu cầu mật khẩu cũ; các thiết bị khác bị đăng xuất).
- Khóa tài khoản / đặt lại mật khẩu / đổi quyền → phiên đang mở của user đó bị hủy ngay. Hệ thống luôn giữ tối thiểu 1 admin hoạt động.
- Thêm quyền cho module mới: khai báo trong `lib/permissions.ts` (`MODULE_CAPS`) — ma trận, proxy và badge tự cập nhật.

## Cài đặt & bảo mật

- **Trang Cài đặt** (`/settings`, chỉ admin): tài khoản & phân quyền, **thứ tự module trên sidebar**, chế độ màu sáng/tối/theo máy, font chữ (Inter, Be Vietnam Pro, Roboto), cỡ chữ, tên platform, favicon riêng, mẫu xuất phiếu, danh mục thu/chi.
- **Bảo mật**: xác thực hoàn toàn ở backend (proxy kiểm tra phiên trong DB trên mọi request; API trả 401/403); mật khẩu băm scrypt, không bao giờ lưu phía trình duyệt; chặn dò mật khẩu 5 lần sai/5 phút mỗi IP+username; cookie httpOnly + tự bật cờ `Secure` khi truy cập qua HTTPS.

## 7. Ghi chú nghiệp vụ module Tài chính

- **Số dư ví và tổng tài sản không lưu trong DB** — luôn tính động từ giao dịch (`lib/balance.ts`), nên số liệu không bao giờ lệch.
- Ví **INVEST** (Exness, Vantage): số dư = `USD × tỷ giá`, nhập tay cả hai trên form ví. Giao dịch chuyển tiền đến/từ ví INVEST không tự cộng vào số dư USD — cần cập nhật USD thủ công.
- Ví được phép **âm tạm thời** (không chặn lưu).
- **Chuyển khoản nội bộ** không tính vào báo cáo thu/chi và không làm đổi tổng tài sản.
- Ảnh hóa đơn: tối đa 1 ảnh/giao dịch, server tự nén còn ≤1200px / ~200–400KB, tên file UUID. Xóa giao dịch thì ảnh cũng bị xóa theo.
- Xóa **ví** sẽ xóa mọi giao dịch liên quan (có cảnh báo trước). Danh mục đang dùng thì không xóa được — đổi danh mục các giao dịch trước.
