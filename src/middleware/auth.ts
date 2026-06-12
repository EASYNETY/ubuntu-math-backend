import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'test'; // Use environment variable in production

interface JWTPayload {
  email: string;
  id: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware that verifies JWT token and attaches user to request
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: 'UNAUTHORIZED', 
        message: 'Authentication required' 
      });
      return;
    }

    // Check if token starts with 'Bearer '
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      res.status(401).json({ 
        error: 'UNAUTHORIZED', 
        message: 'Authentication required' 
      });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, SECRET) as JWTPayload;

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        error: 'UNAUTHORIZED', 
        message: 'Token expired' 
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        error: 'UNAUTHORIZED', 
        message: 'Invalid token' 
      });
      return;
    }

    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Authentication error' 
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * Useful for endpoints that work with or without authentication
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, SECRET) as JWTPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

/**
 * Middleware to check if authenticated user is an admin
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'UNAUTHORIZED', 
        message: 'Authentication required' 
      });
      return;
    }

    // Import User model to check role
    const User = (await import('../models/User')).default;
    
    // Use findOne instead of findById to ensure proper ID matching
    const user = await User.findOne({ _id: req.user.id });

    if (!user || user.role !== 'admin') {
      console.log(`Admin access denied for user ${req.user.id} (role: ${user?.role || 'not found'})`);
      res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: 'Admin access required' 
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Authorization error' 
    });
  }
};
