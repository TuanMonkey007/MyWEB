-- Thứ tự hạng mục trong đợt đề xuất (kéo thả để sắp xếp)
ALTER TABLE "ProposalItem" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Hạng mục cũ: đánh số 0,1,2… theo thứ tự tạo trong từng đợt để giữ nguyên thứ tự đang thấy
UPDATE "ProposalItem"
SET "sortOrder" = (
  SELECT COUNT(*) FROM "ProposalItem" AS p2
  WHERE p2."proposalId" = "ProposalItem"."proposalId"
    AND (p2."createdAt" < "ProposalItem"."createdAt"
         OR (p2."createdAt" = "ProposalItem"."createdAt" AND p2."id" < "ProposalItem"."id"))
);
