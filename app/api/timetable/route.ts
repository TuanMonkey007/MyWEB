import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.timetableItem.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Lỗi lấy thời khóa biểu:", error);
    return NextResponse.json({ error: "Không thể tải thời khóa biểu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dayOfWeek, subject, session, startTime, endTime, location, note, color } = body;

    const day = Number(dayOfWeek);
    if (!day || day < 1 || day > 7) {
      return NextResponse.json({ error: "Thứ trong tuần không hợp lệ (1 - 7)" }, { status: 400 });
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập tên môn học hoặc công việc" }, { status: 400 });
    }

    const item = await prisma.timetableItem.create({
      data: {
        dayOfWeek: day,
        subject: subject.trim(),
        session: ["MORNING", "AFTERNOON", "EVENING"].includes(session) ? session : "MORNING",
        startTime: startTime ? String(startTime).trim() : null,
        endTime: endTime ? String(endTime).trim() : null,
        location: location ? String(location).trim() : null,
        note: note ? String(note).trim() : null,
        color: color ? String(color).trim() : "orange",
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Lỗi tạo tiết thời khóa biểu:", error);
    return NextResponse.json({ error: "Thêm thời khóa biểu thất bại" }, { status: 500 });
  }
}
