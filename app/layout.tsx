import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { STRIP_EXTENSION_ATTRS_SCRIPT } from "@/lib/strip-extension-attrs";
import { themeStyleVars } from "@/lib/theme-color";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { getSettings } from "@/lib/settings";
import "./globals.css";

// Font tự host trong repo (assets/fonts) — build không phụ thuộc mạng
// tới Google Fonts (từng làm fail build khi mạng chập chờn)
const inter = localFont({
  src: "../assets/fonts/Inter-Variable.ttf",
  variable: "--font-inter",
  weight: "100 900",
});

const beVietnam = localFont({
  src: [
    { path: "../assets/fonts/BeVietnamPro-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/BeVietnamPro-Medium.ttf", weight: "500" },
    { path: "../assets/fonts/BeVietnamPro-SemiBold.ttf", weight: "600" },
    { path: "../assets/fonts/BeVietnamPro-Bold.ttf", weight: "700" },
  ],
  variable: "--font-be-vietnam",
});

const roboto = localFont({
  src: "../assets/fonts/Roboto-Variable.ttf",
  variable: "--font-roboto",
  weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings().catch(() => null);
  const iconUrl = settings?.faviconPath
    ? `/api/branding/favicon?v=${encodeURIComponent(settings.faviconPath)}`
    : "/favicon.ico";

  return {
    title: settings?.platformName || "MyWEB",
    description:
      "Platform cá nhân dạng module: tài chính cá nhân, đề xuất mua hàng",
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const fontVar = `var(--font-${settings.fontFamily})`;

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${beVietnam.variable} ${roboto.variable} h-full antialiased`}
      style={
        {
          fontSize: `${settings.fontSize}px`,
          // Tên biến phải khớp --app-font trong globals.css. Trước đây đặt nhầm
          // --font-geist-sans (sót từ template) nên font tải về mà không hề được
          // áp, cả app rơi về serif mặc định của trình duyệt.
          "--app-font": fontVar,
          // Màu nhấn admin chọn trong Cài đặt — cấp giá trị cho cả hai chế độ,
          // globals.css tự lấy bộ --tl-* (sáng) hoặc --td-* (tối)
          ...themeStyleVars(settings.themeColor),
        } as React.CSSProperties
      }
    >
      {/* suppressHydrationWarning: lớp bảo hiểm cho chính thẻ body */}
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {/* Dọn thuộc tính do extension trình duyệt chèn (Bitdefender
            bis_skin_checked, IDM, Grammarly...) TRƯỚC khi React hydrate. HTML
            máy chủ trả về vốn sạch — xem lib/strip-extension-attrs.ts.
            Phải nằm TRONG <body>: đặt thẻ script làm con trực tiếp của <html>
            là HTML không hợp lệ và tự nó gây hydration error. */}
        <Script
          id="strip-extension-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: STRIP_EXTENSION_ATTRS_SCRIPT }}
        />
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
