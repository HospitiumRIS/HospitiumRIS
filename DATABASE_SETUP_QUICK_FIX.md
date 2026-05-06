# Database Setup Quick Fix

## Problem
```
Database `hospitiumRis` does not exist
```

This error occurs when the PostgreSQL database hasn't been created yet.

---

## Quick Fix (Choose One Method)

### **Method 1: PowerShell Script (Recommended for Windows)** ⚡

Run this in PowerShell from the project root:

```powershell
.\setup-db.ps1
```

This script will:
1. ✅ Create `.env` file if missing
2. ✅ Create the database `hospitiumris`
3. ✅ Generate Prisma Client
4. ✅ Run all migrations
5. ✅ Seed the database

---

### **Method 2: Node.js Script** 🔧

Run this in your terminal:

```bash
node scripts/setup-database.js
```

---

### **Method 3: Manual Setup** 🛠️

If the scripts don't work, follow these steps:

#### Step 1: Create .env file
```bash
copy env .env
```

#### Step 2: Create the database

Open PostgreSQL (pgAdmin or psql) and run:

```sql
CREATE DATABASE hospitiumris;
```

Or use psql command line:
```bash
psql -U postgres -c "CREATE DATABASE hospitiumris;"
```

#### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

#### Step 4: Run migrations
```bash
npx prisma migrate deploy
```

Or if that fails:
```bash
npx prisma db push
```

#### Step 5: Seed the database (optional)
```bash
node prisma/seed.js
```

---

## Verify Setup

After running the setup, verify the database:

```bash
npx prisma studio
```

This will open Prisma Studio where you can see your database tables.

---

## Common Issues

### Issue 1: PostgreSQL not running
**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
- Start PostgreSQL service
- Windows: Open Services → PostgreSQL → Start
- Or use pgAdmin to start the server

### Issue 2: Wrong password
**Error:** `password authentication failed`

**Solution:**
- Check your password in the `env` file (line 1)
- Current password: `Waxmangme86`
- Update if needed

### Issue 3: Database name case mismatch
**Error:** Database `hospitiumRis` vs `hospitiumris`

**Solution:**
- PostgreSQL is case-sensitive
- Use lowercase: `hospitiumris`
- Check your DATABASE_URL in `.env`

### Issue 4: Port already in use
**Error:** `Port 5432 is already in use`

**Solution:**
- Another PostgreSQL instance might be running
- Check running services
- Or change the port in your DATABASE_URL

---

## Database Connection String

Your current configuration (from `env` file):

```
DATABASE_URL="postgresql://postgres:Waxmangme86@localhost:5432/hospitiumris"
```

Format breakdown:
- **Protocol:** `postgresql://`
- **Username:** `postgres`
- **Password:** `Waxmangme86`
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `hospitiumris`

---

## After Setup

Once the database is set up:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:**
   ```
   http://localhost:3001
   ```

3. **Login with your credentials**

---

## Troubleshooting Commands

### Check if database exists:
```bash
psql -U postgres -l
```

### Connect to database:
```bash
psql -U postgres -d hospitiumris
```

### List all tables:
```sql
\dt
```

### Check Prisma migration status:
```bash
npx prisma migrate status
```

### Reset database (⚠️ WARNING: Deletes all data):
```bash
npx prisma migrate reset
```

---

## Need Help?

If you're still having issues:

1. **Check PostgreSQL is running:**
   - Windows: Services → PostgreSQL
   - Or check in pgAdmin

2. **Verify credentials:**
   - Username: `postgres`
   - Password: `Waxmangme86`
   - Port: `5432`

3. **Check logs:**
   - Look at the terminal output for specific errors
   - Check PostgreSQL logs in pgAdmin

4. **Try Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   This will show if Prisma can connect to the database

---

## Scripts Created

Two new scripts have been added to help with setup:

1. **`setup-db.ps1`** - PowerShell script for Windows
   - Automated database creation
   - Runs migrations
   - Seeds data

2. **`scripts/setup-database.js`** - Node.js script
   - Cross-platform
   - Detailed error messages
   - Step-by-step execution

Both scripts do the same thing - choose whichever is easier for you!
