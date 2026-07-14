-- CreateTable
CREATE TABLE "BudgetYear" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BudgetGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetYearId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BudgetGroup_budgetYearId_fkey" FOREIGN KEY ("budgetYearId") REFERENCES "BudgetYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetFund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "m1" REAL NOT NULL DEFAULT 0,
    "m2" REAL NOT NULL DEFAULT 0,
    "m3" REAL NOT NULL DEFAULT 0,
    "m4" REAL NOT NULL DEFAULT 0,
    "m5" REAL NOT NULL DEFAULT 0,
    "m6" REAL NOT NULL DEFAULT 0,
    "m7" REAL NOT NULL DEFAULT 0,
    "m8" REAL NOT NULL DEFAULT 0,
    "m9" REAL NOT NULL DEFAULT 0,
    "m10" REAL NOT NULL DEFAULT 0,
    "m11" REAL NOT NULL DEFAULT 0,
    "m12" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BudgetFund_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BudgetGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetYearId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "proposedAt" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proposal_budgetYearId_fkey" FOREIGN KEY ("budgetYearId") REFERENCES "BudgetYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProposalItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" REAL NOT NULL DEFAULT 1,
    "specs" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "proposedAmount" REAL NOT NULL DEFAULT 0,
    "actualAmount" REAL,
    "purchasedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProposalItem_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "BudgetFund" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposalId" TEXT,
    "itemId" TEXT,
    CONSTRAINT "Attachment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ProposalItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetYear_year_key" ON "BudgetYear"("year");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetGroup_budgetYearId_code_key" ON "BudgetGroup"("budgetYearId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_budgetYearId_number_key" ON "Proposal"("budgetYearId", "number");

-- CreateIndex
CREATE INDEX "ProposalItem_fundId_idx" ON "ProposalItem"("fundId");

-- CreateIndex
CREATE INDEX "ProposalItem_status_idx" ON "ProposalItem"("status");
