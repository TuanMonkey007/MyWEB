import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit/exceljs đọc file dữ liệu (font .afm...) qua fs lúc runtime —
  // để Node require trực tiếp từ node_modules thay vì bundle
  serverExternalPackages: ["pdfkit", "exceljs", "xlsx"],
  async redirects() {
    return [
      {
        source: "/huong-dan",
        destination: "/bai-viet",
        permanent: true,
      },
      {
        source: "/huong-dan/:slug*",
        destination: "/bai-viet/:slug*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
