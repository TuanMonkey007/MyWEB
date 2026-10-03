import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD
    const monthParam = searchParams.get("month"); // YYYY-MM

    const where: any = {};
    if (dateParam) {
      where.date = dateParam;
    } else if (monthParam) {
      where.date = { startsWith: monthParam };
    }

    const items = await prisma.timetableItem.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: [{ date: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Lỗi lấy thời gian biểu:", error);
    return NextResponse.json({ error: "Không thể tải thời gian biểu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, dayOfWeek, subject, session, startTime, endTime, location, note, color, isRecurring } = body;

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập tên công việc hoặc hoạt động" }, { status: 400 });
    }

    let day = Number(dayOfWeek);
    let dateStr = date ? String(date).trim() : null;

    if (dateStr) {
      const [y, m, d] = dateStr.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const rawDow = new Date(y, m - 1, d).getDay();
        day = rawDow === 0 ? 7 : rawDow;
      }
    }

    if (!day || day < 1 || day > 7) {
      day = 1;
    }

    const item = await prisma.timetableItem.create({
      data: {
        date: dateStr,
        dayOfWeek: day,
        subject: subject.trim(),
        session: ["MORNING", "AFTERNOON", "EVENING"].includes(session) ? session : "MORNING",
        startTime: startTime ? String(startTime).trim() : null,
        endTime: endTime ? String(endTime).trim() : null,
        location: location ? String(location).trim() : null,
        note: note ? String(note).trim() : null,
        color: color ? String(color).trim() : "orange",
        isRecurring: Boolean(isRecurring),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Lỗi tạo lịch trình:", error);
    return NextResponse.json({ error: "Thêm lịch trình thất bại" }, { status: 500 });
  }
}
