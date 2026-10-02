import { prisma } from "@/lib/prisma";
import { SchedulePlannerView } from "@/components/todos/schedule-planner-view";
import type { SessionType } from "@/lib/timetable-constants";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const items = await prisma.timetableItem.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
  });

  return (
    <SchedulePlannerView
      items={items.map((item) => ({
        id: item.id,
        dayOfWeek: item.dayOfWeek,
        subject: item.subject,
        session: item.session as SessionType,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location,
        note: item.note,
        color: item.color,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))}
    />
  );
}
