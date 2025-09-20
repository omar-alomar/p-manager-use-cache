-- Production Migration: Rename Apfo to Milestone (Safe Version)
-- This version recreates the Project table to properly remove the apfo column
-- Run this script on your production database
-- Make sure to backup your database first!

BEGIN TRANSACTION;

-- Step 1: Create new Milestone table
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

-- Step 3: Create new Project table without apfo column
CREATE TABLE "Project_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "clientId" INTEGER,
    "body" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "milestone" DATETIME,
    "mbaNumber" TEXT NOT NULL DEFAULT '',
    "coFileNumbers" TEXT NOT NULL DEFAULT '',
    "dldReviewer" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Step 4: Copy data from old Project to new Project, mapping apfo to milestone
INSERT INTO "Project_new" (
    "id", "title", "clientId", "body", "userId", 
    "milestone", "mbaNumber", "coFileNumbers", "dldReviewer", "createdAt"
)
SELECT 
    "id", "title", "clientId", "body", "userId",
    "apfo" as "milestone", "mbaNumber", "coFileNumbers", "dldReviewer", "createdAt"
FROM "Project";

-- Step 5: Drop old tables
DROP TABLE "Apfo";
DROP TABLE "Project";

-- Step 6: Rename new table
ALTER TABLE "Project_new" RENAME TO "Project";

-- Step 7: Create indexes
CREATE INDEX "Milestone_date_idx" ON "Milestone"("date");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

COMMIT;

-- Verification queries (run these after the migration):
-- SELECT COUNT(*) FROM "Milestone"; -- Should match old Apfo count
-- SELECT COUNT(*) FROM "Project" WHERE "milestone" IS NOT NULL; -- Should match projects with apfo
-- SELECT * FROM "Milestone" LIMIT 5; -- Check data integrity
-- SELECT * FROM "Project" LIMIT 5; -- Check project data
