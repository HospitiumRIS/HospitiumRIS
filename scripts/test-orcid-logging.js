#!/usr/bin/env node

/**
 * Test script for ORCID login logging
 * 
 * This script simulates various ORCID login scenarios to test the comprehensive
 * activity logging system we've implemented.
 * 
 * Usage: node scripts/test-orcid-logging.js
 */

const fs = require('fs');
const path = require('path');

// Import activity logger utilities
const { logInfo, logError, logSuccess } = require('../src/utils/activityLogger');

const generateTestMetadata = (scenario) => ({
  ip: '127.0.0.1',
  userAgent: 'Mozilla/5.0 (Test ORCID Flow)',
  method: 'GET',
  url: `http://localhost:3000/api/auth/orcid/callback?${scenario}`,
  timestamp: new Date().toISOString()
});

async function testOrcidLoggingScenarios() {
  console.log('🧪 Testing ORCID Login Activity Logging...\n');

  try {
    // Test 1: ORCID callback initiation
    console.log('📝 Test 1: ORCID callback initiated');
    await logInfo('ORCID callback initiated', {
      ...generateTestMetadata('code=test123&state=teststate'),
      hasCode: true,
      hasState: true,
      errorParam: null,
      endpoint: '/api/auth/orcid/callback'
    });

    // Test 2: Token exchange success
    console.log('📝 Test 2: ORCID token exchange successful');
    await logSuccess('ORCID token exchange successful', {
      ...generateTestMetadata('code=test123'),
      orcidId: '0000-0000-0000-TEST',
      name: 'Test User',
      hasToken: true,
      endpoint: '/api/auth/orcid/callback'
    });

    // Test 3: Existing user found - login success
    console.log('📝 Test 3: ORCID user found - proceeding to login');
    await logInfo('ORCID user found - proceeding to login', {
      ...generateTestMetadata('code=test123'),
      userId: 'test-user-id-123',
      email: 'test@example.com',
      accountType: 'RESEARCHER',
      orcidId: '0000-0000-0000-TEST',
      loginMethod: 'orcid'
    });

    // Test 4: ORCID login successful
    console.log('📝 Test 4: ORCID login successful');
    await logSuccess('ORCID login successful', {
      ...generateTestMetadata('code=test123'),
      userId: 'test-user-id-123',
      email: 'test@example.com',
      accountType: 'RESEARCHER',
      orcidId: '0000-0000-0000-TEST',
      dashboardRoute: '/researcher',
      loginMethod: 'orcid'
    });

    // Test 5: User not found - redirect to registration
    console.log('📝 Test 5: ORCID user not found - redirecting to registration');
    await logInfo('ORCID user not found - redirecting to registration', {
      ...generateTestMetadata('code=test456'),
      orcidId: '0000-0000-0000-NEW',
      name: 'New User',
      reason: 'user_not_found_needs_registration'
    });

    // Test 6: ORCID authorization error
    console.log('📝 Test 6: ORCID authorization error');
    await logError('ORCID authorization error', {
      ...generateTestMetadata('error=access_denied'),
      orcidError: 'access_denied',
      errorMessage: 'You declined the ORCID authorization request.',
      reason: 'orcid_authorization_error'
    });

    // Test 7: Account not activated error
    console.log('📝 Test 7: ORCID login failed - account not activated');
    await logError('ORCID login failed - account not activated', {
      ...generateTestMetadata('code=test789'),
      userId: 'test-inactive-user',
      email: 'inactive@example.com',
      orcidId: '0000-0000-0000-INACTIVE',
      reason: 'account_not_activated'
    });

    // Test 8: Token exchange failure
    console.log('📝 Test 8: ORCID token exchange failed');
    await logError('ORCID token exchange failed', {
      ...generateTestMetadata('code=invalid123'),
      status: 400,
      response: 'invalid_grant: Authorization code is invalid',
      reason: 'token_exchange_failed'
    });

    // Test 9: Unexpected error
    console.log('📝 Test 9: Unexpected ORCID callback error');
    await logError('Unexpected ORCID callback error', {
      ...generateTestMetadata('code=error123'),
      error: 'Database connection timeout',
      stack: 'Error: Database connection timeout\n    at ...',
      reason: 'unexpected_orcid_error'
    });

    console.log('\n✅ All ORCID logging test scenarios completed!');
    console.log('\n📊 Check your logs at:');
    console.log('   • Activity Logs: http://localhost:3000/logs');
    console.log('   • Log File: logs/activity.log');
    console.log('\n🔍 Look for these ORCID-specific log entries:');
    console.log('   • ORCID callback initiated');
    console.log('   • ORCID token exchange successful');
    console.log('   • ORCID user found - proceeding to login');
    console.log('   • ORCID login successful');
    console.log('   • ORCID user not found - redirecting to registration');
    console.log('   • Various ORCID error scenarios');

  } catch (error) {
    console.error('❌ Error testing ORCID logging:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  testOrcidLoggingScenarios().then(() => {
    console.log('\n🎯 ORCID Login Activity Logging Test Complete!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testOrcidLoggingScenarios };
