import type { Metadata } from "next";
import localFont from "next/font/local";
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
  const settings = await getSettings();
  return {
    title: settings.platformName,
    description:
      "Platform cá nhân dạng module: tài chính cá nhân, đề xuất mua hàng",
    icons: settings.faviconPath
      ? [{ url: `/api/branding/favicon?v=${encodeURIComponent(settings.faviconPath)}` }]
      : undefined,
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
          "--font-geist-sans": fontVar,
        } as React.CSSProperties
      }
    >
      {/* suppressHydrationWarning: extension trình duyệt (IDM...) hay chèn
          attribute vào <body> trước khi React hydrate — không phải lỗi app */}
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
