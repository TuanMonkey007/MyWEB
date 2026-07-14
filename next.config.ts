import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit/exceljs đọc file dữ liệu (font .afm...) qua fs lúc runtime —
  // để Node require trực tiếp từ node_modules thay vì bundle
  serverExternalPackages: ["pdfkit", "exceljs"],
};

export default nextConfig;
