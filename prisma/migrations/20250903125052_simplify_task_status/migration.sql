-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATETIME,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("completed", "createdAt", "description", "dueDate", "id", "priority", "projectId", "status", "title", "updatedAt", "userId") 
SELECT 
  "completed", 
  "createdAt", 
  "description", 
  "dueDate", 
  "id", 
  "priority", 
  "projectId", 
  CASE 
    WHEN "status" = 'TODO' THEN 'IN_PROGRESS'
    WHEN "status" = 'IN_REVIEW' THEN 'IN_PROGRESS'
    WHEN "status" = 'CANCELLED' THEN 'IN_PROGRESS'
    ELSE "status"
  END,
  "title", 
  "updatedAt", 
  "userId" 
FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
