# Prisma Migration Management Guide

## 🚨 Migration Conflict Resolution

### Quick Fix (When migrations get out of sync)

```bash
# Run the reset script
./scripts/migrate-reset.sh

# Or manually:
rm -rf prisma/migrations
rm -f prisma/dev.db
npx prisma migrate dev --name init
npx prisma db seed
```

### 🔍 Common Migration Issues

1. **Duplicate Column Errors**: Usually caused by multiple migrations trying to add the same column
2. **Drift Detection**: Database schema doesn't match migration history
3. **Foreign Key Conflicts**: Constraint violations during migration

### 🛠️ Best Practices

#### Before Making Schema Changes:
1. **Always backup your database**:
   ```bash
   cp prisma/dev.db "prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)"
   ```

2. **Check current migration status**:
   ```bash
   npx prisma migrate status
   ```

#### When Adding New Fields:
1. **Use descriptive migration names**:
   ```bash
   npx prisma migrate dev --name add_user_avatar_field
   ```

2. **Test migrations on a copy first**:
   ```bash
   cp prisma/dev.db prisma/test.db
   # Test with test database
   ```

#### When Renaming Models/Fields:
1. **Use a two-step process**:
   - Step 1: Add new field/model
   - Step 2: Remove old field/model

2. **Or use a single migration with proper SQL**:
   ```sql
   -- Rename column
   ALTER TABLE "Project" RENAME COLUMN "apfo" TO "milestone";
   ```

### 🔧 Advanced Migration Management

#### Reset to Clean State:
```bash
# Nuclear option - removes all data
npx prisma migrate reset --force
npx prisma db seed
```

#### Create Migration from Current Schema:
```bash
# When you have schema changes but no migration
npx prisma migrate dev --name describe_your_changes
```

#### Fix Migration Conflicts:
```bash
# 1. Check what's wrong
npx prisma migrate status

# 2. If there's drift, reset
npx prisma migrate reset --force

# 3. Create fresh migration
npx prisma migrate dev --name init
```

### 📋 Migration Checklist

- [ ] Schema changes are complete and tested
- [ ] Migration name is descriptive
- [ ] Database is backed up
- [ ] Migration runs without errors
- [ ] Seed data works after migration
- [ ] Application starts successfully
- [ ] All tests pass

### 🚀 Production Migration Strategy

1. **Always test migrations locally first**
2. **Use staging environment for testing**
3. **Have rollback plan ready**
4. **Backup production database before migration**
5. **Run migrations during low-traffic periods**

### 📞 Emergency Recovery

If migrations are completely broken:

```bash
# 1. Stop all services
pkill -f "npm run dev"

# 2. Backup everything
cp -r prisma prisma.backup.$(date +%Y%m%d_%H%M%S)

# 3. Reset completely
rm -rf prisma/migrations
rm -f prisma/dev.db

# 4. Recreate from schema
npx prisma migrate dev --name emergency_recovery

# 5. Restore data if needed
# (You'll need to restore from backup or recreate)
```

### 🔍 Debugging Migrations

```bash
# Check migration status
npx prisma migrate status

# View migration history
ls -la prisma/migrations/

# Check database schema
npx prisma db pull

# Compare schema with database
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
```

## 📝 Notes

- Always commit migration files to version control
- Never edit migration files after they've been applied
- Use `--create-only` flag to create migration without applying it
- Test migrations on a copy of production data when possible
