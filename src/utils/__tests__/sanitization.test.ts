import { sanitizePaymentInput, sanitizePaginationParams, stripDangerousContent } from '../sanitization';

describe('Payment Input Sanitization', () => {
  describe('sanitizePaymentInput', () => {
    test('should sanitize valid payment initiation data', () => {
      const input = {
        itemType: 'course',
        itemId: '507f1f77bcf86cd799439011',
        amount: 1200.50
      };

      const result = sanitizePaymentInput(input);

      expect(result.errors).toHaveLength(0);
      expect(result.itemType).toBe('course');
      expect(result.itemId).toBe('507f1f77bcf86cd799439011');
      expect(result.amount).toBe(1200.50);
    });

    test('should reject invalid item type', () => {
      const input = {
        itemType: 'invalid-type',
        itemId: '507f1f77bcf86cd799439011',
        amount: 1200.50
      };

      const result = sanitizePaymentInput(input);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid item type');
    });

    test('should escape HTML entities in strings', () => {
      const input = {
        itemType: 'course<script>alert("xss")</script>',
        itemId: '507f1f77bcf86cd799439011',
        amount: 1200.50
      };

      const result = sanitizePaymentInput(input);

      // Should escape the script tag
      expect(result.itemType).not.toContain('<script>');
      expect(result.itemType).toContain('&lt;');
    });

    test('should reject negative amounts', () => {
      const input = {
        itemType: 'course',
        itemId: '507f1f77bcf86cd799439011',
        amount: -100
      };

      const result = sanitizePaymentInput(input);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('non-negative');
    });

    test('should round amount to 2 decimal places', () => {
      const input = {
        itemType: 'course',
        itemId: '507f1f77bcf86cd799439011',
        amount: 1200.5555
      };

      const result = sanitizePaymentInput(input);

      expect(result.errors).toHaveLength(0);
      expect(result.amount).toBe(1200.56);
    });

    test('should validate ObjectId format for itemId', () => {
      const input = {
        itemType: 'course',
        itemId: 'invalid-object-id',
        amount: 1200.50
      };

      const result = sanitizePaymentInput(input);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid item ID format');
    });

    test('should allow special itemId values for subscriptions and products', () => {
      const specialIds = [
        'basic',
        'premium',
        'enterprise',
        'bundle-15-books',
        'cams-industrial-cookbook',
        'cams-master-index',
        'patent-dossier'
      ];

      specialIds.forEach(id => {
        const input = {
          itemType: 'subscription',
          itemId: id,
          amount: 100
        };

        const result = sanitizePaymentInput(input);

        expect(result.errors).toHaveLength(0);
        expect(result.itemId).toBe(id);
      });
    });

    test('should validate and sanitize reason field', () => {
      const input = {
        reason: 'Valid reason for admin action'
      };

      const result = sanitizePaymentInput(input);

      expect(result.errors).toHaveLength(0);
      expect(result.reason).toBe('Valid reason for admin action');
    });

    test('should reject reason that is too short', () => {
      const input = {
        reason: 'Bad'
      };

      const result = sanitizePaymentInput(input);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('at least 5 characters');
    });

    test('should reject reason that is too long', () => {
      const input = {
        reason: 'a'.repeat(501)
      };

      const result = sanitizePaymentInput(input);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('must not exceed 500 characters');
    });

    test('should validate status filter values', () => {
      const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded', 'all'];

      validStatuses.forEach(status => {
        const input = { status };
        const result = sanitizePaymentInput(input);

        expect(result.errors).toHaveLength(0);
        expect(result.status).toBe(status);
      });
    });

    test('should reject invalid status filter', () => {
      const input = {
        status: 'invalid-status'
      };

      const result = sanitizePaymentInput(input);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid status');
    });
  });

  describe('sanitizePaginationParams', () => {
    test('should return default values when no params provided', () => {
      const result = sanitizePaginationParams(undefined, undefined);

      expect(result.errors).toHaveLength(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    test('should sanitize valid pagination params', () => {
      const result = sanitizePaginationParams(2, 50);

      expect(result.errors).toHaveLength(0);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    test('should reject negative page number', () => {
      const result = sanitizePaginationParams(-1, 20);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('positive integer');
    });

    test('should reject limit exceeding 100', () => {
      const result = sanitizePaginationParams(1, 150);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('cannot exceed 100');
    });

    test('should floor decimal values', () => {
      const result = sanitizePaginationParams(2.7, 35.9);

      expect(result.errors).toHaveLength(0);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(35);
    });
  });

  describe('stripDangerousContent', () => {
    test('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = stripDangerousContent(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    test('should remove event handlers', () => {
      const input = '<div onclick="alert(\'xss\')">Click me</div>';
      const result = stripDangerousContent(input);

      expect(result).not.toContain('onclick');
    });

    test('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = stripDangerousContent(input);

      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    test('should escape remaining HTML entities', () => {
      const input = '<p>Safe paragraph</p>';
      const result = stripDangerousContent(input);

      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<p>');
    });

    test('should handle empty string', () => {
      const result = stripDangerousContent('');

      expect(result).toBe('');
    });
  });
});
