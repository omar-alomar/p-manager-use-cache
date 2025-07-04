/*
  Warnings:

  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `suite` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `zipcode` on the `User` table. All the data in the column will be lost.

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
    "apfo" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("body", "id", "title", "userId") SELECT "body", "id", "title", "userId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL
);
INSERT INTO "new_User" ("email", "id", "name") SELECT "email", "id", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
