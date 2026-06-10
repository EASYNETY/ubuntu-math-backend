# Input Sanitization Middleware Documentation

## Overview

This middleware implements comprehensive input sanitization for payment endpoints to prevent XSS (Cross-Site Scripting) and injection attacks. All user-provided inputs are cleaned and validated before processing.

## Implementation

### Components

1. **Sanitization Utility** (`src/utils/sanitization.ts`)
   - Core sanitization functions
   - Validation logic
   - Type definitions

2. **Sanitization Middleware** (`src/middleware/sanitization.ts`)
   - Express middleware functions
   - Request/response handling
   - Error responses

3. **Applied Routes** (`src/routes/api.ts`)
   - Payment initiation endpoint
   - Payment status/history endpoints
   - Admin payment management endpoints

## Sanitization Features

### 1. HTML Entity Escaping

All string inputs are escaped using `validator.escape()` to prevent XSS attacks:
- `<` becomes `&lt;`
- `>` becomes `&gt;`
- `&` becomes `&amp;`
- `"` becomes `&quot;`
- `'` becomes `&#x27;`

### 2. Input Validation

#### Item Type
- **Allowed values:** `course`, `book`, `subscription`
- **Validation:** Enum check
- **Error:** "Invalid item type. Must be: course, book, or subscription"

#### Item ID
- **Allowed formats:** 
  - Valid MongoDB ObjectId (24 hex characters)
  - Special values: `basic`, `premium`, `enterprise`, `bundle-15-books`, `cams-industrial-cookbook`, `cams-master-index`, `patent-dossier`
- **Validation:** ObjectId format or whitelist check
- **Error:** "Invalid item ID format"

#### Amount
- **Validation:** 
  - Must be a valid number
  - Must be non-negative
  - Rounded to 2 decimal places
- **Error:** "Amount must be a valid number" or "Amount must be non-negative"

#### User ID
- **Allowed format:** Valid MongoDB ObjectId
- **Validation:** ObjectId format check
- **Error:** "Invalid user ID format"

#### Reason (for admin actions)
- **Validation:**
  - Minimum length: 5 characters
  - Maximum length: 500 characters
  - HTML escaped
- **Error:** "Reason must be at least 5 characters long" or "Reason must not exceed 500 characters"

#### Search Query
- **Validation:**
  - Maximum length: 100 characters
  - HTML escaped
- **Error:** "Search query too long (max 100 characters)"

#### Status Filter
- **Allowed values:** `pending`, `completed`, `failed`, `cancelled`, `refunded`, `all`
- **Validation:** Enum check
- **Error:** "Invalid status"

#### Pagination Parameters
- **Page:**
  - Must be a positive integer
  - Defaults to 1
- **Limit:**
  - Must be a positive integer
  - Maximum value: 100
  - Defaults to 20
- **Error:** "Page must be a positive integer" or "Limit cannot exceed 100"

### 3. Dangerous Content Stripping

The `stripDangerousContent()` function removes:
- `<script>` tags and their content
- Event handlers (`onclick`, `onerror`, etc.)
- `javascript:` protocol
- All remaining HTML is escaped

## Middleware Functions

### 1. sanitizePaymentInputs

General-purpose middleware for all payment endpoints.

**Usage:**
```typescript
router.get('/payments/history', authenticateJWT, sanitizePaymentInputs, getPaymentHistory);
```

**Behavior:**
- Sanitizes `req.body` and `req.query`
- Returns 400 error if validation fails
- Passes sanitized data to next middleware

### 2. sanitizePaymentInitiation

Specific middleware for payment initiation endpoint.

**Usage:**
```typescript
router.post('/payments/initiate', authenticateJWT, sanitizePaymentInitiation, initiatePayment);
```

**Behavior:**
- Ensures required fields are present: `itemType`, `itemId`, `amount`
- Validates and sanitizes all three fields
- Returns 400 error if any field is missing or invalid

### 3. sanitizeAdminAction

Middleware for admin actions requiring a reason.

**Usage:**
```typescript
router.post('/admin/payments/:paymentId/reject', authenticateJWT, requireAdmin, sanitizeAdminAction, rejectPayment);
```

**Behavior:**
- Ensures `reason` field is present
- Validates reason length (5-500 characters)
- Escapes HTML entities in reason text

## Applied Routes

### Student Endpoints

```typescript
// Payment initiation
POST /api/payments/initiate
  - Middleware: authenticateJWT, sanitizePaymentInitiation
  - Sanitized: itemType, itemId, amount

// Payment status
GET /api/payments/:paymentId/status
  - Middleware: authenticateJWT, sanitizePaymentInputs
  - Sanitized: paymentId (param), userId (query)

// Payment history
GET /api/payments/history
  - Middleware: authenticateJWT, sanitizePaymentInputs
  - Sanitized: userId, status, page, limit (all query params)

// Cancel payment
POST /api/payments/:paymentId/cancel
  - Middleware: authenticateJWT, sanitizePaymentInputs
  - Sanitized: paymentId (param), userId (body)
```

### Admin Endpoints

```typescript
// Get all payments
GET /api/admin/payments
  - Middleware: authenticateJWT, requireAdmin, sanitizePaymentInputs
  - Sanitized: status, search, page, limit (all query params)

// Approve payment
POST /api/admin/payments/:paymentId/approve
  - Middleware: authenticateJWT, requireAdmin
  - Sanitized: paymentId (param)

// Reject payment
POST /api/admin/payments/:paymentId/reject
  - Middleware: authenticateJWT, requireAdmin, sanitizeAdminAction
  - Sanitized: paymentId (param), reason (body)
```

### Webhook Endpoint

```typescript
// Webhook (no sanitization middleware - uses signature verification)
POST /api/payments/webhook
  - No sanitization middleware
  - Uses cryptographic signature verification instead
  - Webhook payloads are validated via HMAC signatures
```

## Error Responses

### Validation Error (400)

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": [
    "Invalid item type. Must be: course, book, or subscription",
    "Amount must be non-negative"
  ]
}
```

### Internal Error (500)

```json
{
  "error": "INTERNAL_ERROR",
  "message": "Error processing request"
}
```

## Testing

Comprehensive unit tests are provided in `src/utils/__tests__/sanitization.test.ts`.

### Test Coverage

- ✅ Valid input sanitization
- ✅ Invalid item type rejection
- ✅ HTML entity escaping
- ✅ Negative amount rejection
- ✅ Decimal rounding to 2 places
- ✅ ObjectId format validation
- ✅ Special ID values (subscription plans, products)
- ✅ Reason field validation (length)
- ✅ Status filter validation
- ✅ Pagination parameter validation
- ✅ Dangerous content stripping (scripts, event handlers)

## Security Benefits

### 1. XSS Prevention

By escaping HTML entities, the sanitization prevents malicious scripts from being injected:

**Attack Example:**
```javascript
// Malicious input
itemType: '<script>alert("XSS")</script>'

// Sanitized output
itemType: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
```

### 2. Injection Prevention

By validating input formats (ObjectIds, enums), the sanitization prevents injection attacks:

**Attack Example:**
```javascript
// Malicious input
itemId: "'; DROP TABLE payments; --"

// Result
Error: "Invalid item ID format"
```

### 3. Input Validation

By enforcing strict validation rules, the sanitization prevents invalid or malicious data:

**Attack Example:**
```javascript
// Malicious input
amount: -9999999

// Result
Error: "Amount must be non-negative"
```

## Dependencies

- **validator** (v13+): String validation and sanitization library
- **mongoose**: ObjectId validation

## Requirements Satisfied

This implementation satisfies **Requirement 9.5**:

> THE Payment_System SHALL sanitize all user inputs to prevent injection attacks before processing payment requests

All payment-related inputs are now sanitized through middleware before reaching controller logic, ensuring comprehensive protection against XSS and injection attacks.

## Maintenance

### Adding New Sanitization Rules

1. Add validation logic to `src/utils/sanitization.ts`
2. Add test cases to `src/utils/__tests__/sanitization.test.ts`
3. Apply middleware to relevant routes in `src/routes/api.ts`

### Updating Allowed Values

To update allowed item types, statuses, or special IDs:

1. Modify the whitelist arrays in `sanitizePaymentInput()` function
2. Update corresponding test cases
3. Update this documentation

## Notes

- Sanitization is applied BEFORE controller logic
- Controllers still have secondary validation as defense-in-depth
- Webhook endpoint uses signature verification instead of sanitization
- All sanitized values maintain their original types (string, number, etc.)
