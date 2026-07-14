import Link from "next/link";
import { ArrowRight, ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Landing page public — placeholder, sẽ hoàn thiện thành module giới thiệu bản thân sau.
// Các module bên trong (/finance, /procurement) yêu cầu đăng nhập (chặn ở proxy.ts).
export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          tuandeptrai.io.vn
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Xin chào, tôi là Tuấn 👋
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          IT Engineer. Đây là platform cá nhân của tôi — nơi tôi xây các công cụ
          tự động hóa công việc hằng ngày. Trang giới thiệu đang được xây dựng.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              <Lock className="size-4" /> Khu vực quản trị
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://github.com/TuanMonkey007" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> GitHub
            </a>
          </Button>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Tuấn — Platform cá nhân dạng module
      </footer>
    </div>
  );
}
