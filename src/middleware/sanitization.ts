import { Request, Response, NextFunction } from 'express';
import { sanitizePaymentInput, sanitizePaginationParams } from '../utils/sanitization';

/**
 * Middleware to sanitize payment-related request inputs
 * Cleans body, query, and params to prevent XSS and injection attacks
 */
export const sanitizePaymentInputs = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize body inputs if present
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitized = sanitizePaymentInput(req.body);
      
      // If there are validation errors, return 400
      if (sanitized.errors.length > 0) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: sanitized.errors
        });
        return;
      }
      
      // Replace request body with sanitized values
      // Keep original keys but use sanitized values
      Object.keys(req.body).forEach(key => {
        if (key in sanitized && sanitized[key as keyof typeof sanitized] !== undefined) {
          req.body[key] = sanitized[key as keyof typeof sanitized];
        }
      });
    }

    // Sanitize query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      const queryInput = {
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
        itemType: req.query.itemType as string | undefined,
        userId: req.query.userId as string | undefined
      };
      
      const sanitized = sanitizePaymentInput(queryInput);
      
      // For query params, we're more lenient - just sanitize, don't block
      if (sanitized.status !== undefined) req.query.status = sanitized.status;
      if (sanitized.search !== undefined) req.query.search = sanitized.search;
      if (sanitized.itemType !== undefined) req.query.itemType = sanitized.itemType;
      if (sanitized.userId !== undefined) req.query.userId = sanitized.userId;
      
      // Sanitize pagination parameters
      const paginationResult = sanitizePaginationParams(req.query.page, req.query.limit);
      if (paginationResult.errors.length > 0) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid pagination parameters',
          details: paginationResult.errors
        });
        return;
      }
      req.query.page = String(paginationResult.page);
      req.query.limit = String(paginationResult.limit);
    }

    next();
  } catch (error) {
    console.error('Sanitization middleware error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error processing request'
    });
  }
};

/**
 * Middleware specifically for payment initiation endpoint
 * Ensures all required fields are present and sanitized
 */
export const sanitizePaymentInitiation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { itemType, itemId, amount } = req.body;
    
    // Check required fields
    if (!itemType || !itemId || amount === undefined) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: itemType, itemId, and amount are required'
      });
      return;
    }
    
    // Sanitize inputs
    const sanitized = sanitizePaymentInput({ itemType, itemId, amount });
    
    if (sanitized.errors.length > 0) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: sanitized.errors
      });
      return;
    }
    
    // Update request body with sanitized values
    req.body.itemType = sanitized.itemType;
    req.body.itemId = sanitized.itemId;
    req.body.amount = sanitized.amount;
    
    next();
  } catch (error) {
    console.error('Payment initiation sanitization error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error processing request'
    });
  }
};

/**
 * Middleware for admin actions requiring a reason
 * Ensures reason field is present and properly sanitized
 */
export const sanitizeAdminAction = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Reason is required for admin actions'
      });
      return;
    }
    
    const sanitized = sanitizePaymentInput({ reason });
    
    if (sanitized.errors.length > 0) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid reason provided',
        details: sanitized.errors
      });
      return;
    }
    
    req.body.reason = sanitized.reason;
    
    next();
  } catch (error) {
    console.error('Admin action sanitization error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error processing request'
    });
  }
};
