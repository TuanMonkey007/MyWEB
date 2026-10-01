"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Code2,
  Database,
  ExternalLink,
  FileSpreadsheet,
  HardDrive,
  Layers,
  Lock,
  Mail,
  MapPin,
  Phone,
  PiggyBank,
  ScanFace,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

// Danh mục filter bộ công cụ
const TOOL_CATEGORIES = [
  "Tất cả",
  "DMS & Phân phối",
  "Dữ liệu & Nhân sự",
  "Tài chính & Mua sắm",
  "Tiện ích & Bảo mật",
] as const;

type ToolCategory = (typeof TOOL_CATEGORIES)[number];

interface ToolItem {
  id: string;
  title: string;
  category: ToolCategory;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  tag: string;
  highlight?: boolean;
}

const TOOLS_DATA: ToolItem[] = [
  {
    id: "dms",
    title: "Chuyển tuyến giữa các NPP",
    category: "DMS & Phân phối",
    description:
      "Đổi dữ liệu tuyến từ NPP cũ sang mẫu import chuẩn cho NPP mới. Tự động sinh mã tuyến mới theo ngày và mã NVBH, ngày hiệu lực từ ngày mai.",
    icon: FileSpreadsheet,
    href: "/dms",
    tag: "DMS cốt lõi",
    highlight: true,
  },
  {
    id: "faceid",
    title: "Lọc dữ liệu chấm công FaceID",
    category: "Dữ liệu & Nhân sự",
    description:
      "Làm sạch dữ liệu chấm công cổng bảo vệ: lọc quét trùng khuôn mặt, loại bỏ ID không cần thiết, sửa giờ ngoại lệ và tự động phân tách sheet theo ca.",
    icon: ScanFace,
    href: "/faceid",
    tag: "Tự động hóa",
    highlight: true,
  },
  {
    id: "procurement",
    title: "Quản lý Ngân sách mua sắm",
    category: "Tài chính & Mua sắm",
    description:
      "Theo dõi quỹ mua hàng phân bổ 12 tháng, tổng hợp các đợt đề xuất mua sắm, kiểm soát hóa đơn VAT và tiến độ giải ngân từng hạng mục.",
    icon: PiggyBank,
    href: "/procurement",
    tag: "Quản trị quỹ",
  },
  {
    id: "finance",
    title: "Sổ thu chi & Quản lý ví",
    category: "Tài chính & Mua sắm",
    description:
      "Theo dõi dòng tiền đa ví (tiền mặt, tài khoản ngân hàng), ghi chép thu chi nhanh chóng, báo cáo phân bổ danh mục và đối soát số dư thực tế.",
    icon: Wallet,
    href: "/finance",
    tag: "Dòng tiền",
  },
  {
    id: "passwords",
    title: "Kho mật khẩu mã hóa đầu-cuối",
    category: "Tiện ích & Bảo mật",
    description:
      "Lưu trữ tài khoản và thông tin mật với mã hóa AES-GCM 256-bit trực tiếp trên trình duyệt. Máy chủ chỉ lưu bản mã, tự động khóa sau 5 phút.",
    icon: ShieldCheck,
    href: "/passwords",
    tag: "Zero-Knowledge",
  },
  {
    id: "todos",
    title: "Quản lý công việc & Kanban",
    category: "Tiện ích & Bảo mật",
    description:
      "Bảng Kanban kéo thả trực quan kèm danh sách việc cần làm, phân loại mức độ ưu tiên Cao - Vừa - Thấp, theo dõi hạn chót deadline hiệu quả.",
    icon: Layers,
    href: "/todos",
    tag: "Năng suất",
  },
  {
    id: "drive",
    title: "Kho lưu trữ file chống trùng",
    category: "Tiện ích & Bảo mật",
    description:
      "Lưu trữ file và tài liệu nội bộ theo cây thư mục phân cấp. Cơ chế băm SHA-256 chống trùng lặp, chia sẻ file an toàn tốc độ cao.",
    icon: HardDrive,
    href: "/drive",
    tag: "Lưu trữ số",
  },
];

const ARTICLES_DATA = [
  {
    slug: "huong-dan-chuyen-tuyen-npp",
    title: "Hướng dẫn chuyển đổi tuyến bán hàng DMS giữa các NPP không bị lỗi định dạng",
    category: "Hệ thống DMS",
    summary:
      "Quy trình chuẩn để trích xuất dữ liệu từ NPP cũ, chuẩn hóa định dạng ngày tháng, mã đơn vị và mã NVBH để nạp vào hệ thống mới trong vài phút.",
    readTime: "5 phút đọc",
    date: "Tháng 09, 2026",
  },
  {
    slug: "quy-trinh-loc-du-lieu-faceid",
    title: "Quy trình làm sạch và phân tách log chấm công FaceID định kỳ hàng tháng",
    category: "Dữ liệu & Nhân sự",
    summary:
      "Phương pháp phát hiện và lọc bỏ các lượt quét khuôn mặt trùng lặp trong khoảng thời gian ngắn, loại trừ ID chạy thử và phân tách ca trực.",
    readTime: "4 phút đọc",
    date: "Tháng 09, 2026",
  },
  {
    slug: "thu-thuat-excel-du-lieu-lon",
    title: "Thủ thuật xử lý file Excel lớn với hàng trăm nghìn dòng dữ liệu bán hàng",
    category: "Thủ thuật Dữ liệu",
    summary:
      "Kỹ thuật tối ưu hóa bảng tính phân phối, tránh treo máy và tự động hóa thao tác đối soát báo cáo phân phối 5.2 và 6.4.4 nhanh chóng.",
    readTime: "7 phút đọc",
    date: "Tháng 08, 2026",
  },
  {
    slug: "bao-mat-zero-knowledge-aes-gcm",
    title: "Ứng dụng mã hóa đầu-cuối AES-GCM bảo vệ dữ liệu bí mật trên nền tảng Web",
    category: "Bảo mật & Công nghệ",
    summary:
      "Cách hiện thực mã hóa Web Crypto API phía client: dẫn xuất khóa PBKDF2 giúp lưu trữ mật khẩu an toàn tuyệt đối ngay cả khi lộ database.",
    readTime: "6 phút đọc",
    date: "Tháng 08, 2026",
  },
];

export default function PersonalLandingPage() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>("Tất cả");
  const [contactForm, setContactForm] = useState({
    name: "",
    emailOrPhone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/articles/featured")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFeaturedArticles(data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredTools =
    activeCategory === "Tất cả"
      ? TOOLS_DATA
      : TOOLS_DATA.filter((tool) => tool.category === activeCategory);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.emailOrPhone || !contactForm.message) {
      toast.error("Vui lòng điền đủ Họ tên, Email/SĐT và Nội dung lời nhắn!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Gửi lời nhắn thất bại. Vui lòng thử lại!");
      }
      toast.success("Lời nhắn của bạn đã được chuyển thẳng vào danh sách việc cần làm (Todos) của Tuấn!");
      setContactForm({ name: "", emailOrPhone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1C1917] selection:bg-primary selection:text-white dark:bg-[#18110B] dark:text-[#FAF7F0]">
      {/* ── TOP UTILITY STRIP ── */}
      <div className="border-b-2 border-[#1C1917] bg-[#1E140C] text-xs text-[#FAF7F0] py-2 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Sẵn sàng kết nối & Hỗ trợ kỹ thuật
            </span>
            <span className="hidden md:inline-block text-primary">|</span>
            <span className="hidden md:flex items-center gap-1.5 font-medium">
              <MapPin className="size-3.5 text-primary" /> Hà Nội, Việt Nam · Hữu Nghị Food
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-stone-400">Email:</span>
            <a
              href="mailto:tuannm@huunghi.com.vn"
              className="font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Mail className="size-3.5" /> tuannm@huunghi.com.vn
            </a>
          </div>
        </div>
      </div>

      {/* ── FLOATING NAVIGATION BAR (Warm Neo-Brutalism) ── */}
      <header className="sticky top-4 z-50 px-4 sm:px-6">
        <nav className="mx-auto max-w-6xl rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] px-5 py-3 shadow-neo transition-all flex items-center justify-between dark:bg-[#22170F]">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-primary text-xs font-black tracking-wide text-primary-foreground shadow-neo-sm">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-xl font-bold tracking-tight text-[#1C1917] leading-none dark:text-[#FAF7F0]">
                TUANNM
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                Data & DMS Solutions
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">
            <a href="#hero" className="hover:text-primary transition-colors">
              Trang chủ
            </a>
            <a href="#about" className="hover:text-primary transition-colors">
              Giới thiệu
            </a>
            <a href="#tools" className="hover:text-primary transition-colors">
              Bộ công cụ
            </a>
            <a href="#articles" className="hover:text-primary transition-colors">
              Bài viết
            </a>
            <a href="#contact" className="hover:text-primary transition-colors">
              Liên hệ
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/markets"
              className="inline-flex items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-amber-400 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-stone-900 shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo transition-all"
            >
              <TrendingUp className="size-3.5 text-stone-900" />
              <span>Giá Vàng & BTC</span>
            </Link>
            <Link
              href="/bai-viet"
              className="hidden sm:inline-flex items-center gap-1 rounded-xs border-2 border-[#1C1917] bg-white px-3 py-1.5 text-xs font-bold text-[#1C1917] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all dark:bg-card dark:text-foreground"
            >
              Tài liệu
            </Link>
            <Link
              href="/finance"
              className="inline-flex cursor-pointer items-center justify-center rounded-xs border-2 border-[#1C1917] bg-primary px-4 py-1.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Vào Workspace <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      {/* ── HERO SECTION ── */}
      <section id="hero" className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-16">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Column: Personal Introduction & Tagline */}
          <div className="space-y-6 lg:col-span-7">
            {/* Status pill badge */}
            <div className="inline-flex items-center gap-2 rounded-xs border-2 border-[#1C1917] bg-white px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#1C1917] shadow-neo-sm dark:bg-card dark:text-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Kỹ sư Dữ liệu & Giải pháp DMS · Hữu Nghị Food
            </div>

            {/* Main Headline */}
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-[#1C1917] leading-[1.08] dark:text-[#FAF7F0]">
              TỰ ĐỘNG HÓA QUY TRÌNH &
              <span className="block text-primary">GIẢI PHÁP SỐ HÓA DỮ LIỆU</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-stone-700 font-medium dark:text-stone-300">
              Chào bạn, tôi là <b>Nguyễn Minh Tuấn (Tuannm)</b>. Đây là không gian làm việc số và cổng
              truy cập các tiện ích nội bộ: tự động hóa dữ liệu tuyến bán hàng DMS, làm sạch log FaceID,
              quản trị ngân sách mua sắm và tài chính cá nhân.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#tools"
                className="inline-flex cursor-pointer items-center justify-center rounded-xs border-2 border-[#1C1917] bg-primary px-7 py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                Khám phá Bộ Tools ({TOOLS_DATA.length})
              </a>
              <Link
                href="/login"
                className="inline-flex cursor-pointer items-center justify-center rounded-xs border-2 border-[#1C1917] bg-white px-6 py-3 text-sm font-bold text-[#1C1917] shadow-neo hover:bg-[#FDF9F3] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:bg-card dark:text-foreground"
              >
                Đăng nhập Workspace
              </Link>
            </div>

            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-bold text-stone-700 dark:text-stone-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>100% Chạy Offline / Local Server</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>Bảo mật AES-GCM Zero-Knowledge</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>Tối ưu hóa bảng tính lớn (SheetJS)</span>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Bento Highlights Cards */}
          <div className="relative lg:col-span-5">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Box 1: DMS Route Automation */}
              <div className="rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo flex flex-col justify-between aspect-square dark:bg-card">
                <div className="flex size-10 items-center justify-center rounded-xs border border-[#1C1917] bg-[#FDF1EA] text-primary shadow-neo-sm">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    DMS Tool
                  </div>
                  <div className="font-editorial text-base font-bold text-foreground leading-snug mt-1">
                    Chuyển tuyến NPP thần tốc
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    Tự động gán mã NVBH và ngày hiệu lực cho NPP mới.
                  </p>
                </div>
              </div>

              {/* Box 2: FaceID Log Clean */}
              <div className="rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] p-4 shadow-neo flex flex-col justify-between aspect-square dark:bg-[#22170F]">
                <div className="flex size-10 items-center justify-center rounded-xs border border-[#1C1917] bg-white text-primary shadow-neo-sm dark:bg-card">
                  <ScanFace className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Nhân sự
                  </div>
                  <div className="font-editorial text-base font-bold text-foreground leading-snug mt-1">
                    Lọc dữ liệu FaceID
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    Lọc quét trùng cổng bảo vệ, sửa giờ ngoại lệ.
                  </p>
                </div>
              </div>

              {/* Box 3: Procurement & Budget */}
              <div className="rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] p-4 shadow-neo flex flex-col justify-between aspect-square dark:bg-[#22170F]">
                <div className="flex size-10 items-center justify-center rounded-xs border border-[#1C1917] bg-white text-primary shadow-neo-sm dark:bg-card">
                  <PiggyBank className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Ngân sách
                  </div>
                  <div className="font-editorial text-base font-bold text-foreground leading-snug mt-1">
                    Quản trị quỹ mua hàng
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    Phân bổ 12 tháng, đối soát VAT và đề xuất.
                  </p>
                </div>
              </div>

              {/* Box 4: Finance */}
              <div className="rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo flex flex-col justify-between aspect-square dark:bg-card">
                <div className="flex size-10 items-center justify-center rounded-xs border border-[#1C1917] bg-[#FDF1EA] text-primary shadow-neo-sm">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Dòng tiền
                  </div>
                  <div className="font-editorial text-base font-bold text-foreground leading-snug mt-1">
                    Sổ thu chi đa ví
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    Ghi chép thu chi, đối soát số dư thực tế.
                  </p>
                </div>
              </div>
            </div>

            {/* Floating orange badge */}
            <div className="absolute -bottom-5 right-4 z-10 rounded-xs border-2 border-[#1C1917] bg-primary px-4 py-2.5 text-center text-primary-foreground shadow-neo">
              <div className="font-editorial text-xl font-black leading-none">5+ NĂM</div>
              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">
                Vận hành & Số hóa DMS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION DIVIDER ── */}
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6">
        <div className="h-0.5 flex-1 bg-stone-300 dark:bg-stone-800" />
        <div className="mx-4 text-primary">
          <Terminal className="size-5" />
        </div>
        <div className="h-0.5 flex-1 bg-stone-300 dark:bg-stone-800" />
      </div>

      {/* ── GIỚI THIỆU (ABOUT ME & PHILOSOPHY) ── */}
      <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left: Bio card & Philosophy Quote */}
          <div className="space-y-6 lg:col-span-6">
            <div className="rounded-xs border-2 border-[#1C1917] bg-white p-6 sm:p-8 shadow-neo dark:bg-card">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm font-editorial text-2xl font-black">
                  T
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold uppercase tracking-tight text-foreground">
                    Nguyễn Minh Tuấn
                  </h3>
                  <p className="text-xs font-bold text-primary">
                    Phòng DMS & CNTT — Hữu Nghị Food
                  </p>
                </div>
              </div>

              <div className="my-5 border-t-2 border-[#1C1917] dark:border-stone-800" />

              <div className="font-serif text-3xl font-bold leading-none text-primary">“</div>
              <p className="font-serif italic text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-200 mt-1">
                &ldquo;Mọi quy trình thủ công lặp đi lặp lại hàng ngày trên bảng tính đều xứng đáng được tự động hóa.
                Khi dữ liệu được chuẩn hóa ngay từ gốc, quyết định kinh doanh sẽ chính xác và áp lực vận hành
                sẽ được giải tỏa hoàn toàn.&rdquo;
              </p>

              <div className="mt-4 flex items-center justify-between text-xs font-bold text-muted-foreground border-t border-border pt-3">
                <span>Trọng tâm: Hiệu quả thực chiến</span>
                <span>Phương châm: Đơn giản & Bền bỉ</span>
              </div>
            </div>

            {/* 3 Stat boxes */}
            <div className="grid grid-cols-3 gap-3.5">
              <div className="rounded-xs border-2 border-[#1C1917] bg-white p-3.5 text-center shadow-neo-sm dark:bg-card">
                <div className="font-editorial text-2xl sm:text-3xl font-bold text-primary">10+</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                  Tools thực chiến
                </div>
              </div>

              <div className="rounded-xs border-2 border-[#1C1917] bg-white p-3.5 text-center shadow-neo-sm dark:bg-card">
                <div className="font-editorial text-2xl sm:text-3xl font-bold text-primary">100%</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                  Tự động hóa
                </div>
              </div>

              <div className="rounded-xs border-2 border-[#1C1917] bg-white p-3.5 text-center shadow-neo-sm dark:bg-card">
                <div className="font-editorial text-2xl sm:text-3xl font-bold text-primary">50K+</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                  Dòng dữ liệu/ngày
                </div>
              </div>
            </div>
          </div>

          {/* Right: Narrative Story & Core Tech Stack */}
          <div className="space-y-6 lg:col-span-6 lg:pl-4">
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-primary">
                Về bản thân & Chuyên môn
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                Xây dựng nền tảng giải quyết các bài toán vận hành phân phối
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-stone-700 font-medium dark:text-stone-300">
              Với hơn 5 năm gắn bó cùng hệ thống phân phối và dữ liệu DMS tại <b>Hữu Nghị Food</b>, tôi
              thấu hiểu sâu sắc những điểm nghẽn mà đội ngũ vận hành gặp phải: lỗi sai dữ liệu khi chuyển giao
              nhà phân phối, thời gian đối soát chương trình khuyến mại (CTKM) kéo dài, bảng tính Excel dung lượng
              khổng lồ thường xuyên bị treo đơ, hay dữ liệu chấm công FaceID phức tạp.
            </p>

            <p className="text-sm leading-relaxed text-stone-700 font-medium dark:text-stone-300">
              Hệ thống website này ra đời với mục tiêu tích hợp toàn bộ các công cụ giải quyết triệt để từng bài
              toán cụ thể đó: từ chuyển tuyến, gộp báo cáo, đối soát 5.2 & 6.4.4 cho đến quản lý dòng tiền, theo
              dõi ngân sách mua hàng và chia sẻ tài liệu hướng dẫn kỹ thuật.
            </p>

            {/* Skills & Technologies badges */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Công nghệ & Kỹ năng áp dụng
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "DMS & Distribution Pipelines",
                  "Next.js 15 & React 19",
                  "TypeScript",
                  "Tailwind CSS Neo-Brutalism",
                  "SheetJS / Excel Automation",
                  "SQLite & Prisma ORM",
                  "Canvas / Image Processing",
                  "Web Crypto (AES-256-GCM)",
                  "Báo cáo đối soát 5.2 / 6.4.4",
                ].map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-xs border-2 border-[#1C1917] bg-white px-2.5 py-1 text-xs font-bold text-foreground shadow-neo-sm dark:bg-card"
                  >
                    <Code2 className="mr-1 size-3 text-primary" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BỘ CÔNG CỤ (TOOLS & APPLICATIONS SHOWCASE) ── */}
      <section id="tools" className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="text-center space-y-3 mb-10">
          <div className="text-xs font-black uppercase tracking-widest text-primary">
            Hệ sinh thái tiện ích số
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            BỘ CÔNG CỤ NỘI BỘ & TỰ ĐỘNG HÓA
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-stone-600 font-medium dark:text-stone-400">
            Các công cụ được thiết kế chuyên biệt để tự động hóa hoàn toàn các tác vụ dữ liệu thường ngày
          </p>

          {/* Filter Categories Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer rounded-xs border-2 border-[#1C1917] px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-neo-sm"
                    : "bg-white text-[#1C1917] hover:bg-[#FAF7F0] dark:bg-card dark:text-foreground dark:hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="group flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-5 shadow-neo transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg dark:bg-card"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div className="flex size-11 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] text-primary shadow-neo-sm dark:bg-[#22170F]">
                      <Icon className="size-5 stroke-[2.5]" />
                    </div>
                    <span className="rounded-xs border border-[#1C1917] bg-[#FDF1EA] px-2 py-0.5 text-[10px] font-black uppercase text-primary shadow-neo-sm dark:bg-[#2C1F15]">
                      {tool.tag}
                    </span>
                  </div>

                  <h3 className="font-editorial text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-stone-600 font-medium dark:text-stone-400">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t-2 border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    {tool.category}
                  </span>
                  <Link
                    href={tool.href}
                    className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
                  >
                    Mở công cụ <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BÀI VIẾT & HƯỚNG DẪN KỸ THUẬT (ARTICLES & KNOWLEDGE BASE) ── */}
      <section id="articles" className="border-t-2 border-[#1C1917] bg-[#F5EFEB] dark:bg-[#1E140C] py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-primary">
                Kho kiến thức & Tài liệu
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-bold uppercase tracking-tight text-foreground mt-1">
                BÀI VIẾT & HƯỚNG DẪN KỸ THUẬT
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium dark:text-stone-400 mt-1">
                Tổng hợp tài liệu vận hành DMS, thủ thuật xử lý dữ liệu lớn và các tiêu chuẩn bảo mật.
              </p>
            </div>
            <Link
              href="/bai-viet"
              className="inline-flex items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-foreground shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all dark:bg-card"
            >
              Xem toàn bộ thư viện bài viết <ArrowRight className="size-3.5 text-primary" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(featuredArticles.length > 0 ? featuredArticles : ARTICLES_DATA).map((article) => (
              <div
                key={article.id || article.slug}
                className="group flex flex-col justify-between overflow-hidden rounded-xs border-2 border-[#1C1917] bg-white shadow-neo transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg dark:bg-card"
              >
                <div>
                  {/* Ảnh bìa bài viết nếu có */}
                  {article.coverImage ? (
                    <Link href={`/bai-viet/${article.slug}`} className="block aspect-video w-full overflow-hidden border-b-2 border-[#1C1917] bg-stone-100 dark:bg-stone-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/anh-bai-viet/${article.coverImage}`}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                  ) : (
                    <Link href={`/bai-viet/${article.slug}`} className="flex aspect-video w-full items-center justify-center border-b-2 border-[#1C1917] bg-[#F5EFEB] p-4 text-center dark:bg-[#2C1F15]">
                      <span className="font-editorial text-base font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        {typeof article.category === "string" ? article.category : article.category?.name || "Tài liệu kỹ thuật"}
                      </span>
                    </Link>
                  )}

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="rounded-xs border border-[#1C1917] bg-[#FDF1EA] px-2 py-0.5 text-[10px] font-black uppercase text-primary shadow-neo-sm dark:bg-[#2C1F15]">
                        {typeof article.category === "string" ? article.category : article.category?.name ?? "Tài liệu"}
                      </span>
                      {article.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-amber-400 px-1.5 py-0.5 text-[10px] font-black uppercase text-stone-900 shadow-neo-sm">
                          <Sparkles className="size-2.5 text-stone-900" /> Nổi bật
                        </span>
                      )}
                    </div>

                    <Link href={`/bai-viet/${article.slug}`}>
                      <h3 className="font-editorial text-lg sm:text-xl font-bold text-foreground leading-snug hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                    </Link>

                    {article.summary && (
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600 font-medium dark:text-stone-400 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3.5 border-t-2 border-[#1C1917] flex items-center justify-between dark:border-stone-800">
                    <span className="text-[11px] font-bold text-muted-foreground font-mono">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString("vi-VN")
                        : article.date || "Mới đăng"}{" "}
                      · {article.author?.displayName || article.author?.username || "Tuannm"}
                    </span>
                    <Link
                      href={`/bai-viet/${article.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
                    >
                      Đọc tiếp <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIÊN HỆ & KẾT NỐI (CONTACT & SUPPORT SECTION) ── */}
      <section id="contact" className="border-t-2 border-[#1C1917] bg-[#1E140C] text-[#FAF7F0] py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Direct contact info */}
            <div className="space-y-6 lg:col-span-6">
              <div className="flex items-center gap-3">
                <div className="h-0.5 w-12 bg-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Kết nối & Hỗ trợ
                </span>
              </div>

              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white leading-tight">
                GỬI LỜI NHẮN HOẶC YÊU CẦU CÔNG CỤ
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-stone-300 max-w-md font-medium">
                Bạn cần tùy chỉnh thêm công cụ xử lý dữ liệu DMS, tối ưu báo cáo chi trả CTKM, sửa lỗi file
                chấm công FaceID hoặc đề xuất tính năng mới? Hãy để lại lời nhắn, tôi luôn sẵn sàng hỗ trợ!
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3.5 rounded-xs border-2 border-stone-800 bg-[#291B11] p-3.5">
                  <div className="flex size-10 items-center justify-center rounded-xs bg-primary text-primary-foreground">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Email công việc
                    </div>
                    <a href="mailto:tuannm@huunghi.com.vn" className="font-mono text-sm font-bold text-white hover:text-primary transition-colors">
                      tuannm@huunghi.com.vn
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 rounded-xs border-2 border-stone-800 bg-[#291B11] p-3.5">
                  <div className="flex size-10 items-center justify-center rounded-xs bg-primary text-primary-foreground">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Địa điểm công tác
                    </div>
                    <div className="text-xs font-bold text-white">
                      Phòng DMS & CNTT — 122 Định Công, Hoàng Mai, Hà Nội
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Message Form */}
            <div className="lg:col-span-6">
              <div className="mx-auto max-w-lg rounded-xs border-2 border-[#1C1917] bg-white p-6 sm:p-8 text-[#1C1917] shadow-neo-lg dark:bg-card dark:text-foreground">
                <h3 className="font-editorial text-2xl font-bold uppercase tracking-wide pb-4 border-b-2 border-stone-200 dark:border-stone-800">
                  GỬI TIN NHẮN TRỰC TIẾP
                </h3>

                <form onSubmit={handleContactSubmit} className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Họ và tên của bạn
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary dark:bg-[#18110B]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Email hoặc Số điện thoại
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.emailOrPhone}
                      onChange={(e) => setContactForm({ ...contactForm, emailOrPhone: e.target.value })}
                      placeholder="email@huunghi.com.vn hoặc 09xx..."
                      className="w-full rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary dark:bg-[#18110B]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Chủ đề / Nhu cầu hỗ trợ
                    </label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Vd: Chuyển tuyến NPP, Lỗi FaceID, Góp ý tool..."
                      className="w-full rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary dark:bg-[#18110B]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Nội dung lời nhắn
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Mô tả cụ thể yêu cầu hoặc thắc mắc của bạn..."
                      className="w-full rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary dark:bg-[#18110B]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 w-full cursor-pointer rounded-xs border-2 border-[#1C1917] bg-primary py-3 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Send className="size-3.5" /> {submitting ? "Đang gửi..." : "Gửi lời nhắn ngay"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER (Warm Neo-Brutalist) ── */}
      <footer className="border-t-2 border-[#1C1917] bg-[#140D07] text-[#FAF7F0] py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-primary text-sm font-black text-white shadow-neo-sm">
              HNF
            </div>
            <div>
              <div className="font-editorial text-lg font-bold tracking-tight text-white">
                TUANNM · DIGITAL SOLUTIONS
              </div>
              <div className="text-[10px] font-bold text-stone-400">
                Phòng DMS & CNTT — Công ty Cổ phần Thực phẩm Hữu Nghị
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-stone-300">
            <a href="#hero" className="hover:text-primary transition-colors">
              Trang chủ
            </a>
            <a href="#about" className="hover:text-primary transition-colors">
              Giới thiệu
            </a>
            <a href="#tools" className="hover:text-primary transition-colors">
              Công cụ số
            </a>
            <Link href="/bai-viet" className="hover:text-primary transition-colors">
              Bài viết hướng dẫn
            </Link>
            <Link href="/login" className="text-primary hover:underline">
              Đăng nhập Workspace
            </Link>
          </div>

          <div className="text-[11px] font-mono text-stone-500">
            © 2026 TUANNM. Xây dựng cho hiệu suất tối đa.
          </div>
        </div>
      </footer>
    </div>
  );
}
