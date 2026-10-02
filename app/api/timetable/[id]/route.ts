import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { dayOfWeek, subject, session, startTime, endTime, location, note, color } = body;

    const existing = await prisma.timetableItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy mục thời khóa biểu" }, { status: 404 });
    }

    const day = Number(dayOfWeek);
    if (dayOfWeek !== undefined && (isNaN(day) || day < 1 || day > 7)) {
      return NextResponse.json({ error: "Thứ trong tuần không hợp lệ (1 - 7)" }, { status: 400 });
    }

    const item = await prisma.timetableItem.update({
      where: { id },
      data: {
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
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Lỗi cập nhật thời khóa biểu:", error);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await prisma.timetableItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy mục thời khóa biểu" }, { status: 404 });
    }

    await prisma.timetableItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lỗi xóa thời khóa biểu:", error);
    return NextResponse.json({ error: "Xóa thất bại" }, { status: 500 });
  }
}
