/**
 * Email Configuration Test Script
 * 
 * This script helps you test your SMTP configuration before running the application.
 * 
 * Usage:
 * 1. Make sure your .env file is configured with SMTP settings
 * 2. Run: node scripts/test-email.js your-test-email@example.com
 * 3. Check if you receive the test email
 */

const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

const testEmail = async (recipientEmail) => {
  if (!recipientEmail) {
    console.error('❌ Please provide a recipient email address');
    console.log('Usage: node scripts/test-email.js your-email@example.com');
    process.exit(1);
  }

  console.log('🔧 Testing SMTP Configuration...\n');
  
  // Display configuration (without sensitive data)
  console.log('Configuration:');
  console.log(`- SMTP Host: ${process.env.SMTP_HOST || 'NOT SET'}`);
  console.log(`- SMTP Port: ${process.env.SMTP_PORT || 'NOT SET'}`);
  console.log(`- SMTP Secure: ${process.env.SMTP_SECURE || 'NOT SET'}`);
  console.log(`- SMTP User: ${process.env.SMTP_USER || 'NOT SET'}`);
  console.log(`- SMTP Pass: ${process.env.SMTP_PASS ? '***CONFIGURED***' : 'NOT SET'}`);
  console.log(`- From Email: ${process.env.FROM_EMAIL || 'NOT SET'}`);
  console.log('');

  // Check required environment variables
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.log('Please check your .env file and make sure all SMTP variables are set.');
    process.exit(1);
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
      }
    });

    console.log('🔍 Verifying SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    console.log(`📧 Sending test email to: ${recipientEmail}`);
    
    // Send test email
    const result = await transporter.sendMail({
      from: process.env.FROM_EMAIL || `Hospitium RIS Test <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: '✅ Hospitium RIS - SMTP Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1976d2;">🎉 SMTP Configuration Test Successful!</h2>
          
          <p>Congratulations! Your SMTP configuration is working correctly.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>SMTP User:</strong> ${process.env.SMTP_USER}</li>
              <li><strong>From Email:</strong> ${process.env.FROM_EMAIL || process.env.SMTP_USER}</li>
            </ul>
          </div>
          
          <p>Your Hospitium RIS application is now ready to send activation emails!</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            This is a test email sent from your Hospitium RIS application.<br>
            Generated at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `
SMTP Configuration Test Successful!

Your SMTP configuration is working correctly.

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- SMTP User: ${process.env.SMTP_USER}
- From Email: ${process.env.FROM_EMAIL || process.env.SMTP_USER}

Your Hospitium RIS application is now ready to send activation emails!

Generated at: ${new Date().toLocaleString()}
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${result.messageId}`);
    console.log(`\n🎉 Your SMTP configuration is working correctly!`);
    console.log(`Please check ${recipientEmail} for the test email.`);
    
  } catch (error) {
    console.error('❌ SMTP Configuration Error:', error.message);
    console.log('\n🔧 Troubleshooting Tips:');
    
    if (error.message.includes('Authentication failed')) {
      console.log('- Check your SMTP_USER and SMTP_PASS credentials');
      console.log('- For Gmail, make sure you\'re using an App Password');
    } else if (error.message.includes('Connection timeout')) {
      console.log('- Check your SMTP_HOST and SMTP_PORT settings');
      console.log('- Verify your firewall/network allows SMTP connections');
    } else if (error.message.includes('Certificate')) {
      console.log('- Try setting SMTP_REJECT_UNAUTHORIZED=false for testing');
    }
    
    console.log('- Verify all SMTP settings in your .env file');
    console.log('- Check your email provider\'s SMTP documentation');
    
    process.exit(1);
  }
};

// Get recipient email from command line argument
const recipientEmail = process.argv[2];
testEmail(recipientEmail);
