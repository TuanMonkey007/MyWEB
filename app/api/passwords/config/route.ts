import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

// Trạng thái vault của user hiện tại (đã thiết lập master chưa) + salt/verifier
// để client tự kiểm tra mật khẩu chủ. KHÔNG có gì giải mã được ở đây.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const cfg = await prisma.vaultConfig.findUnique({ where: { userId: user.id } });
  if (!cfg) return NextResponse.json({ configured: false });
  return NextResponse.json({
    configured: true,
    salt: cfg.salt,
    verifier: cfg.verifier,
    kdfIters: cfg.kdfIters,
  });
}

// Thiết lập mật khẩu chủ lần đầu (chưa có config)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const existing = await prisma.vaultConfig.findUnique({ where: { userId: user.id } });
  if (existing) return jsonError("Kho mật khẩu đã được thiết lập", 409);

  const body = await req.json();
  const { salt, verifier, kdfIters } = body ?? {};
  if (typeof salt !== "string" || typeof verifier !== "string")
    return jsonError("Thiếu tham số thiết lập");

  await prisma.vaultConfig.create({
    data: {
      userId: user.id,
      salt,
      verifier,
      kdfIters: Number(kdfIters) || 600000,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Đổi mật khẩu chủ: client mã hóa lại toàn bộ entry bằng khóa mới rồi gửi kèm.
// Cập nhật config + mọi cipher trong 1 transaction.
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const cfg = await prisma.vaultConfig.findUnique({ where: { userId: user.id } });
  if (!cfg) return jsonError("Chưa thiết lập kho mật khẩu", 400);

  const body = await req.json();
  const { salt, verifier, kdfIters, entries } = body ?? {};
  if (typeof salt !== "string" || typeof verifier !== "string" || !Array.isArray(entries))
    return jsonError("Thiếu tham số");

  await prisma.$transaction([
    prisma.vaultConfig.update({
      where: { userId: user.id },
      data: { salt, verifier, kdfIters: Number(kdfIters) || 600000 },
    }),
    ...entries.map((e: { id: string; cipher: string }) =>
      prisma.vaultEntry.updateMany({
        where: { id: String(e.id), userId: user.id },
        data: { cipher: String(e.cipher) },
      })
    ),
  ]);
  return NextResponse.json({ ok: true });
}
