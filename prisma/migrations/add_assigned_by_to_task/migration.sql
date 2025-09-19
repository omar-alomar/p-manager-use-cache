-- Add assignedById field to Task table
ALTER TABLE "Task" ADD COLUMN "assignedById" INTEGER;

-- Add foreign key constraint
-- Note: This will be handled by Prisma when we update the schema
