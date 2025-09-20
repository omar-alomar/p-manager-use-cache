# Production Migration Strategy for Apfo → Milestone Rename

## 🚨 CRITICAL: Production Migration Plan

### Current Situation
- Dev environment: Clean migration with Apfo → Milestone rename
- Production: Still has old migrations with potential conflicts
- Need to safely migrate production without data loss

## 📋 Production Migration Steps

### Step 1: Backup Production Database
```bash
# Create full backup before any changes
pg_dump your_production_db > backup_before_milestone_rename_$(date +%Y%m%d_%H%M%S).sql

# Or for SQLite:
cp production.db production_backup_$(date +%Y%m%d_%H%M%S).db
```

### Step 2: Create Production Migration Script
```sql
-- Migration: Rename Apfo to Milestone
-- This should be run as a single transaction

BEGIN TRANSACTION;

-- Step 1: Rename the table
ALTER TABLE "Apfo" RENAME TO "Milestone";

-- Step 2: Update the Project table column
ALTER TABLE "Project" RENAME COLUMN "apfo" TO "milestone";

-- Step 3: Update the relation name (if needed)
-- Note: SQLite doesn't support renaming foreign key constraints directly
-- The constraint will be recreated on next migration

COMMIT;
```

### Step 3: Alternative Approach (Safer)
If the above doesn't work due to foreign key constraints:

```sql
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

-- Step 2: Copy data from Apfo to Milestone
INSERT INTO "Milestone" ("id", "date", "item", "projectId", "createdAt")
SELECT "id", "date", "item", "projectId", "createdAt" FROM "Apfo";

-- Step 3: Add milestone column to Project (if not exists)
ALTER TABLE "Project" ADD COLUMN "milestone" DATETIME;

-- Step 4: Copy apfo data to milestone column
UPDATE "Project" SET "milestone" = "apfo" WHERE "apfo" IS NOT NULL;

-- Step 5: Drop old Apfo table
DROP TABLE "Apfo";

-- Step 6: Drop old apfo column
ALTER TABLE "Project" DROP COLUMN "apfo";

COMMIT;
```

## 🛠️ Implementation Options

### Option A: Manual SQL Migration (Recommended)
1. Connect to production database
2. Run the migration SQL above
3. Update your Prisma schema
4. Deploy the new code

### Option B: Prisma Migrate with Custom SQL
1. Create a custom migration file:
```bash
npx prisma migrate dev --create-only --name rename_apfo_to_milestone
```

2. Edit the generated migration file to use the SQL above

3. Apply the migration:
```bash
npx prisma migrate deploy
```

### Option C: Schema Push (If you control the database)
```bash
# This will apply schema changes directly
npx prisma db push
```

## 🔍 Verification Steps

After migration:
1. Check that Milestone table exists with correct data
2. Verify Project table has milestone column
3. Test that foreign key relationships work
4. Run your application tests
5. Verify no data was lost

## 🚨 Rollback Plan

If something goes wrong:
```sql
-- Rollback script
BEGIN TRANSACTION;

-- Restore Apfo table
CREATE TABLE "Apfo" AS SELECT * FROM "Milestone";
DROP TABLE "Milestone";

-- Restore apfo column
ALTER TABLE "Project" ADD COLUMN "apfo" DATETIME;
UPDATE "Project" SET "apfo" = "milestone" WHERE "milestone" IS NOT NULL;
ALTER TABLE "Project" DROP COLUMN "milestone";

COMMIT;
```

## 📝 Pre-Migration Checklist

- [ ] Production database backed up
- [ ] Migration script tested on staging
- [ ] Rollback plan prepared
- [ ] Application code deployed (with Apfo → Milestone changes)
- [ ] Monitoring in place
- [ ] Team notified of maintenance window

## 🎯 Recommended Approach

1. **Test on staging first** with production data copy
2. **Use Option A (Manual SQL)** for production
3. **Have rollback ready** before starting
4. **Monitor application** after migration
5. **Verify all functionality** works correctly

## 📞 Emergency Contacts

- Database Admin: [Your DB admin contact]
- DevOps Team: [Your DevOps contact]
- Application Team: [Your team contact]
