# Payment-to-Content-Delivery Troubleshooting Guide

## Problem: User purchased content but cannot see it in their library

### Quick Fix Steps

1. **Check Payment Status in Database**
   ```bash
   node debug-payment.js
   ```
   This will show recent pending and bundle payments.

2. **Manually Approve Pending Payment**
   ```bash
   node approve-payment-manual.js <PAYMENT_ID or REFERENCE>
   ```
   Example:
   ```bash
   node approve-payment-manual.js PAY-abc123-xyz
   ```
   Or use the payment reference:
   ```bash
   node approve-payment-manual.js UBU-1234567890-ABC123
   ```

3. **Verify User Can See Content**
   - User should log out and log back in (JWT token refresh)
   - Navigate to "My Library" page at `/my-library`
   - Check "Books" page at `/books` - purchased books should show "Owned" badge

### Common Issues and Solutions

#### Issue 1: Payment stuck in "pending" status
**Cause**: EvriPay webhook integration is not active, so payments require manual approval.

**Solution**: 
- Admin approves via `/admin/payments` page (production)
- Or run manual approval script: `node approve-payment-manual.js <PAYMENT_ID>`

#### Issue 2: Bundle purchase showing error "Cast to ObjectId failed for value 'bundle-15-books'"
**Cause**: Code was trying to add the string "bundle-15-books" to purchasedBooks array which expects ObjectIds.

**Solution**: Fixed in latest code - bundle purchases now:
1. Fetch all books from database
2. Extract their ObjectIds
3. Add all book ObjectIds to user's purchasedBooks array
4. Create BookPurchase record with `bundlePurchase: true`

#### Issue 3: User sees "Your library is empty" after payment
**Cause**: Multiple possible causes:
1. Payment not approved yet (status still "pending")
2. Frontend not calling correct API endpoints
3. User JWT token expired
4. Backend enrollment process failed

**Solution**:
1. Check payment status: `node debug-payment.js`
2. If pending, approve it: `node approve-payment-manual.js <PAYMENT_ID>`
3. Check server logs for enrollment errors
4. Verify API endpoints are being called:
   - `/api/enrollments/user/:userId` (for courses)
   - `/api/auth/me/:userId` (for books - must populate purchasedBooks)
   - `/api/marketplace/library/:userId` (for marketplace products)

#### Issue 4: JWT token expired (profile page redirects to login)
**Cause**: JWT tokens were set to expire after 1 hour.

**Solution**: Fixed - tokens now expire after 7 days.
- Users need to log out and log back in to get new token
- Or wait for auto-refresh (if implemented in frontend)

#### Issue 5: Books not showing on Books page despite being in library
**Cause**: Frontend checking multiple sources for ownership that aren't synced.

**Solution**: Fixed - backend now writes to BOTH:
- `User.purchasedBooks` array (for direct lookup)
- `BookPurchase` collection (for detailed purchase history)

Frontend now checks BOTH sources for ownership.

### Data Flow Diagram

```
Payment Initiated (status: pending)
         ↓
Admin Approves Payment OR Webhook Triggered
         ↓
processEnrollment() called
         ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
Course Purchase                 Book Purchase
    ↓                               ↓
Create Enrollment           ┌───────┴───────┐
    ↓                       ↓               ↓
Set enrollmentGranted   Bundle          Individual
                            ↓               ↓
                    Fetch all books   Add book ObjectId
                            ↓               to User.purchasedBooks
                    Add all ObjectIds       ↓
                    to User.purchasedBooks  Create BookPurchase
                            ↓               record
                    Create BookPurchase
                    with bundlePurchase=true
                            ↓
                    Set enrollmentGranted
```

### Verification Checklist

After payment approval, verify:

- [ ] Payment status = "completed"
- [ ] Payment.enrollmentGranted = true
- [ ] Payment.enrolledAt is set
- [ ] For courses: Enrollment document exists
- [ ] For books: User.purchasedBooks contains book ObjectId(s)
- [ ] For books: BookPurchase record exists
- [ ] For bundles: User.purchasedBooks contains all 15 book ObjectIds
- [ ] Frontend Library page shows the content
- [ ] Frontend Books page shows "Owned" badge
- [ ] User can download/access the content

### Database Queries for Manual Verification

**Check specific payment:**
```javascript
db.payments.findOne({ paymentId: "PAY-..." })
```

**Check user's purchased books:**
```javascript
db.users.findOne({ _id: ObjectId("...") }, { purchasedBooks: 1, email: 1, name: 1 })
```

**Check book purchases for user:**
```javascript
db.bookpurchases.find({ userId: ObjectId("...") })
```

**Check enrollments for user:**
```javascript
db.enrollments.find({ userId: ObjectId("...") })
```

### API Endpoint Testing

**Test getMe endpoint (returns populated books):**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  https://ubuntu-math-backend.onrender.com/api/auth/me/<USER_ID>
```

**Test checkPurchase endpoint (bundle check):**
```bash
curl "https://ubuntu-math-backend.onrender.com/api/books/check-purchase?userId=<USER_ID>&bookId=null"
```

**Test checkPurchase endpoint (individual book):**
```bash
curl "https://ubuntu-math-backend.onrender.com/api/books/check-purchase?userId=<USER_ID>&bookId=<BOOK_ID>"
```

### Production Deployment Checklist

Before deploying to production:

- [ ] Backend code compiled without errors
- [ ] TypeScript build successful
- [ ] Environment variables configured (.env)
- [ ] Database connection tested
- [ ] JWT_SECRET configured
- [ ] Payment approval endpoint tested
- [ ] Manual approval script tested
- [ ] Frontend API_URL points to correct backend
- [ ] Frontend deployed and accessible
- [ ] Test full payment flow end-to-end

### Support Contact

For persistent issues:
- Check server logs: `tail -f logs/server.log`
- Check database directly using MongoDB Compass
- Contact: info@maritimestudies.co.za
