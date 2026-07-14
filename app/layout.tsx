import type { Metadata } from "next";
import { Inter, Be_Vietnam_Pro, Roboto, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${inter.variable} ${beVietnam.variable} ${roboto.variable} ${geistMono.variable} h-full antialiased`}
      style={
        {
          fontSize: `${settings.fontSize}px`,
          "--font-geist-sans": fontVar,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
