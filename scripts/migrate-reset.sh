#!/bin/bash

# Prisma Migration Reset Script
# This script provides a clean way to reset migrations when conflicts occur

echo "🔄 Resetting Prisma migrations..."

# Stop any running development server
echo "⏹️  Stopping development server..."
pkill -f "npm run dev" || true
pkill -f "next dev" || true

# Backup current database if it exists
if [ -f "prisma/dev.db" ]; then
    echo "💾 Creating database backup..."
    cp prisma/dev.db "prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Remove migrations and database
echo "🗑️  Removing old migrations and database..."
rm -rf prisma/migrations
rm -f prisma/dev.db

# Create fresh migration
echo "🆕 Creating fresh migration..."
npx prisma migrate dev --name init

# Seed the database
echo "🌱 Seeding database..."
npx prisma db seed

echo "✅ Migration reset complete!"
echo "🚀 You can now run 'npm run dev' to start the development server"
