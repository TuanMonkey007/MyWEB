-- AlterTable
ALTER TABLE "TimetableItem" ADD COLUMN "date" TEXT;
ALTER TABLE "TimetableItem" ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "TimetableItem_date_idx" ON "TimetableItem"("date");
