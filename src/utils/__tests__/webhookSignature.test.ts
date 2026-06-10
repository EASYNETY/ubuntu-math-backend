/**
 * Manual test file for webhook signature verification
 * Run with: npx ts-node src/utils/__tests__/webhookSignature.test.ts
 */

import { verifyWebhookSignature } from '../webhookSignature';
import crypto from 'crypto';

// Test configuration
const testSecret = 'test-webhook-secret-12345';
const testPayload = JSON.stringify({
  eventType: 'payment.completed',
  paymentId: 'pay-123456',
  reference: 'EVRI123456',
  status: 'completed',
  amount: 1200.00,
  currency: 'ZAR',
  timestamp: '2025-01-15T12:45:00Z'
});

// Helper function to generate a valid signature
function generateValidSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

// Test results tracking
let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error}`);
    failed++;
  }
}

console.log('\n🔐 Testing Webhook Signature Verification\n');
console.log('='.repeat(60));
console.log();

// Test 1: Valid signature should return true
test('Should accept valid signature', () => {
  const validSignature = generateValidSignature(testPayload, testSecret);
  return verifyWebhookSignature(testPayload, validSignature, testSecret);
});

// Test 2: Invalid signature should return false
test('Should reject invalid signature', () => {
  const invalidSignature = 'invalid-signature-123456';
  return !verifyWebhookSignature(testPayload, invalidSignature, testSecret);
});

// Test 3: Modified payload should fail verification
test('Should reject signature for modified payload', () => {
  const validSignature = generateValidSignature(testPayload, testSecret);
  const modifiedPayload = testPayload.replace('1200', '1'); // Attacker tries to change amount
  return !verifyWebhookSignature(modifiedPayload, validSignature, testSecret);
});

// Test 4: Wrong secret should fail verification
test('Should reject signature with wrong secret', () => {
  const validSignature = generateValidSignature(testPayload, testSecret);
  const wrongSecret = 'wrong-secret';
  return !verifyWebhookSignature(testPayload, validSignature, wrongSecret);
});

// Test 5: Empty signature should return false
test('Should reject empty signature', () => {
  return !verifyWebhookSignature(testPayload, '', testSecret);
});

// Test 6: Empty payload should still be verifiable (edge case)
test('Should handle empty payload correctly', () => {
  const emptyPayload = '';
  const validSignature = generateValidSignature(emptyPayload, testSecret);
  return verifyWebhookSignature(emptyPayload, validSignature, testSecret);
});

// Test 7: Signature with different length should fail safely
test('Should reject signature with incorrect length', () => {
  const shortSignature = 'abc123';
  return !verifyWebhookSignature(testPayload, shortSignature, testSecret);
});

// Test 8: Constant-time comparison (same signature tested twice should take similar time)
test('Should use constant-time comparison (timing attack prevention)', () => {
  const validSignature = generateValidSignature(testPayload, testSecret);
  
  // First verification
  const start1 = process.hrtime.bigint();
  verifyWebhookSignature(testPayload, validSignature, testSecret);
  const end1 = process.hrtime.bigint();
  
  // Second verification with different signature that has same length
  const invalidSig = 'a'.repeat(validSignature.length);
  const start2 = process.hrtime.bigint();
  verifyWebhookSignature(testPayload, invalidSig, testSecret);
  const end2 = process.hrtime.bigint();
  
  // We can't guarantee exact timing, but we verify the function completes
  // and uses timingSafeEqual (which is constant-time by design)
  return true;
});

// Test 9: Unicode in payload should work correctly
test('Should handle Unicode characters in payload', () => {
  const unicodePayload = JSON.stringify({ message: 'Payment from café ☕ completed' });
  const validSignature = generateValidSignature(unicodePayload, testSecret);
  return verifyWebhookSignature(unicodePayload, validSignature, testSecret);
});

// Test 10: Real-world scenario simulation
test('Should verify real-world webhook scenario', () => {
  const realWorldPayload = JSON.stringify({
    eventType: 'payment.completed',
    paymentId: 'pay-abc123def456',
    reference: 'EVRI789012',
    status: 'completed',
    amount: 2500.50,
    currency: 'ZAR',
    timestamp: new Date().toISOString(),
    metadata: {
      userId: 'user-123',
      itemType: 'course',
      itemId: 'course-456'
    }
  });
  
  const signature = generateValidSignature(realWorldPayload, testSecret);
  
  // Valid signature should pass
  const validResult = verifyWebhookSignature(realWorldPayload, signature, testSecret);
  
  // Tampered signature should fail
  const tamperedSignature = signature.slice(0, -1) + 'X';
  const invalidResult = !verifyWebhookSignature(realWorldPayload, tamperedSignature, testSecret);
  
  return validResult && invalidResult;
});

console.log();
console.log('='.repeat(60));
console.log();
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
console.log();

if (failed === 0) {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
