import { Router, Request, Response } from 'express';
import 'express-session';

// Extend Express session type to include our user ID
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}
import { storage } from './storage';
import { SignUpSchema, LoginSchema, ResetPasswordSchema, SetNewPasswordSchema } from '@shared/schema';
import { generateToken, sendVerificationEmail, sendPasswordResetEmail } from './email';
import crypto from 'crypto';
import { ZodError } from 'zod';

const router = Router();

// Helper function to hash a password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Register a new user
router.post('/signup', async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const data = SignUpSchema.parse(req.body);
    
    // Check if username already exists
    const existingUsername = await storage.getUserByUsername(data.username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(data.email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email address already registered' });
    }
    
    // Hash the password
    const hashedPassword = hashPassword(data.password);
    
    // Generate verification token
    const verificationToken = generateToken();
    
    // Create the user
    const user = await storage.createUser({
      username: data.username,
      email: data.email,
      password: hashedPassword,
    });
    
    // Set verification token
    await storage.setVerificationToken(user.id, verificationToken);
    
    // Send verification email
    const emailPreviewUrl = await sendVerificationEmail(
      user.email, 
      verificationToken,
      user.username
    );
    
    // Return success
    return res.status(201).json({ 
      message: 'User registered successfully. Please check your email for verification.',
      // In development, return the email preview URL for easy testing
      emailPreviewUrl: process.env.NODE_ENV !== 'production' ? emailPreviewUrl : undefined
    });
  } catch (error) {
    console.error('Error in signup:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input data', 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: 'Error registering user' });
  }
});

// Verify email
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid token' });
    }
    
    // Find user by verification token
    const user = await storage.getUserByVerificationToken(token);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Verify the user
    await storage.verifyUser(user.id);
    
    // Redirect to login page with success message
    return res.redirect('/?verified=true');
  } catch (error) {
    console.error('Error in email verification:', error);
    return res.status(500).json({ message: 'Error verifying email' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const data = LoginSchema.parse(req.body);
    
    // Find user by username
    const user = await storage.getUserByUsername(data.username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check if password is correct
    const hashedPassword = hashPassword(data.password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }
    
    // Set session
    if (req.session) {
      req.session.userId = user.id;
    }
    
    // Return user data (excluding password)
    const { password, ...userData } = user;
    return res.status(200).json({ 
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    console.error('Error in login:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input data', 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: 'Error logging in' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  } else {
    return res.status(200).json({ message: 'Already logged out' });
  }
});

// Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const data = ResetPasswordSchema.parse(req.body);
    
    // Find user by email
    const user = await storage.getUserByEmail(data.email);
    
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({ 
        message: 'If your email is registered, you will receive a password reset link' 
      });
    }
    
    // Generate reset token
    const resetToken = generateToken();
    
    // Set expiration (1 hour from now)
    const expires = new Date(Date.now() + 3600000).toISOString();
    
    // Save token to user
    await storage.setResetToken(user.id, resetToken, expires);
    
    // Send reset email
    const emailPreviewUrl = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.username
    );
    
    // Return success
    return res.status(200).json({ 
      message: 'If your email is registered, you will receive a password reset link',
      // In development, return the email preview URL for easy testing
      emailPreviewUrl: process.env.NODE_ENV !== 'production' ? emailPreviewUrl : undefined
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input data', 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: 'Error processing request' });
  }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const data = SetNewPasswordSchema.parse(req.body);
    
    // Find user by reset token
    const user = await storage.getUserByResetToken(data.token);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Hash the new password
    const hashedPassword = hashPassword(data.password);
    
    // Update user's password and clear reset token
    await storage.updateUser(user.id, {
      password: hashedPassword,
    });
    
    // Clear reset token
    await storage.setResetToken(user.id, '', '');
    
    // Return success
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in reset password:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input data', 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: 'Error resetting password' });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      // Clear invalid session
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Return user data (excluding password)
    const { password, ...userData } = user;
    return res.status(200).json({ user: userData });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ message: 'Error getting user data' });
  }
});

export default router;