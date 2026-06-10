import validator from 'validator';
import mongoose from 'mongoose';

/**
 * Sanitize and validate payment request inputs
 * Prevents XSS and injection attacks by cleaning user-provided strings
 */
export interface PaymentInputData {
  itemType?: string;
  itemId?: string;
  amount?: number;
  userId?: string;
  reason?: string;
  search?: string;
  status?: string;
  reference?: string;
}

export interface SanitizedPaymentInput {
  itemType?: string;
  itemId?: string;
  amount?: number;
  userId?: string;
  reason?: string;
  search?: string;
  status?: string;
  reference?: string;
  errors: string[];
}

/**
 * Sanitizes all string inputs by escaping HTML entities
 * Validates numeric and ID formats
 */
export function sanitizePaymentInput(input: PaymentInputData): SanitizedPaymentInput {
  const errors: string[] = [];
  const sanitized: SanitizedPaymentInput = { errors };

  // Sanitize itemType
  if (input.itemType !== undefined) {
    const cleanItemType = validator.escape(String(input.itemType).trim());
    
    // Validate against allowed enum values
    const allowedItemTypes = ['course', 'book', 'subscription'];
    if (!allowedItemTypes.includes(cleanItemType)) {
      errors.push('Invalid item type. Must be: course, book, or subscription');
    } else {
      sanitized.itemType = cleanItemType;
    }
  }

  // Sanitize and validate itemId (should be valid MongoDB ObjectId or predefined string)
  if (input.itemId !== undefined) {
    const cleanItemId = validator.escape(String(input.itemId).trim());
    
    // Check if it's a valid ObjectId or allowed special value
    const allowedSpecialIds = [
      'basic', 'premium', 'enterprise',  // subscription plans
      'bundle-15-books',
      'cams-industrial-cookbook',
      'cams-master-index',
      'patent-dossier'
    ];
    
    if (!mongoose.Types.ObjectId.isValid(cleanItemId) && !allowedSpecialIds.includes(cleanItemId)) {
      errors.push('Invalid item ID format');
    } else {
      sanitized.itemId = cleanItemId;
    }
  }

  // Validate and sanitize amount
  if (input.amount !== undefined) {
    const amount = Number(input.amount);
    
    if (isNaN(amount)) {
      errors.push('Amount must be a valid number');
    } else if (amount < 0) {
      errors.push('Amount must be non-negative');
    } else {
      // Round to 2 decimal places to prevent precision issues
      sanitized.amount = Math.round(amount * 100) / 100;
    }
  }

  // Sanitize and validate userId (should be valid MongoDB ObjectId)
  if (input.userId !== undefined) {
    const cleanUserId = validator.escape(String(input.userId).trim());
    
    if (!mongoose.Types.ObjectId.isValid(cleanUserId)) {
      errors.push('Invalid user ID format');
    } else {
      sanitized.userId = cleanUserId;
    }
  }

  // Sanitize reason (for admin actions like rejection or refund)
  if (input.reason !== undefined) {
    const cleanReason = validator.escape(String(input.reason).trim());
    
    // Validate length (min 5 characters, max 500 characters)
    if (cleanReason.length < 5) {
      errors.push('Reason must be at least 5 characters long');
    } else if (cleanReason.length > 500) {
      errors.push('Reason must not exceed 500 characters');
    } else {
      sanitized.reason = cleanReason;
    }
  }

  // Sanitize search query
  if (input.search !== undefined) {
    const cleanSearch = validator.escape(String(input.search).trim());
    
    // Limit search query length
    if (cleanSearch.length > 100) {
      errors.push('Search query too long (max 100 characters)');
    } else {
      sanitized.search = cleanSearch;
    }
  }

  // Sanitize status filter
  if (input.status !== undefined) {
    const cleanStatus = validator.escape(String(input.status).trim());
    
    // Validate against allowed status values
    const allowedStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded', 'all'];
    if (!allowedStatuses.includes(cleanStatus)) {
      errors.push('Invalid status. Must be: pending, completed, failed, cancelled, refunded, or all');
    } else {
      sanitized.status = cleanStatus;
    }
  }

  // Sanitize reference number
  if (input.reference !== undefined) {
    const cleanReference = validator.escape(String(input.reference).trim());
    
    // Validate reference format (alphanumeric with hyphens)
    if (!validator.isAlphanumeric(cleanReference.replace(/-/g, ''))) {
      errors.push('Invalid reference format');
    } else if (cleanReference.length > 50) {
      errors.push('Reference number too long (max 50 characters)');
    } else {
      sanitized.reference = cleanReference;
    }
  }

  return sanitized;
}

/**
 * Validate pagination parameters
 */
export function sanitizePaginationParams(page?: any, limit?: any): { page: number; limit: number; errors: string[] } {
  const errors: string[] = [];
  let sanitizedPage = 1;
  let sanitizedLimit = 20;

  if (page !== undefined) {
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    } else {
      sanitizedPage = Math.floor(pageNum);
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer');
    } else if (limitNum > 100) {
      errors.push('Limit cannot exceed 100');
    } else {
      sanitizedLimit = Math.floor(limitNum);
    }
  }

  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
    errors
  };
}

/**
 * Strip any potential script tags or dangerous HTML from text
 */
export function stripDangerousContent(text: string): string {
  if (!text) return '';
  
  // Remove script tags and their content
  let cleaned = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  cleaned = cleaned.replace(/javascript:/gi, '');
  
  // Escape remaining HTML entities
  return validator.escape(cleaned);
}
