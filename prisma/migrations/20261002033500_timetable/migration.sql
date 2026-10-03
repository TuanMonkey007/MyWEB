-- CreateTable
CREATE TABLE "TimetableItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "session" TEXT NOT NULL DEFAULT 'MORNING',
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "note" TEXT,
    "color" TEXT NOT NULL DEFAULT 'orange',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "TimetableItem_date_idx" ON "TimetableItem"("date");

-- CreateIndex
CREATE INDEX "TimetableItem_dayOfWeek_idx" ON "TimetableItem"("dayOfWeek");
