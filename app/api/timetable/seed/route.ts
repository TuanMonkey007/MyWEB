import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDateISO, getStartOfWeek, getWeekDates } from "@/lib/timetable-constants";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const count = await prisma.timetableItem.count();
    if (count > 0) {
      return NextResponse.json({ message: "Lịch trình đã có dữ liệu", count });
    }

    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    const weekDates = getWeekDates(startOfWeek);

    const getDateForDow = (dow: number) => {
      const found = weekDates.find((w) => w.dayOfWeek === dow);
      return found ? found.dateStr : formatDateISO(today);
    };

    const sampleItems = [
      // Thứ 2
      {
        date: getDateForDow(1),
        dayOfWeek: 1,
        subject: "Họp giao ban đầu tuần phòng CNTT",
        session: "MORNING",
        startTime: "08:30",
        endTime: "09:30",
        location: "Phòng họp HO / Online",
        note: "Báo cáo tiến độ vận hành DMS & các dự án số hóa",
        color: "purple",
        isRecurring: false,
      },
      {
        date: getDateForDow(1),
        dayOfWeek: 1,
        subject: "Rà soát & Đối soát dữ liệu DMS 5.2 - 6.4.4",
        session: "MORNING",
        startTime: "09:30",
        endTime: "11:30",
        location: "Văn phòng HNF",
        note: "Kiểm tra dữ liệu đồng bộ các nhà phân phối",
        color: "orange",
        isRecurring: false,
      },
      {
        date: getDateForDow(1),
        dayOfWeek: 1,
        subject: "Học từ vựng & Ngữ pháp HSK3",
        session: "EVENING",
        startTime: "19:30",
        endTime: "21:00",
        location: "Bàn làm việc",
        note: "Ôn tập 36 Vần Mẫu & Luyện viết chữ Hán",
        color: "blue",
        isRecurring: false,
      },

      // Thứ 3
      {
        date: getDateForDow(2),
        dayOfWeek: 2,
        subject: "Xử lý yêu cầu chuyển tuyến & chốt kho NPP",
        session: "MORNING",
        startTime: "08:00",
        endTime: "11:30",
        location: "Phòng DMS",
        note: "Hỗ trợ KTNPP & GSBH các miền",
        color: "emerald",
        isRecurring: false,
      },
      {
        date: getDateForDow(2),
        dayOfWeek: 2,
        subject: "Luyện nghe & Flashcards HSK Anki",
        session: "EVENING",
        startTime: "20:00",
        endTime: "21:30",
        location: "Nhà riêng",
        note: "Mục tiêu 30 từ mới mỗi ngày",
        color: "blue",
        isRecurring: false,
      },

      // Thứ 4
      {
        date: getDateForDow(3),
        dayOfWeek: 3,
        subject: "Tối ưu hóa bảng tính & Viết script tự động",
        session: "MORNING",
        startTime: "08:30",
        endTime: "11:30",
        location: "Bàn làm việc",
        note: "Nâng cấp tính năng web nội bộ",
        color: "purple",
        isRecurring: false,
      },
      {
        date: getDateForDow(3),
        dayOfWeek: 3,
        subject: "Chạy bộ / Thể dục thể thao",
        session: "EVENING",
        startTime: "17:30",
        endTime: "18:45",
        location: "Công viên / Phòng tập",
        note: "Rèn luyện sức bền & tái tạo năng lượng",
        color: "amber",
        isRecurring: false,
      },

      // Thứ 5
      {
        date: getDateForDow(4),
        dayOfWeek: 4,
        subject: "Kiểm tra dữ liệu viếng thăm & GPS tuyến bán",
        session: "MORNING",
        startTime: "08:00",
        endTime: "11:30",
        location: "Phòng DMS",
        note: "Báo cáo tỉ lệ viếng thăm điểm bán của NVBH",
        color: "emerald",
        isRecurring: false,
      },
      {
        date: getDateForDow(4),
        dayOfWeek: 4,
        subject: "Học tiếng Trung HSK3: Đọc hiểu & Hội thoại",
        session: "EVENING",
        startTime: "19:30",
        endTime: "21:30",
        location: "Bàn học",
        note: "Bài tập giáo trình HSK Chuẩn",
        color: "blue",
        isRecurring: false,
      },

      // Thứ 6
      {
        date: getDateForDow(5),
        dayOfWeek: 5,
        subject: "Tổng hợp báo cáo tuần & Rà soát quỹ mua sắm",
        session: "AFTERNOON",
        startTime: "14:00",
        endTime: "17:00",
        location: "Văn phòng HNF",
        note: "Đối soát số dư ví & hóa đơn VAT",
        color: "rose",
        isRecurring: false,
      },

      // Thứ 7
      {
        date: getDateForDow(6),
        dayOfWeek: 6,
        subject: "Viết bài chia sẻ tài liệu kỹ thuật DMS",
        session: "MORNING",
        startTime: "09:00",
        endTime: "11:30",
        location: "Bàn làm việc",
        note: "Cập nhật bài viết hướng dẫn trên website nội bộ",
        color: "purple",
        isRecurring: false,
      },

      // Chủ Nhật
      {
        date: getDateForDow(7),
        dayOfWeek: 7,
        subject: "Lên kế hoạch công việc tuần mới & Chuẩn bị tài liệu",
        session: "EVENING",
        startTime: "20:00",
        endTime: "21:30",
        location: "Nhà riêng",
        note: "Sắp xếp danh sách việc cần làm (Todos) và mục tiêu tuần",
        color: "orange",
        isRecurring: false,
      },
    ];

    for (const item of sampleItems) {
      await prisma.timetableItem.create({ data: item });
    }

    return NextResponse.json({ message: "Đã nạp thành công lịch trình mẫu!", count: sampleItems.length });
  } catch (error) {
    console.error("Lỗi nạp lịch mẫu:", error);
    return NextResponse.json({ error: "Nạp lịch mẫu thất bại" }, { status: 500 });
  }
}
