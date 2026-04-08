import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const uploads = await prisma.upload.findMany({
    where: { createdAt: { gte: weekAgo } },
    include: { user: { select: { email: true, empresa: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (uploads.length === 0) {
    console.log("\n  Sin cargas en los últimos 7 días.\n");
    await prisma.$disconnect();
    return;
  }

  // Group by user
  const byUser = new Map<string, { email: string; empresa: string; count: number }>();
  for (const u of uploads) {
    const key = u.user.email;
    const existing = byUser.get(key);
    if (existing) {
      existing.count++;
    } else {
      byUser.set(key, { email: u.user.email, empresa: u.user.empresa, count: 1 });
    }
  }

  const rows = [...byUser.values()].sort((a, b) => b.count - a.count);

  // Column widths
  const colEmpresa = Math.max(10, ...rows.map((r) => r.empresa.length));
  const colEmail = Math.max(8, ...rows.map((r) => r.email.length));
  const colCount = 10;

  const sep = `+${"-".repeat(colEmpresa + 2)}+${"-".repeat(colEmail + 2)}+${"-".repeat(colCount + 2)}+`;
  const header = `| ${"Empresa".padEnd(colEmpresa)} | ${"Usuario".padEnd(colEmail)} | ${"Archivos".padStart(colCount)} |`;

  console.log(`\n  CARGAS — ÚLTIMA SEMANA (${weekAgo.toLocaleDateString("es")} → hoy)\n`);
  console.log(sep);
  console.log(header);
  console.log(sep);
  for (const r of rows) {
    console.log(
      `| ${r.empresa.padEnd(colEmpresa)} | ${r.email.padEnd(colEmail)} | ${String(r.count).padStart(colCount)} |`
    );
  }
  console.log(sep);
  console.log(`\n  Total: ${uploads.length} archivos de ${rows.length} usuario(s)\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
