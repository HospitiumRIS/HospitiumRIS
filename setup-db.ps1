# HospitiumRIS Database Setup Script for Windows
# This script creates the database and runs migrations

Write-Host "🔧 HospitiumRIS Database Setup" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Gray

# Check if .env exists, if not copy from env
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from env template..." -ForegroundColor Yellow
    Copy-Item "env" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Database configuration from your env file
$dbName = "hospitiumris"
$dbUser = "postgres"
$dbPassword = "Waxmangme86"
$dbHost = "localhost"
$dbPort = "5432"

Write-Host "`n📊 Database Configuration:" -ForegroundColor Cyan
Write-Host "   Host: $dbHost" -ForegroundColor Gray
Write-Host "   Port: $dbPort" -ForegroundColor Gray
Write-Host "   Database: $dbName" -ForegroundColor Gray
Write-Host "   User: $dbUser" -ForegroundColor Gray

Write-Host "`n" + ("=" * 50) -ForegroundColor Gray

# Step 1: Create database
Write-Host "`n📝 Step 1: Creating database..." -ForegroundColor Cyan

$env:PGPASSWORD = $dbPassword

try {
    # Check if database exists
    $checkDb = "SELECT 1 FROM pg_database WHERE datname='$dbName'"
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d postgres -t -c $checkDb 2>$null
    
    if ($result -match "1") {
        Write-Host "   ℹ️  Database '$dbName' already exists" -ForegroundColor Yellow
    } else {
        # Create database
        Write-Host "   Creating database '$dbName'..." -ForegroundColor Gray
        & psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Database created successfully!" -ForegroundColor Green
        } else {
            throw "Failed to create database"
        }
    }
} catch {
    Write-Host "   ❌ Error creating database: $_" -ForegroundColor Red
    Write-Host "`n   Manual steps:" -ForegroundColor Yellow
    Write-Host "   1. Open pgAdmin or psql" -ForegroundColor Gray
    Write-Host "   2. Run: CREATE DATABASE $dbName;" -ForegroundColor Gray
    Write-Host "   3. Then run this script again" -ForegroundColor Gray
    exit 1
}

# Step 2: Generate Prisma Client
Write-Host "`n📝 Step 2: Generating Prisma Client..." -ForegroundColor Cyan
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Prisma Client generated!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Step 3: Run migrations
Write-Host "`n📝 Step 3: Running database migrations..." -ForegroundColor Cyan
try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Migrations completed!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Migration failed, trying alternative..." -ForegroundColor Yellow
    try {
        npx prisma db push
        Write-Host "   ✅ Database schema pushed!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to apply migrations" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Seed database (optional)
Write-Host "`n📝 Step 4: Seeding database..." -ForegroundColor Cyan
if (Test-Path "prisma\seed.js") {
    try {
        node prisma\seed.js
        Write-Host "   ✅ Database seeded!" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Seeding failed (optional step)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  No seed file found, skipping..." -ForegroundColor Gray
}

Write-Host "`n" + ("=" * 50) -ForegroundColor Gray
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start your development server:" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor White
Write-Host "   2. Navigate to http://localhost:3001" -ForegroundColor Gray
Write-Host "`n" + ("=" * 50) -ForegroundColor Gray

# Clean up
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
