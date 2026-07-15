import { prisma } from "@/lib/prisma";
import { TodosView } from "@/components/todos/todos-view";

export const dynamic = "force-dynamic";

export default async function TodosPage() {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: "asc" } });

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
    />
  );
}
