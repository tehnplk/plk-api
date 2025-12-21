const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const row = await prisma.kpiReport.findFirst({
      select: {
        money_year: true,
        area_name: true,
        kpi_id: true,
        area_level: true,
      },
    });

    console.log(JSON.stringify(row, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
