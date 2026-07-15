import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseTodoBody } from "@/lib/api";

export async function POST(req: Request) {
  const parsed = parseTodoBody(await req.json());
  if ("error" in parsed) return jsonError(parsed.error);

  const todo = await prisma.todo.create({ data: parsed });
  return NextResponse.json(todo, { status: 201 });
}
