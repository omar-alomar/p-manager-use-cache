/**
 * Backfill completedAt for existing completed tasks.
 * Sets completedAt = updatedAt for all tasks where completed = true and completedAt is null.
 *
 * Run: npx tsx scripts/backfill-completed-at.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "Task"
    SET "completedAt" = "updatedAt"
    WHERE completed = true AND "completedAt" IS NULL
  `
  console.log(`Backfilled completedAt for ${result} tasks`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
