import {
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  File as FileIcon,
} from "lucide-react";

// Chọn icon + màu theo loại file
export function fileIconFor(mime: string): { Icon: typeof FileIcon; color: string } {
  if (mime.startsWith("image/")) return { Icon: FileImage, color: "text-emerald-600" };
  if (mime.startsWith("video/")) return { Icon: FileVideo, color: "text-violet-600" };
  if (mime.startsWith("audio/")) return { Icon: FileAudio, color: "text-pink-600" };
  if (mime === "application/pdf") return { Icon: FileText, color: "text-red-600" };
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv"))
    return { Icon: FileSpreadsheet, color: "text-green-700" };
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("compressed"))
    return { Icon: FileArchive, color: "text-amber-600" };
  if (mime.startsWith("text/")) return { Icon: FileText, color: "text-blue-600" };
  return { Icon: FileIcon, color: "text-muted-foreground" };
}
