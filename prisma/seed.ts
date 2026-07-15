import { readFileSync } from "fs";
import path from "path";
import { randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tài khoản quản trị đầu tiên: admin / APP_PASSWORD (fallback admin123)
async function seedAdmin() {
  if ((await prisma.user.count()) > 0) return;
  const password = process.env.APP_PASSWORD || "admin123";
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, { N: 16384 }).toString("hex");
  await prisma.user.create({
    data: {
      username: "admin",
      displayName: "Quản trị viên",
      passwordHash: `scrypt$16384$${salt}$${hash}`,
      role: "ADMIN",
    },
  });
  console.log(
    `Đã tạo tài khoản quản trị: admin / ${process.env.APP_PASSWORD ? "(APP_PASSWORD trong .env)" : "admin123 — ĐỔI NGAY"}`
  );
}

// 8 ví theo FR-1 của BA
const wallets = [
  { name: "Tiền mặt", type: "CASH" },
  { name: "Momo", type: "EWALLET" },
  { name: "Zalo Pay", type: "EWALLET" },
  { name: "Viettel Money", type: "EWALLET" },
  { name: "Viettin", type: "BANK" },
  { name: "BIDV", type: "BANK" },
  { name: "Exness", type: "INVEST", balanceUSD: 0, exchangeRate: 25000 },
  { name: "Vantage", type: "INVEST", balanceUSD: 0, exchangeRate: 25000 },
];

// Danh mục theo mục 3.2 / 3.3 của BA
const expenseCategories = [
  "Food",
  "Eating Out",
  "Transport",
  "Health & Sport",
  "Personal Care",
  "Bills",
  "Utilities",
  "Home",
  "Entertainment",
  "Gifting",
];

const incomeCategories = [
  "Salary",
  "Business",
  "Earned",
  "Freelance",
  "Investment",
  "Passive",
];

async function main() {
  for (const w of wallets) {
    const existing = await prisma.wallet.findFirst({ where: { name: w.name } });
    if (!existing) {
      await prisma.wallet.create({ data: w });
    }
  }

  for (const name of expenseCategories) {
    await prisma.category.upsert({
      where: { name_kind: { name, kind: "EXPENSE" } },
      update: {},
      create: { name, kind: "EXPENSE" },
    });
  }

  for (const name of incomeCategories) {
    await prisma.category.upsert({
      where: { name_kind: { name, kind: "INCOME" } },
      update: {},
      create: { name, kind: "INCOME" },
    });
  }

  await seedAdmin();
  await seedProcurement();

  const [walletCount, categoryCount, fundCount, itemCount] = await Promise.all([
    prisma.wallet.count(),
    prisma.category.count(),
    prisma.budgetFund.count(),
    prisma.proposalItem.count(),
  ]);
  console.log(
    `Seed xong: ${walletCount} ví, ${categoryCount} danh mục, ${fundCount} quỹ ngân sách, ${itemCount} hạng mục đề xuất.`
  );
}

// Module Đề xuất mua hàng: import ngân sách BM02B 2026 + các đợt đã theo dõi
// (trích xuất từ file "Theo dõi các đề xuất đã mua .xlsx")
type SeedFund = { name: string; monthly: number[] };
type SeedGroup = { code: string; name: string; funds: SeedFund[] };
type SeedItem = {
  name: string;
  fundName: string;
  quantity: number;
  status: string;
  proposedAmount: number;
  actualAmount: number | null;
  notes: string | null;
};
type SeedProposal = { number: number; proposedAt: string | null; items: SeedItem[] };
type SeedData = {
  year: number;
  title: string;
  groups: SeedGroup[];
  proposals: SeedProposal[];
};

async function seedProcurement() {
  const existing = await prisma.budgetYear.findUnique({ where: { year: 2026 } });
  if (existing) return; // đã import rồi thì không đụng nữa

  const data: SeedData = JSON.parse(
    readFileSync(path.join(__dirname, "seed-data", "procurement-2026.json"), "utf-8")
  );

  const budgetYear = await prisma.budgetYear.create({
    data: { year: data.year, title: data.title },
  });

  const fundIdByName = new Map<string, string>();
  for (const [gi, g] of data.groups.entries()) {
    const group = await prisma.budgetGroup.create({
      data: {
        budgetYearId: budgetYear.id,
        code: g.code,
        name: g.name,
        sortOrder: gi,
      },
    });
    for (const [fi, f] of g.funds.entries()) {
      const [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12] = f.monthly;
      const fund = await prisma.budgetFund.create({
        data: {
          groupId: group.id,
          name: f.name,
          sortOrder: fi,
          m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12,
        },
      });
      fundIdByName.set(f.name, fund.id);
    }
  }

  for (const p of data.proposals) {
    await prisma.proposal.create({
      data: {
        budgetYearId: budgetYear.id,
        number: p.number,
        proposedAt: p.proposedAt ? new Date(p.proposedAt) : new Date(data.year, 0, 1),
        items: {
          create: p.items.map((it) => ({
            name: it.name,
            fundId: fundIdByName.get(it.fundName)!,
            quantity: it.quantity,
            status: it.status,
            proposedAmount: it.proposedAmount,
            actualAmount: it.actualAmount,
            notes: it.notes,
          })),
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
