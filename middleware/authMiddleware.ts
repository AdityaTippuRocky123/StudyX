import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.warn('Warning: JWT_SECRET environment variable is missing. Authentication might fail or be insecure.');
  }

  try {
    const decoded: any = jwt.verify(token, jwtSecret || 'temp_jwt_fallback_secret_39fjd8s');
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({ error: 'Not authorized, user not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('JWT Verification Error:', error.message);
    res.status(401).json({ error: 'Not authorized, token invalid or expired' });
    return;
  }
};
