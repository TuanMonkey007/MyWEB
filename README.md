# Platform cá nhân dạng module

Web app cá nhân **một người dùng**, kiến trúc module hóa. Trang chủ `/` là landing page public (giới thiệu bản thân — đang là placeholder); các module bên trong yêu cầu đăng nhập:

1. **Quản lý Tài chính Cá nhân** (`/finance`) — ví tiền, khoản chi/thu, chuyển khoản nội bộ, đính ảnh hóa đơn, dashboard báo cáo (theo `BA-quan-ly-tai-chinh.md`).
2. **Đề xuất mua hàng** (`/procurement`) — quản lý ngân sách IT theo năm (form BM02B: nhóm khoản mục → quỹ, phân bổ 12 tháng), các đợt đề xuất mua hàng và hạng mục, file bằng chứng đính kèm, **xuất phiếu đề xuất PDF/Excel theo mẫu CT.MH-QT-01/BM01**. Thay thế file Excel "Theo dõi các đề xuất đã mua".

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
  - Thông số mẫu (mã tài liệu, ấn bản, chức danh ký...) chỉnh tại `lib/export/template.ts`.

## 7. Ghi chú nghiệp vụ module Tài chính

- **Số dư ví và tổng tài sản không lưu trong DB** — luôn tính động từ giao dịch (`lib/balance.ts`), nên số liệu không bao giờ lệch.
- Ví **INVEST** (Exness, Vantage): số dư = `USD × tỷ giá`, nhập tay cả hai trên form ví. Giao dịch chuyển tiền đến/từ ví INVEST không tự cộng vào số dư USD — cần cập nhật USD thủ công.
- Ví được phép **âm tạm thời** (không chặn lưu).
- **Chuyển khoản nội bộ** không tính vào báo cáo thu/chi và không làm đổi tổng tài sản.
- Ảnh hóa đơn: tối đa 1 ảnh/giao dịch, server tự nén còn ≤1200px / ~200–400KB, tên file UUID. Xóa giao dịch thì ảnh cũng bị xóa theo.
- Xóa **ví** sẽ xóa mọi giao dịch liên quan (có cảnh báo trước). Danh mục đang dùng thì không xóa được — đổi danh mục các giao dịch trước.
