/*
  Warnings:

  - You are about to alter the column `apfo` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "apfo" DATETIME,
    "mbaNumber" TEXT NOT NULL DEFAULT '',
    "coFileNumbers" TEXT NOT NULL DEFAULT '',
    "dldReviewer" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("apfo", "body", "client", "coFileNumbers", "createdAt", "dldReviewer", "id", "mbaNumber", "title", "userId") SELECT "apfo", "body", "client", "coFileNumbers", "createdAt", "dldReviewer", "id", "mbaNumber", "title", "userId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
