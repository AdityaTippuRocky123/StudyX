import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const generateToken = (id: string): string => {
  const jwtSecret = process.env.JWT_SECRET || 'temp_jwt_fallback_secret_39fjd8s';
  return jwt.sign({ id }, jwtSecret, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, avatar, bio } = req.body;

    // 1. Inputs Validation
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // 2. Ensure username and email are unique
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      res.status(409).json({ error: 'Email is already registered' });
      return;
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(409).json({ error: 'Username is already taken' });
      return;
    }

    // 3. Create user (password is automatically hashed via Mongoose pre-save hook)
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      avatar: avatar || '',
      bio: bio || '',
    });

    await user.save();

    // 4. Generate JWT
    const token = generateToken(String(user._id));

    // 5. Respond with user info (excluding password)
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userObj,
    });
  } catch (error: any) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: error.message || 'Server error occurred during signup' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    if (!email && !username) {
      res.status(400).json({ error: 'Email or username is required' });
      return;
    }

    // Find user by either email or username
    let user;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else if (username) {
      user = await User.findOne({ username });
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Compare passwords using Schema method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(String(user._id));

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userObj,
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ error: error.message || 'Server error occurred during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized, user not found' });
      return;
    }
    res.status(200).json({ user: req.user });
  } catch (error: any) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Server error retrieving current user profile' });
  }
};

// @desc    Log user out
// @route   POST /api/auth/logout
// @access  Public (stateless JWT, but clean exit)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: 'Successfully logged out' });
  } catch (error: any) {
    console.error('Logout Error:', error);
    res.status(500).json({ error: 'Server error occurred during logout' });
  }
};
