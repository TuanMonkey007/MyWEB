import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { date, dayOfWeek, subject, session, startTime, endTime, location, note, color, isRecurring } = body;

    const existing = await prisma.timetableItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy mục lịch trình" }, { status: 404 });
    }

    let day = Number(dayOfWeek);
    let dateStr = date !== undefined ? (date ? String(date).trim() : null) : existing.date;

    if (dateStr && date !== undefined) {
      const [y, m, d] = dateStr.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const rawDow = new Date(y, m - 1, d).getDay();
        day = rawDow === 0 ? 7 : rawDow;
      }
    }

    if (dayOfWeek !== undefined && (isNaN(day) || day < 1 || day > 7)) {
      day = existing.dayOfWeek;
    }

    const item = await prisma.timetableItem.update({
      where: { id },
      data: {
        date: dateStr,
        dayOfWeek: day || existing.dayOfWeek,
        subject: subject !== undefined ? String(subject).trim() : existing.subject,
        session: ["MORNING", "AFTERNOON", "EVENING"].includes(session)
          ? session
          : existing.session,
        startTime: startTime !== undefined ? (startTime ? String(startTime).trim() : null) : existing.startTime,
        endTime: endTime !== undefined ? (endTime ? String(endTime).trim() : null) : existing.endTime,
        location: location !== undefined ? (location ? String(location).trim() : null) : existing.location,
        note: note !== undefined ? (note ? String(note).trim() : null) : existing.note,
        color: color !== undefined ? String(color).trim() : existing.color,
        isRecurring: isRecurring !== undefined ? Boolean(isRecurring) : existing.isRecurring,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Lỗi cập nhật lịch trình:", error);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await prisma.timetableItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy mục lịch trình" }, { status: 404 });
    }

    await prisma.timetableItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lỗi xóa lịch trình:", error);
    return NextResponse.json({ error: "Xóa thất bại" }, { status: 500 });
  }
}
