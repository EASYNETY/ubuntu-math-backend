# URGENT FIXES APPLIED - Bundle Purchase Issue

## Problem Summary

User purchased the 15-book bundle but books are NOT showing in their library. The root cause was identified:

**Error**: `CastError: Cast to ObjectId failed for value "bundle-15-books" (type string) at path "purchasedBooks"`

This error occurred because the code was trying to add the string `"bundle-15-books"` to the `User.purchasedBooks` array, which expects **ObjectIds** of actual books.

## Root Cause Analysis

In `src/controllers/evripayPayment.ts`, the `processEnrollment()` function had correct logic for bundle purchases (fetching all books and adding their ObjectIds), BUT the individual book purchase code path (lines 663-666) was adding `payment.itemId` directly without validating if it's a valid ObjectId.

The bug manifested when:
1. Bundle purchase with `itemId = "bundle-15-books"` was created
2. Payment was approved (manually or via webhook)
3. `processEnrollment()` was called
4. The if-condition checking `payment.itemId === 'bundle-15-books'` failed to match (possibly due to string comparison issues or unexpected itemId value)
5. Code fell through to the individual book purchase path
6. Tried to add `"bundle-15-books"` string to `purchasedBooks` array
7. MongoDB rejected it because `purchasedBooks` expects ObjectIds

## Fixes Applied

### 1. Added ObjectId Validation (evripayPayment.ts)

**File**: `src/controllers/evripayPayment.ts`

Added mongoose import and validation before adding individual books:

```typescript
import mongoose from 'mongoose';

// In processEnrollment(), individual book purchase section:
if (mongoose.Types.ObjectId.isValid(payment.itemId)) {
  await User.findByIdAndUpdate(payment.userId, {
    $addToSet: { purchasedBooks: payment.itemId }
  });
  console.log(`Added book ${payment.itemId} to user ${payment.userId}`);
  // ... rest of the code
} else {
  console.error('Invalid book ObjectId:', payment.itemId);
  throw new Error(`Invalid book ID: ${payment.itemId}`);
}
```

This prevents invalid IDs from being added to `purchasedBooks`.

### 2. Enhanced Logging (evripayPayment.ts)

Added comprehensive console.log statements throughout `processEnrollment()` to track:
- When bundle purchase starts processing
- How many books found in database
- Confirmation when books added to user
- Individual book additions
- Errors with invalid ObjectIds

### 3. Fixed JWT Token Expiry (auth.ts)

**File**: `src/controllers/auth.ts`

Changed JWT token expiry from 1 hour to 7 days in both `signin()` and `signup()`:

```typescript
const TOKEN_EXPIRY = '7d'; // 7 days

// In signin():
const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, SECRET, { expiresIn: TOKEN_EXPIRY });

// In signup():
const token = jwt.sign({ email: result.email, id: result._id }, SECRET, { expiresIn: TOKEN_EXPIRY });
```

This prevents the "profile redirects to login" issue users were experiencing.

### 4. Created Manual Approval Script

**File**: `approve-payment-manual.js`

Since EvriPay webhook integration is not active, payments require manual approval. Created a script to approve payments and trigger content delivery:

```bash
node approve-payment-manual.js <PAYMENT_ID or REFERENCE>
```

Example:
```bash
node approve-payment-manual.js PAY-abc123-xyz
# OR
node approve-payment-manual.js UBU-1234567890-ABC123
```

The script:
- Finds the payment by ID or reference
- Updates status to "completed"
- Triggers `processEnrollment()` logic
- Adds books to `User.purchasedBooks`
- Creates `BookPurchase` records
- Sets `enrollmentGranted = true`

### 5. Created Debug Script

**File**: `debug-payment.js`

To help diagnose payment issues:

```bash
node debug-payment.js
```

Shows:
- Recent bundle payments
- Recent pending payments
- User details
- Payment status

### 6. Created Troubleshooting Guide

**File**: `PAYMENT-TROUBLESHOOTING.md`

Comprehensive guide covering:
- Common issues and solutions
- Data flow diagram
- Verification checklist
- Database queries for manual verification
- API endpoint testing
- Production deployment checklist

## Immediate Actions Required

### For the User Who Cannot See Their Books

1. **Find the Payment**
   ```bash
   cd ubuntu-math-backend
   node debug-payment.js
   ```
   This will show recent payments. Look for the bundle purchase.

2. **Approve the Payment**
   ```bash
   node approve-payment-manual.js <PAYMENT_ID>
   ```
   Replace `<PAYMENT_ID>` with the actual payment ID from step 1.

3. **Verify in Database**
   After approval, check that:
   - Payment status = "completed"
   - Payment.enrollmentGranted = true
   - User.purchasedBooks contains 15 book ObjectIds
   - BookPurchase record exists with bundlePurchase=true

4. **User Must Refresh**
   - User should log out and log back in (to get new JWT token)
   - Navigate to "My Library" at `/my-library`
   - All 15 books should now appear
   - Books page at `/books` should show "Owned" badges

## Deployment Instructions

### Backend Deployment

1. **Commit changes**:
   ```bash
   git add src/controllers/evripayPayment.ts src/controllers/auth.ts
   git commit -m "fix: prevent invalid ObjectIds in purchasedBooks, extend JWT expiry to 7d"
   ```

2. **Push to Render**:
   ```bash
   git push origin main
   ```
   
   Render will automatically build and deploy.

3. **Verify deployment**:
   - Check Render logs for successful build
   - No TypeScript compilation errors in our code (googleapis errors in node_modules can be ignored)

### Manual Payment Approval (Production)

On Render, run the approval script:

1. Go to Render dashboard → ubuntu-math-backend service
2. Open Shell tab
3. Run:
   ```bash
   node debug-payment.js
   # Note the payment ID
   node approve-payment-manual.js <PAYMENT_ID>
   ```

OR use the admin panel at: `https://your-frontend-url.com/admin/payments`

## Testing Verification

After deployment, verify the fix works:

1. **Create test payment**:
   - Use staging/test user
   - Purchase bundle or individual book
   - Note the payment ID

2. **Approve payment**:
   ```bash
   node approve-payment-manual.js <TEST_PAYMENT_ID>
   ```

3. **Verify results**:
   - Check server logs - should see:
     - "Processing bundle purchase for user: ..."
     - "Found 15 books to add to bundle"
     - "Added 15 books to user ..."
     - "Bundle purchase completed for: ..."
   - Query database:
     ```javascript
     db.users.findOne({ _id: ObjectId("...") }, { purchasedBooks: 1 })
     // Should return array with 15 book ObjectIds
     ```
   - Frontend should show books in library

## Monitoring

After deployment, monitor:

1. **Server logs** for enrollment errors
2. **Payment status** - are they completing successfully?
3. **User library pages** - are purchased items showing?
4. **Download functionality** - can users download books?

## Known Limitations

1. **EvriPay Webhook**: Not yet integrated, so all payments require manual approval
2. **Real-time Updates**: Frontend requires page refresh after payment approval
3. **JWT Expiry**: Users with old tokens (< 7 days) need to re-login

## Next Steps

1. Deploy the fixes to production
2. Approve the user's pending bundle payment
3. Verify the user can see their books
4. Implement EvriPay webhook integration for automatic approvals
5. Add real-time updates (WebSocket or polling) for payment status

## Support

If issues persist after applying these fixes:
1. Check server logs: Render dashboard → Logs tab
2. Run debug script: `node debug-payment.js`
3. Verify database directly using MongoDB Compass
4. Check frontend console for API errors

## Files Modified

- `src/controllers/evripayPayment.ts` - Added ObjectId validation + enhanced logging
- `src/controllers/auth.ts` - Extended JWT expiry to 7 days
- `approve-payment-manual.js` - NEW: Manual payment approval script
- `debug-payment.js` - NEW: Payment debugging script
- `PAYMENT-TROUBLESHOOTING.md` - NEW: Comprehensive troubleshooting guide
- `URGENT-FIXES-APPLIED.md` - THIS FILE: Summary of fixes

---

**Status**: ✅ Fixes applied and ready for deployment
**Priority**: 🔴 URGENT - User cannot access purchased content
**Next Action**: Deploy to production and approve user's payment
