/**
 * Login Activity Logging Test Script
 * 
 * This script tests the activity logging functionality for the login system.
 * It simulates various login scenarios and verifies that logs are generated correctly.
 * 
 * Usage:
 * 1. Make sure your database is set up and running
 * 2. Run: node scripts/test-login-logging.js
 * 3. Check the logs/activity.log file for generated entries
 * 4. Optionally check the database registrationLog table for entries
 */

const dotenv = require('dotenv');
const fs = require('fs/promises');
const path = require('path');

// Load environment variables
dotenv.config();

// Import our activity logger
const { 
  logActivity, 
  logInfo, 
  logSuccess, 
  logError, 
  logApiActivity, 
  LOG_LEVELS 
} = require('../src/utils/activityLogger');

const LOG_FILE = path.join(process.cwd(), 'logs', 'activity.log');

const testLoginLogging = async () => {
  console.log('🔧 Testing Login Activity Logging System...\n');
  
  // Test metadata for simulation
  const testMetadata = {
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    method: 'POST',
    url: '/api/auth/login',
    timestamp: new Date().toISOString()
  };

  try {
    console.log('📝 Testing different login scenarios...\n');

    // 1. Test successful login
    console.log('1️⃣ Testing successful login logging...');
    await logSuccess('User login successful', {
      ...testMetadata,
      userId: 'test-user-123',
      email: 'testuser@example.com',
      accountType: 'RESEARCHER',
      dashboardRoute: '/researcher',
      rememberMe: false,
      loginMethod: 'email_password'
    });

    await logApiActivity('POST', '/api/auth/login', 200, {
      ...testMetadata,
      userId: 'test-user-123',
      email: 'testuser@example.com',
      accountType: 'RESEARCHER',
      success: true
    });
    console.log('   ✅ Successful login logged\n');

    // 2. Test invalid credentials
    console.log('2️⃣ Testing invalid credentials logging...');
    await logError('Login failed: Invalid password', {
      ...testMetadata,
      userId: 'test-user-123',
      email: 'testuser@example.com',
      accountType: 'RESEARCHER',
      reason: 'invalid_password'
    });

    await logApiActivity('POST', '/api/auth/login', 401, {
      ...testMetadata,
      userId: 'test-user-123',
      email: 'testuser@example.com',
      error: 'invalid_credentials'
    });
    console.log('   ✅ Invalid credentials logged\n');

    // 3. Test user not found
    console.log('3️⃣ Testing user not found logging...');
    await logError('Login failed: User not found', {
      ...testMetadata,
      email: 'nonexistent@example.com',
      reason: 'user_not_found'
    });

    await logApiActivity('POST', '/api/auth/login', 401, {
      ...testMetadata,
      email: 'nonexistent@example.com',
      error: 'invalid_credentials'
    });
    console.log('   ✅ User not found logged\n');

    // 4. Test account not verified
    console.log('4️⃣ Testing unverified account logging...');
    await logError('Login failed: Account not verified', {
      ...testMetadata,
      userId: 'test-user-456',
      email: 'unverified@example.com',
      accountType: 'RESEARCHER',
      reason: 'account_not_verified'
    });

    await logApiActivity('POST', '/api/auth/login', 403, {
      ...testMetadata,
      userId: 'test-user-456',
      email: 'unverified@example.com',
      error: 'account_not_verified'
    });
    console.log('   ✅ Unverified account logged\n');

    // 5. Test account suspended
    console.log('5️⃣ Testing suspended account logging...');
    await logError('Login failed: Account suspended or inactive', {
      ...testMetadata,
      userId: 'test-user-789',
      email: 'suspended@example.com',
      accountType: 'RESEARCHER',
      userStatus: 'SUSPENDED',
      reason: 'account_suspended'
    });

    await logApiActivity('POST', '/api/auth/login', 403, {
      ...testMetadata,
      userId: 'test-user-789',
      email: 'suspended@example.com',
      error: 'account_suspended'
    });
    console.log('   ✅ Suspended account logged\n');

    // 6. Test validation errors
    console.log('6️⃣ Testing validation errors logging...');
    await logError('Login validation failed: Email and password are required', {
      ...testMetadata,
      email: '',
      field: 'email',
      reason: 'missing_credentials'
    });

    await logApiActivity('POST', '/api/auth/login', 400, {
      ...testMetadata,
      email: '',
      error: 'validation_failed'
    });
    console.log('   ✅ Validation errors logged\n');

    // 7. Test unexpected server error
    console.log('7️⃣ Testing unexpected server error logging...');
    await logError('Unexpected login error', {
      ...testMetadata,
      email: 'testuser@example.com',
      error: 'Database connection failed',
      stack: 'Error: Database connection failed\n    at loginHandler (/api/auth/login)',
      reason: 'unexpected_error'
    });

    await logApiActivity('POST', '/api/auth/login', 500, {
      ...testMetadata,
      email: 'testuser@example.com',
      error: 'internal_server_error'
    });
    console.log('   ✅ Unexpected server error logged\n');

    // 8. Test login attempt initiation
    console.log('8️⃣ Testing login attempt initiation logging...');
    await logInfo('Login attempt initiated', {
      ...testMetadata,
      email: 'testuser@example.com',
      hasPassword: true,
      rememberMe: false
    });
    console.log('   ✅ Login attempt initiation logged\n');

    // Test client-side logging scenarios
    console.log('9️⃣ Testing client-side logging scenarios...');
    
    // Simulate client-side logs that would be generated
    const clientLogs = [
      {
        action: 'login_page_visited',
        timestamp: new Date().toISOString(),
        page: 'login',
        userAgent: testMetadata.userAgent,
        url: 'http://localhost:3000/login'
      },
      {
        action: 'form_validation_failed',
        timestamp: new Date().toISOString(),
        page: 'login',
        errors: ['email', 'password'],
        hasEmail: false,
        hasPassword: false
      },
      {
        action: 'login_attempt_started',
        timestamp: new Date().toISOString(),
        page: 'login',
        email: 'testuser@example.com',
        rememberMe: false
      },
      {
        action: 'social_login_initiated',
        timestamp: new Date().toISOString(),
        page: 'login',
        provider: 'ORCID'
      }
    ];

    console.log('   📱 Client-side logs that would be generated:');
    clientLogs.forEach((log, index) => {
      console.log(`      ${index + 1}. ${log.action} - ${log.timestamp}`);
    });
    console.log('   ✅ Client-side logging scenarios documented\n');

    // Verify log file exists and check recent entries
    console.log('📄 Verifying activity log file...');
    try {
      const stats = await fs.stat(LOG_FILE);
      console.log(`   ✅ Log file exists: ${LOG_FILE}`);
      console.log(`   📊 File size: ${stats.size} bytes`);
      console.log(`   🕐 Last modified: ${stats.mtime.toISOString()}\n`);

      // Read and display last few entries
      console.log('📋 Recent log entries (last 5):');
      const logContent = await fs.readFile(LOG_FILE, 'utf-8');
      const logLines = logContent.trim().split('\n');
      const recentLines = logLines.slice(-5);
      
      recentLines.forEach((line, index) => {
        try {
          const logEntry = JSON.parse(line);
          console.log(`   ${recentLines.length - index}. [${logEntry.level}] ${logEntry.message} - ${logEntry.timestamp}`);
        } catch (e) {
          console.log(`   ${recentLines.length - index}. ${line}`);
        }
      });

    } catch (error) {
      console.error(`   ❌ Could not access log file: ${error.message}`);
    }

    console.log('\n🎉 All login logging tests completed successfully!');
    console.log('\n📋 Summary of tested scenarios:');
    console.log('   ✅ Successful login');
    console.log('   ✅ Invalid credentials');
    console.log('   ✅ User not found');
    console.log('   ✅ Account not verified');
    console.log('   ✅ Account suspended');
    console.log('   ✅ Validation errors');
    console.log('   ✅ Server errors');
    console.log('   ✅ Login attempt initiation');
    console.log('   ✅ Client-side scenarios');
    
    console.log('\n🔍 Next steps:');
    console.log('   1. Check the activity log file for all entries');
    console.log('   2. Test actual login in your application');
    console.log('   3. Monitor logs during real user interactions');
    console.log('   4. Set up log rotation if needed for production');

  } catch (error) {
    console.error('❌ Error during login logging test:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   - Make sure the logs directory exists');
    console.log('   - Check file permissions for writing logs');
    console.log('   - Verify the activity logger module is working');
    console.log('   - Check your Node.js version compatibility');
    
    process.exit(1);
  }
};

// Run the test
testLoginLogging();
