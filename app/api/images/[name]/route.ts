import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { resolveReceiptImage } from "@/lib/upload";

type Params = { params: Promise<{ name: string }> };

// Phục vụ ảnh hóa đơn từ UPLOAD_DIR (nằm ngoài public/)
export async function GET(_req: Request, { params }: Params) {
  const { name } = await params;
  const filePath = resolveReceiptImage(name);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  try {
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
