import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create a test account for development
let transporter: nodemailer.Transporter;

// This initializes a test email account for development purposes
export async function initializeEmailTransport() {
  // For production, you would use your actual SMTP settings
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  console.log('Email transport initialized');
  return testAccount;
}

// Generate a random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string, username: string): Promise<string> {
  if (!transporter) {
    await initializeEmailTransport();
  }
  
  const verificationLink = `http://localhost:5000/api/auth/verify?token=${token}`;
  
  const info = await transporter.sendMail({
    from: '"TLU Steel Cut Optimizer" <noreply@tlu.edu.vn>',
    to: email,
    subject: 'Please verify your email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #057A55;">Welcome to TLU Steel Cut Optimizer!</h2>
        <p>Hello ${username},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #057A55; color: #FCD34D; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">${verificationLink}</p>
        <p>If you did not request this email, please ignore it.</p>
        <p>Best regards,<br>TLU Steel Cut Optimizer Team</p>
      </div>
    `,
  });
  
  console.log('Verification email sent:', info.messageId);
  
  // For development, return the Ethereal URL to view the email
  return nodemailer.getTestMessageUrl(info) as string;
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string, username: string): Promise<string> {
  if (!transporter) {
    await initializeEmailTransport();
  }
  
  const resetLink = `http://localhost:5000/reset-password?token=${token}`;
  
  const info = await transporter.sendMail({
    from: '"TLU Steel Cut Optimizer" <noreply@tlu.edu.vn>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #057A55;">Password Reset Request</h2>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #057A55; color: #FCD34D; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">${resetLink}</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,<br>TLU Steel Cut Optimizer Team</p>
      </div>
    `,
  });
  
  console.log('Password reset email sent:', info.messageId);
  
  // For development, return the Ethereal URL to view the email
  return nodemailer.getTestMessageUrl(info) as string;
}