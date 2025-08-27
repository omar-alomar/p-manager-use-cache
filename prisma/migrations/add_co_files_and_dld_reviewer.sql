-- Add coFileNumbers and dldReviewer fields to Project table
ALTER TABLE "Project" ADD COLUMN "coFileNumbers" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Project" ADD COLUMN "dldReviewer" TEXT NOT NULL DEFAULT '';

