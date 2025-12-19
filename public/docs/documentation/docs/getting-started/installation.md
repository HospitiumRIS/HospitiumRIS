---
sidebar_position: 2
title: Installation Guide
---

# Installation Guide

This guide walks you through setting up HospitiumRIS from scratch.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/hospitiumris/hospitiumris.git
cd hospitiumris

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize the database
npx prisma migrate dev

# Start the development server
npm run dev
```

## Detailed Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/hospitiumris/hospitiumris.git
cd hospitiumris
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 16 and React 19
- Material UI 7 components
- Prisma ORM client
- TipTap editor extensions
- Chart.js and D3.js for visualizations

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/hospitiumris?schema=public"

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# ORCID OAuth Configuration (Optional)
ORCID_CLIENT_ID="your-orcid-client-id"
ORCID_CLIENT_SECRET="your-orcid-client-secret"
ORCID_REDIRECT_URI="http://localhost:3000/auth/orcid/callback"
ORCID_SANDBOX="true"

# Email Configuration (Optional)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@hospitiumris.com"

# Security
JWT_SECRET="your-secure-random-string-minimum-32-characters"
```

### Step 4: Set Up PostgreSQL Database

#### Create the Database

**Windows (psql):**
```bash
psql -U postgres
CREATE DATABASE hospitiumris;
CREATE USER hospitiumuser WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE hospitiumris TO hospitiumuser;
\q
```

**Linux/macOS:**
```bash
sudo -u postgres psql
CREATE DATABASE hospitiumris;
CREATE USER hospitiumuser WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE hospitiumris TO hospitiumuser;
\q
```

#### Update DATABASE_URL

Update your `.env` file with the database connection string:

```env
DATABASE_URL="postgresql://hospitiumuser:your-secure-password@localhost:5432/hospitiumris?schema=public"
```

### Step 5: Initialize Database Schema

Generate the Prisma client and run migrations:

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

To seed sample data (optional):

```bash
npm run db:seed
```

### Step 6: Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Production Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Production Environment Variables

For production, update your `.env`:

```env
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
ORCID_SANDBOX="false"
```

### Production Considerations

1. **Use HTTPS** - Configure SSL certificates
2. **Secure Environment Variables** - Use secrets management
3. **Database Backups** - Set up automated backups
4. **Monitoring** - Implement logging and error tracking
5. **Reverse Proxy** - Use Nginx or similar for load balancing

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes without migration |
| `npm run db:migrate` | Run database migrations |
| `npm run db:reset` | Reset database (⚠️ destroys data) |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## Troubleshooting

### Database Connection Issues

**Error:** `Error: P1001: Can't reach database server`

**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL credentials
3. Ensure the database exists
4. Check firewall/port settings

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find the process
netstat -ano | findstr :3000   # Windows
lsof -i :3000                   # Linux/macOS

# Kill the process or use a different port
npm run dev -- -p 3001
```

### Prisma Migration Issues

**Error:** `Migration failed`

**Solution:**
```bash
# Reset the database (WARNING: destroys data)
npm run db:reset

# Or manually fix and retry
npx prisma migrate dev --name fix_migration
```

### Node.js Version Issues

**Error:** `Unsupported engine`

**Solution:**
Use Node.js 18.x or 20.x LTS:
```bash
# Using nvm
nvm install 20
nvm use 20
```

---

## Next Steps

After installation:

1. [Create your first admin account](/docs/modules/super-admin)
2. [Set up ORCID integration](/docs/features/orcid)
3. [Explore the Researcher Portal](/docs/modules/researcher)
4. [Understand the Database Schema](/docs/database/schema)

:::tip Need Help?
Check the logs in the `logs/` directory or run Prisma Studio to debug database issues:
```bash
npm run db:studio
```
:::

