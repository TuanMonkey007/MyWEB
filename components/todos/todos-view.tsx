"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Kanban,
  List,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import {
  TODO_PRIORITY_LABELS,
  TODO_STATUSES,
  TODO_STATUS_LABELS,
  isOverdue,
  sortTodos,
  type TodoDTO,
  type TodoStatus,
} from "@/lib/todos-constants";
import { cn } from "@/lib/utils";
import { TodoDialog } from "./todo-dialog";
import { useCan, NO_PERM } from "@/components/permissions-provider";

const VIEW_KEY = "todos-view";

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "HIGH")
    return <Badge variant="destructive">Cao</Badge>;
  if (priority === "LOW")
    return <Badge variant="secondary">Thấp</Badge>;
  return <Badge variant="warning">Vừa</Badge>;
}

function DueDate({ todo }: { todo: TodoDTO }) {
  if (!todo.dueDate) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        isOverdue(todo) ? "font-medium text-destructive" : "text-muted-foreground"
      )}
    >
      <CalendarDays className="size-3.5" />
      {formatDate(todo.dueDate)}
    </span>
  );
}

export function TodosView({ todos: serverTodos }: { todos: TodoDTO[] }) {
  const router = useRouter();
  const canCreate = useCan()("todos", "create");
  const [todos, setTodos] = useState(serverTodos);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [quickTitle, setQuickTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; todo: TodoDTO | null }>({
    open: false,
    todo: null,
  });

  useEffect(() => setTodos(serverTodos), [serverTodos]);
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "kanban") setView("kanban");
  }, []);

  function switchView(v: "list" | "kanban") {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  }

  async function setStatus(todo: TodoDTO, status: TodoStatus) {
    if (todo.status === status) return;
    setTodos((ts) =>
      ts.map((t) =>
        t.id === todo.id
          ? {
              ...t,
              status,
              completedAt:
                status === "DONE" ? (t.completedAt ?? new Date().toISOString()) : null,
            }
          : t
      )
    );
    const res = await fetch(`/api/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusOnly: true, status }),
    });
    if (!res.ok) {
      toast.error("Cập nhật thất bại");
      setTodos(serverTodos);
    }
    router.refresh();
  }

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      setQuickTitle("");
      router.refresh();
    } catch {
      toast.error("Thêm việc thất bại");
    } finally {
      setAdding(false);
    }
  }

  const openTodos = todos.filter((t) => t.status !== "DONE");
  const doneTodos = sortTodos(todos.filter((t) => t.status === "DONE"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            Việc cần làm
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
            {openTodos.length} việc đang mở · {doneTodos.length} đã xong
          </p>
        </div>
        <div className="flex rounded-md border border-border bg-muted/40 p-0.5">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => switchView("list")}
          >
            <List className="size-3.5" /> Danh sách
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => switchView("kanban")}
          >
            <Kanban className="size-3.5" /> Kanban
          </Button>
        </div>
      </div>

      <form onSubmit={quickAdd} className="flex gap-2">
        <Input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={canCreate ? "Thêm việc mới rồi nhấn Enter..." : NO_PERM}
          disabled={!canCreate}
          className="h-9 text-xs sm:text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!canCreate || adding || !quickTitle.trim()}
          title={canCreate ? undefined : NO_PERM}
          className="h-9 text-xs"
        >
          <Plus className="size-3.5" /> Thêm
        </Button>
      </form>

      {view === "list" ? (
        <ChecklistView
          todos={todos}
          onToggle={(t) => setStatus(t, t.status === "DONE" ? "TODO" : "DONE")}
          onOpen={(t) => setDialog({ open: true, todo: t })}
        />
      ) : (
        <KanbanView
          todos={todos}
          onMove={setStatus}
          onOpen={(t) => setDialog({ open: true, todo: t })}
        />
      )}

      <TodoDialog
        open={dialog.open}
        todo={dialog.todo}
        onClose={() => setDialog({ open: false, todo: null })}
      />
    </div>
  );
}

// ===== Checklist =====
function ChecklistView({
  todos,
  onToggle,
  onOpen,
}: {
  todos: TodoDTO[];
  onToggle: (t: TodoDTO) => void;
  onOpen: (t: TodoDTO) => void;
}) {
  const sections: { status: TodoStatus; todos: TodoDTO[] }[] = [
    { status: "DOING", todos: sortTodos(todos.filter((t) => t.status === "DOING")) },
    { status: "TODO", todos: sortTodos(todos.filter((t) => t.status === "TODO")) },
    { status: "DONE", todos: sortTodos(todos.filter((t) => t.status === "DONE")) },
  ];

  if (todos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
        Chưa có việc nào — thêm việc đầu tiên ở ô phía trên.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map(
        ({ status, todos: items }) =>
          items.length > 0 && (
            <div key={status}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {TODO_STATUS_LABELS[status]} ({items.length})
              </h2>
              <ul className="divide-y-2 divide-border/60 rounded-sm border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 hover:bg-muted/30 transition-colors"
                    onClick={() => onOpen(t)}
                  >
                    <input
                      type="checkbox"
                      checked={t.status === "DONE"}
                      onChange={() => onToggle(t)}
                      onClick={(e) => e.stopPropagation()}
                      className="size-4 shrink-0 rounded accent-primary cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "truncate text-xs sm:text-sm font-medium text-foreground",
                          t.status === "DONE" && "text-muted-foreground line-through"
                        )}
                      >
                        {t.title}
                      </div>
                      {t.notes && (
                        <div className="truncate text-xs text-muted-foreground">
                          {t.notes}
                        </div>
                      )}
                    </div>
                    <DueDate todo={t} />
                    {t.status !== "DONE" && <PriorityBadge priority={t.priority} />}
                  </li>
                ))}
              </ul>
            </div>
          )
      )}
    </div>
  );
}

// ===== Kanban (kéo thả giữa 3 cột; mobile dùng nút ← →) =====
function KanbanView({
  todos,
  onMove,
  onOpen,
}: {
  todos: TodoDTO[];
  onMove: (t: TodoDTO, status: TodoStatus) => void;
  onOpen: (t: TodoDTO) => void;
}) {
  const [dragOver, setDragOver] = useState<TodoStatus | null>(null);

  function neighbors(status: string): { prev: TodoStatus | null; next: TodoStatus | null } {
    const i = TODO_STATUSES.indexOf(status as TodoStatus);
    return {
      prev: i > 0 ? TODO_STATUSES[i - 1] : null,
      next: i < TODO_STATUSES.length - 1 ? TODO_STATUSES[i + 1] : null,
    };
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {TODO_STATUSES.map((status) => {
        const items = sortTodos(todos.filter((t) => t.status === status));
        return (
          <div
            key={status}
            className={cn(
              "rounded-sm border-2 border-[#1C1917] bg-[#F5EFEB] dark:bg-[#140D07] p-3 shadow-neo transition-all",
              dragOver === status && "border-[#F25C2B] bg-[#FDF1EA]"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData("text/todo-id");
              const todo = todos.find((t) => t.id === id);
              if (todo) onMove(todo, status);
            }}
          >
            <h2 className="px-1 pb-2 pt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {TODO_STATUS_LABELS[status]}{" "}
              <span className="font-normal text-muted-foreground">({items.length})</span>
            </h2>
            <div className="space-y-2">
              {items.map((t) => {
                const { prev, next } = neighbors(t.status);
                return (
                  <Card
                    key={t.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/todo-id", t.id)}
                    onClick={() => onOpen(t)}
                    className="cursor-grab gap-1.5 p-3 active:cursor-grabbing hover:border-border transition-colors shadow-xs rounded-md"
                  >
                    <div
                      className={cn(
                        "text-xs sm:text-sm font-medium text-foreground",
                        t.status === "DONE" && "text-muted-foreground line-through"
                      )}
                    >
                      {t.title}
                    </div>
                    <div className="flex items-center gap-2">
                      {t.status !== "DONE" && <PriorityBadge priority={t.priority} />}
                      <DueDate todo={t} />
                      <span className="ml-auto flex gap-0.5 md:hidden">
                        {prev && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMove(t, prev);
                            }}
                          >
                            <ArrowLeft className="size-3.5" />
                          </Button>
                        )}
                        {next && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMove(t, next);
                            }}
                          >
                            <ArrowRight className="size-3.5" />
                          </Button>
                        )}
                      </span>
                    </div>
                  </Card>
                );
              })}
              {items.length === 0 && (
                <div className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                  Kéo việc vào đây
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
