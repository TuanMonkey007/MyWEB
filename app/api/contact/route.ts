import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const emailOrPhone = typeof body.emailOrPhone === "string" ? body.emailOrPhone.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name) return jsonError("Vui lòng nhập họ và tên của bạn");
    if (!emailOrPhone) return jsonError("Vui lòng nhập email hoặc số điện thoại");
    if (!message) return jsonError("Vui lòng nhập nội dung lời nhắn");

    const title = `[Liên hệ Web] ${name}${subject ? ` - ${subject}` : ""}`;
    const now = new Date();
    const formattedDate = now.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const notes = [
      `📌 KHÁCH HÀNG / ĐỒNG NGHIỆP GỬI TỪ WEBSITE`,
      `──────────────────────────────────────────`,
      `👤 Họ và tên: ${name}`,
      `📞 Email / SĐT: ${emailOrPhone}`,
      `📝 Chủ đề: ${subject || "Yêu cầu hỗ trợ chung"}`,
      `⏰ Thời gian: ${formattedDate}`,
      `──────────────────────────────────────────`,
      `💬 Lời nhắn chi tiết:`,
      message,
    ].join("\n");

    // Tạo Todo mới với mức ưu tiên HIGH (Cao) để người dùng chú ý xử lý
    const todo = await prisma.todo.create({
      data: {
        title: title.slice(0, 190),
        notes,
        priority: "HIGH",
        status: "TODO",
        // Hạn xử lý phản hồi trong vòng 24 giờ
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ ok: true, id: todo.id }, { status: 201 });
  } catch (error) {
    console.error("[contact] lỗi tạo todo:", error);
    return jsonError("Không thể gửi lời nhắn lúc này. Vui lòng thử lại sau.", 500);
  }
}
