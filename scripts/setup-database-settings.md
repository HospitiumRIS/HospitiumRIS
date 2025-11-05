# Database Settings Setup Guide

## Current Status
✅ **Prisma Client Generated** - New UserSettings model available  
✅ **API Routes Ready** - Graceful error handling implemented  
✅ **Settings Components Ready** - Database-backed settings UI complete  
❌ **Database Table Missing** - Migration needed to create UserSettings table

## Quick Setup

### Option 1: Full Database Migration (Recommended)
If you have your database configured with `DATABASE_URL`:

```bash
# Run the migration to create UserSettings table
npx prisma migrate dev --name add-user-settings

# Start the development server
npm run dev
```

### Option 2: Database Push (Alternative)
If you want to apply schema changes without creating migration files:

```bash
# Push schema changes directly to database
npx prisma db push

# Start the development server  
npm run dev
```

### Option 3: Reset Database (If needed)
If you encounter issues and want to start fresh:

```bash
# Reset database and apply all migrations
npx prisma migrate reset

# Start the development server
npm run dev
```

## Current Error Handling

The system now gracefully handles the missing UserSettings table:

- **GET requests**: Returns default empty settings
- **POST requests**: Shows helpful error message about migration
- **DELETE requests**: Considers settings "cleared" if table missing

## User Experience During Setup

### Before Migration:
- ✅ Settings page loads successfully
- ✅ Shows empty form for configuration
- ❌ Save button shows "Database setup required" error
- ✅ Zotero import shows setup guidance

### After Migration:
- ✅ Settings page loads with persistence
- ✅ Save/load settings work perfectly
- ✅ Zotero import auto-authenticates
- ✅ Multi-device synchronization works

## Testing the Complete Flow

1. **Run Migration**:
   ```bash
   npx prisma migrate dev --name add-user-settings
   ```

2. **Access Settings**: 
   - Go to `http://localhost:3000/researcher/settings`
   - Or click Settings in user menu

3. **Configure Zotero**:
   - Enter Zotero User ID and API Key
   - Test connection
   - Save settings

4. **Test Import**:
   - Go to `http://localhost:3000/researcher/publications/import`
   - Click Zotero tab
   - Should auto-authenticate and show collections

## Database Schema Created

The migration will create this table:

```sql
CREATE TABLE "user_settings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "SettingsType" NOT NULL,
  "settings" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_settings_userId_type_key" 
ON "user_settings"("userId", "type");

ALTER TABLE "user_settings" 
ADD CONSTRAINT "user_settings_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
```

## Troubleshooting

### Common Issues:

**1. DATABASE_URL not set**
```bash
# Add to .env file
DATABASE_URL="your_database_connection_string"
```

**2. Permission errors on Windows**
```bash
# Stop development server first
taskkill /f /im node.exe
# Then run migration
npx prisma migrate dev --name add-user-settings
```

**3. Migration conflicts**
```bash
# Reset and start fresh
npx prisma migrate reset
npx prisma migrate dev --name add-user-settings
```

## Next Steps

After completing the database setup:

1. ✅ **Test settings persistence**
2. ✅ **Configure Zotero integration** 
3. ✅ **Verify multi-device sync**
4. ✅ **Test import functionality**

The database-backed settings system will then be fully operational! 🎉
