#!/usr/bin/env node

/**
 * ORCID Setup Helper Script
 * 
 * This script helps you configure ORCID environment variables
 * after you've registered your application with ORCID.
 * 
 * Usage: node scripts/setup-orcid.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupOrcid() {
  console.log('🔧 ORCID Configuration Setup');
  console.log('============================\n');
  
  console.log('Before proceeding, make sure you have:');
  console.log('1. ✅ Registered your app at: https://sandbox.orcid.org/developer-tools');
  console.log('2. ✅ Used redirect URI: http://localhost:3001/api/auth/orcid/callback');
  console.log('3. ✅ Received your Client ID and Client Secret\n');

  const proceed = await askQuestion('Do you have your ORCID credentials ready? (y/n): ');
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    console.log('\n📋 Steps to get ORCID credentials:');
    console.log('1. Go to: https://sandbox.orcid.org/developer-tools');
    console.log('2. Sign in or create a sandbox account');
    console.log('3. Register your application with these details:');
    console.log('   - Application Name: Hospitium RIS');
    console.log('   - Website URL: http://localhost:3001');
    console.log('   - Redirect URI: http://localhost:3001/api/auth/orcid/callback');
    console.log('4. Copy your Client ID and Client Secret');
    console.log('5. Run this script again\n');
    process.exit(0);
  }

  console.log('\n🔑 Enter your ORCID credentials:');
  
  const clientId = await askQuestion('ORCID Client ID (APP-XXXXXXXXXXXXXXXXX): ');
  if (!clientId || !clientId.startsWith('APP-')) {
    console.log('❌ Invalid Client ID format. Should start with "APP-"');
    process.exit(1);
  }

  const clientSecret = await askQuestion('ORCID Client Secret (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx): ');
  if (!clientSecret || clientSecret.length < 30) {
    console.log('❌ Client Secret seems too short. Please check your credentials.');
    process.exit(1);
  }

  // Read current .env file
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found. Please make sure you have a .env file.');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Replace ORCID placeholders
  envContent = envContent.replace(
    'NEXT_PUBLIC_ORCID_CLIENT_ID=your_orcid_client_id_here',
    `NEXT_PUBLIC_ORCID_CLIENT_ID=${clientId}`
  );
  
  envContent = envContent.replace(
    'ORCID_CLIENT_SECRET=your_orcid_client_secret_here',
    `ORCID_CLIENT_SECRET=${clientSecret}`
  );

  // Write updated .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ ORCID configuration updated successfully!');
  console.log('\n📋 Your ORCID settings:');
  console.log(`   Client ID: ${clientId}`);
  console.log(`   Client Secret: ${clientSecret.substring(0, 8)}...`);
  console.log(`   Redirect URI: http://localhost:3001/api/auth/orcid/callback`);
  
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Go to: http://localhost:3001/login');
  console.log('3. Click the ORCID button to test the integration');
  console.log('4. Check activity logs at: http://localhost:3001/logs\n');

  rl.close();
}

// Only run if called directly
if (require.main === module) {
  setupOrcid().catch((error) => {
    console.error('❌ Setup failed:', error);
    rl.close();
    process.exit(1);
  });
}

module.exports = { setupOrcid };
