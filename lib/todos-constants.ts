// Hằng số module Todolist — dùng được cả client lẫn server
export const TODO_STATUSES = ["TODO", "DOING", "DONE"] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

export const TODO_STATUS_LABELS: Record<TodoStatus, string> = {
  TODO: "Chờ làm",
  DOING: "Đang làm",
  DONE: "Đã xong",
};

export const TODO_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  HIGH: "Cao",
  MEDIUM: "Vừa",
  LOW: "Thấp",
};

export type TodoDTO = {
  id: string;
  title: string;
  notes: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
};

const PRIORITY_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

// Việc chưa xong: ưu tiên cao trước → hạn gần trước (không hạn xuống cuối) → cũ trước
// Việc đã xong: hoàn thành gần nhất trước
export function sortTodos(todos: TodoDTO[]): TodoDTO[] {
  return [...todos].sort((a, b) => {
    if (a.status === "DONE" && b.status === "DONE")
      return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    const pr = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    if (pr !== 0) return pr;
    const ad = a.dueDate ?? "9999";
    const bd = b.dueDate ?? "9999";
    if (ad !== bd) return ad.localeCompare(bd);
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function isOverdue(todo: TodoDTO): boolean {
  if (!todo.dueDate || todo.status === "DONE") return false;
  return new Date(todo.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
}
