#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * This script runs Prisma migrations without requiring PowerShell execution policy changes.
 * 
 * Usage:
 *   node scripts/run-migration.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Running Prisma migration...\n');

try {
  // Run the migration
  const command = 'node node_modules/prisma/build/index.js migrate dev --name add_proposal_review_pipeline';
  
  console.log(`Executing: ${command}\n`);
  
  execSync(command, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  
  console.log('\n✅ Migration completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your development server');
  console.log('   2. Navigate to http://localhost:3000/institution/administration/proposal-review-pipeline');
  console.log('   3. Create your first review pipeline\n');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('   1. Make sure PostgreSQL is running');
  console.error('   2. Check your DATABASE_URL in .env file');
  console.error('   3. Ensure you have database connection permissions\n');
  process.exit(1);
}
