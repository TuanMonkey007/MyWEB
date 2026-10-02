import { prisma } from "@/lib/prisma";
import { TodosView } from "@/components/todos/todos-view";
import type { SessionType } from "@/lib/timetable-constants";

export const dynamic = "force-dynamic";

export default async function TodosPage() {
  const [todos, timetableItems] = await Promise.all([
    prisma.todo.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.timetableItem.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <TodosView
      todos={todos.map((t) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      }))}
      timetableItems={timetableItems.map((item) => ({
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
