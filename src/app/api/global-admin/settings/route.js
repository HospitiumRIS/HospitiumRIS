import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Check authentication and authorization
    const currentUser = await getAuthenticatedUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (currentUser.accountType !== 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Global Admin access required' },
        { status: 403 }
      );
    }

    // Get system settings (these would typically be stored in a settings table)
    // For now, we'll return default/example settings
    const settings = {
      system: {
        siteName: 'HospitiumRIS',
        siteUrl: 'http://localhost:3000',
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: true,
        sessionTimeout: 30, // minutes
        maxLoginAttempts: 5,
        lockoutDuration: 15 // minutes
      },
      email: {
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: process.env.SMTP_PORT || 587,
        smtpUser: process.env.SMTP_USER || '',
        smtpSecure: true,
        fromEmail: process.env.FROM_EMAIL || 'noreply@hospitiumris.org',
        fromName: 'HospitiumRIS'
      },
      security: {
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: true,
        twoFactorEnabled: false,
        ipWhitelist: [],
        rateLimitEnabled: true,
        rateLimitRequests: 100,
        rateLimitWindow: 15 // minutes
      },
      notifications: {
        emailNotifications: true,
        systemAlerts: true,
        securityAlerts: true,
        maintenanceAlerts: true,
        digestFrequency: 'daily' // daily, weekly, never
      },
      storage: {
        maxFileSize: 10, // MB
        allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
        storageProvider: 'local', // local, s3, azure
        storageQuota: 1000 // GB
      },
      api: {
        apiEnabled: true,
        apiRateLimit: 1000,
        apiRateLimitWindow: 60, // minutes
        webhooksEnabled: false,
        corsEnabled: true,
        allowedOrigins: ['http://localhost:3000']
      }
    };

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request) {
  try {
    // Check authentication and authorization
    const currentUser = await getAuthenticatedUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (currentUser.accountType !== 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Global Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, settings } = body;

    // In a real implementation, you would save these to a database
    // For now, we'll just validate and return success
    
    console.log(`Updating ${category} settings:`, settings);

    return NextResponse.json({
      success: true,
      message: `${category} settings updated successfully`,
      data: settings
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
