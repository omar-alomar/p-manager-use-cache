-- Production Migration: Rename Apfo to Milestone
-- Run this script on your production database
-- Make sure to backup your database first!

BEGIN TRANSACTION;

-- Step 1: Create new Milestone table with correct structure
CREATE TABLE "Milestone" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "item" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 2: Copy all data from Apfo to Milestone
INSERT INTO "Milestone" ("id", "date", "item", "projectId", "createdAt")
SELECT "id", "date", "item", "projectId", "createdAt" FROM "Apfo";

-- Step 3: Add milestone column to Project table (if it doesn't exist)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll try to add it and ignore if it already exists
ALTER TABLE "Project" ADD COLUMN "milestone" DATETIME;

-- Step 4: Copy apfo data to milestone column
UPDATE "Project" SET "milestone" = "apfo" WHERE "apfo" IS NOT NULL;

-- Step 5: Drop the old Apfo table
DROP TABLE "Apfo";

-- Step 6: Drop the old apfo column from Project
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- This is a more complex operation, so we'll leave the apfo column for now
-- It can be removed in a future migration when it's safe

-- Step 7: Create index on milestone date for performance
CREATE INDEX "Milestone_date_idx" ON "Milestone"("date");

COMMIT;

-- Verification queries (run these after the migration):
-- SELECT COUNT(*) FROM "Milestone"; -- Should match old Apfo count
-- SELECT COUNT(*) FROM "Project" WHERE "milestone" IS NOT NULL; -- Should match projects with apfo
-- SELECT * FROM "Milestone" LIMIT 5; -- Check data integrity
