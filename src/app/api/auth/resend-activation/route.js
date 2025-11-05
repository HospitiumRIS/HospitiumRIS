import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendActivationEmail, generateActivationToken } from '@/lib/email';
import { validateEmail } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { 
          success: true, 
          message: 'If an account with this email exists and is not yet activated, a new activation email has been sent.' 
        },
        { status: 200 }
      );
    }

    // Check if user is already activated
    if (user.emailVerified) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'This account is already activated. You can login directly.',
          redirect: '/login'
        },
        { status: 400 }
      );
    }

    // Generate new activation token
    const activationToken = generateActivationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: activationToken,
        emailVerifyExpires: expiresAt,
      }
    });

    // Send activation email (mark as resend)
    const emailResult = await sendActivationEmail(user, activationToken, true);
    
    let emailSent = false;
    let emailError = null;

    if (emailResult.success) {
      emailSent = true;
      console.log('Activation email resent successfully to:', email);
    } else {
      emailError = emailResult.error;
      console.error('Failed to resend activation email:', emailError);
    }

    // Log resend attempt
    try {
      await prisma.registrationLog.create({
        data: {
          email: user.email,
          accountType: user.accountType,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          userAgent: request.headers.get('user-agent') || null,
          success: emailSent,
          errorMessage: emailError,
        }
      });
    } catch (logError) {
      console.error('Failed to log resend attempt:', logError);
    }

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'A new activation email has been sent to your email address. Please check your inbox and spam folder.',
        emailSent: true
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send activation email. Please try again later or contact support.',
        emailSent: false,
        emailError: emailError
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Resend activation error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}
