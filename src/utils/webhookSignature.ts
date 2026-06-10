import crypto from 'crypto';

/**
 * Verify webhook signature from EvriPay using HMAC SHA256
 * 
 * This function implements constant-time comparison to prevent timing attacks
 * when validating webhook signatures from the EvriPay payment gateway.
 * 
 * @param payload - The raw webhook payload as a string (typically stringified JSON)
 * @param signature - The signature from the X-EvriPay-Signature header
 * @param secret - The webhook secret from EVRIPAY_WEBHOOK_SECRET environment variable
 * @returns true if the signature is valid, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = verifyWebhookSignature(
 *   JSON.stringify(req.body),
 *   req.headers['x-evripay-signature'],
 *   process.env.EVRIPAY_WEBHOOK_SECRET!
 * );
 * 
 * if (!isValid) {
 *   return res.status(401).json({ message: 'Invalid signature' });
 * }
 * ```
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Compute HMAC SHA256 hash of the payload using the webhook secret
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');

  // Convert both signatures to buffers for constant-time comparison
  const computedBuffer = Buffer.from(computedSignature, 'hex');
  const providedBuffer = Buffer.from(signature, 'hex');

  // Ensure both buffers are the same length before comparing
  // If lengths differ, the signatures don't match
  if (computedBuffer.length !== providedBuffer.length) {
    return false;
  }

  // Use crypto.timingSafeEqual for constant-time comparison
  // This prevents timing attacks where an attacker could determine
  // the correct signature by measuring comparison time
  try {
    return crypto.timingSafeEqual(computedBuffer, providedBuffer);
  } catch (error) {
    // timingSafeEqual throws if buffers have different lengths
    // (though we already checked this above)
    return false;
  }
}
