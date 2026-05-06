#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps set up the PostgreSQL database for HospitiumRIS
 * 
 * Usage:
 *   node scripts/setup-database.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 HospitiumRIS Database Setup\n');
console.log('=' .repeat(50));

// Read the .env file to get database connection details
const envPath = path.join(__dirname, '..', '.env');
const envSamplePath = path.join(__dirname, '..', 'env');

let dbUrl = '';

// Try to read from .env first, then fall back to env
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
  if (match) {
    dbUrl = match[1];
  }
} else if (fs.existsSync(envSamplePath)) {
  console.log('⚠️  No .env file found, reading from env file...');
  const envContent = fs.readFileSync(envSamplePath, 'utf-8');
  const match = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
  if (match) {
    dbUrl = match[1];
  }
}

if (!dbUrl) {
  console.error('❌ Could not find DATABASE_URL in .env or env file');
  console.error('\n📝 Please create a .env file with:');
  console.error('   DATABASE_URL="postgresql://username:password@localhost:5432/hospitiumris"');
  process.exit(1);
}

console.log('📊 Database URL found:', dbUrl.replace(/:[^:@]+@/, ':****@'));

// Parse database name from URL
const dbNameMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
const dbName = dbNameMatch ? dbNameMatch[1] : 'hospitiumris';

console.log('📦 Database name:', dbName);
console.log('\n' + '=' .repeat(50));

// Step 1: Create database if it doesn't exist
console.log('\n📝 Step 1: Creating database (if not exists)...');
try {
  // Extract connection details
  const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
  if (!urlMatch) {
    throw new Error('Invalid DATABASE_URL format');
  }
  
  const [, username, password, host, port] = urlMatch;
  
  // Try to create the database using psql
  const createDbCommand = `psql -h ${host} -p ${port} -U ${username} -c "CREATE DATABASE ${dbName};" postgres`;
  
  console.log('   Running: CREATE DATABASE ' + dbName);
  console.log('   (You may be prompted for the PostgreSQL password)');
  
  try {
    execSync(createDbCommand, { 
      stdio: 'inherit',
      env: { ...process.env, PGPASSWORD: password }
    });
    console.log('   ✅ Database created successfully!');
  } catch (error) {
    // Database might already exist, which is fine
    if (error.message.includes('already exists')) {
      console.log('   ℹ️  Database already exists, continuing...');
    } else {
      console.log('   ⚠️  Could not create database automatically');
      console.log('   Please create it manually using:');
      console.log(`   CREATE DATABASE ${dbName};`);
      console.log('\n   Then run this script again.');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('   ❌ Error:', error.message);
  console.log('\n   Please create the database manually:');
  console.log(`   1. Open PostgreSQL (psql or pgAdmin)`);
  console.log(`   2. Run: CREATE DATABASE ${dbName};`);
  console.log('   3. Then run this script again');
  process.exit(1);
}

// Step 2: Run Prisma migrations
console.log('\n📝 Step 2: Running Prisma migrations...');
try {
  console.log('   Generating Prisma Client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n   Running database migrations...');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('   ✅ Migrations completed successfully!');
} catch (error) {
  console.error('   ❌ Migration failed:', error.message);
  console.log('\n   Troubleshooting:');
  console.log('   1. Make sure PostgreSQL is running');
  console.log('   2. Check your DATABASE_URL in .env file');
  console.log('   3. Verify database credentials');
  console.log('   4. Try running manually: npx prisma migrate deploy');
  process.exit(1);
}

// Step 3: Seed the database (optional)
console.log('\n📝 Step 3: Seeding database...');
const seedPath = path.join(__dirname, '..', 'prisma', 'seed.js');
if (fs.existsSync(seedPath)) {
  try {
    console.log('   Running seed script...');
    execSync('node prisma/seed.js', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('   ✅ Database seeded successfully!');
  } catch (error) {
    console.log('   ⚠️  Seeding failed (this is optional):', error.message);
  }
} else {
  console.log('   ℹ️  No seed script found, skipping...');
}

console.log('\n' + '=' .repeat(50));
console.log('✅ Database setup complete!\n');
console.log('📋 Next steps:');
console.log('   1. Copy env to .env if you haven\'t already:');
console.log('      copy env .env');
console.log('   2. Start your development server:');
console.log('      npm run dev');
console.log('   3. Navigate to http://localhost:3001');
console.log('\n' + '=' .repeat(50));
