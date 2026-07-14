import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { saveAttachmentFile } from "@/lib/files";

// Upload file bằng chứng, gắn vào phiếu (proposalId) HOẶC hạng mục (itemId)
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Thiếu file");

  const proposalId = form.get("proposalId");
  const itemId = form.get("itemId");
  if (!proposalId && !itemId)
    return jsonError("Thiếu proposalId hoặc itemId");

  if (proposalId) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: String(proposalId) },
    });
    if (!proposal) return jsonError("Đợt đề xuất không tồn tại");
  }
  if (itemId) {
    const item = await prisma.proposalItem.findUnique({
      where: { id: String(itemId) },
    });
    if (!item) return jsonError("Hạng mục không tồn tại");
  }

  const saved = await saveAttachmentFile(file);
  if ("error" in saved) return jsonError(saved.error, 422);

  const attachment = await prisma.attachment.create({
    data: {
      ...saved,
      proposalId: proposalId ? String(proposalId) : null,
      itemId: itemId ? String(itemId) : null,
    },
  });
  return NextResponse.json(attachment, { status: 201 });
}
