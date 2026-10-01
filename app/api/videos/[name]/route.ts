import { NextResponse } from "next/server";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

function videosDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads", "videos");
}

// Stream video hỗ trợ chuẩn HTTP 206 Partial Content (Byte-Range Requests)
// Bắt buộc đối với Safari trên iOS (iPhone/iPad) và Chrome trên Android
export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const safeName = path.basename(name);
  if (safeName !== name || !/\.(mp4|webm|mov)$/i.test(safeName)) {
    return new NextResponse("Tên file video không hợp lệ", { status: 400 });
  }

  // Tìm trong uploads/videos trước, sau đó tìm trong uploads/
  let filePath = path.join(videosDir(), safeName);
  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    filePath = path.join(path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads"), safeName);
    try {
      fileStat = await stat(filePath);
    } catch {
      return new NextResponse("Video không tồn tại trên hệ thống", { status: 404 });
    }
  }

  const total = fileStat.size;
  const rangeHeader = req.headers.get("range");

  // Nếu trình duyệt di động gửi yêu cầu Range
  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

    if (start >= total || end >= total || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      });
    }

    const chunksize = end - start + 1;
    const stream = createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

    return new NextResponse(webStream as unknown as BodyInit, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunksize),
        "Content-Type": "video/mp4",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Trả về toàn bộ luồng nếu không có Range (ví dụ desktop tải thường)
  const fullStream = createReadStream(filePath);
  const webFullStream = Readable.toWeb(fullStream) as ReadableStream<Uint8Array>;

  return new NextResponse(webFullStream as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
