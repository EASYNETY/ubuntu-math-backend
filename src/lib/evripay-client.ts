import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';

interface PaymentIntentParams {
  amount: number;
  currency: string;
  reference: string;
  metadata: {
    userId: string;
    itemType: string;
    itemId: string;
  };
}

interface PaymentIntentResponse {
  paymentId: string;
  reference: string;
  status: string;
  accountDetails: {
    accountNumber: string;
    accountHolder: string;
    bank: string;
  };
  amount: number;
  currency: string;
}

interface PaymentStatusResponse {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  paidAt?: string;
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffMultiplier: 2     // Exponential backoff
};

/**
 * Determines if an error is retryable based on error type and status code
 * Retries on network errors and 5xx server errors
 */
function isRetryableError(error: any): boolean {
  // Network errors (connection refused, timeout, etc.)
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET') {
    return true;
  }
  
  // 5xx server errors
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }
  
  return false;
}

/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes an API call with exponential backoff retry logic
 * @param apiCall Function that returns a Promise to execute
 * @param retries Current retry attempt (default 0)
 * @returns Promise with the result of the API call
 */
async function callWithRetry<T>(
  apiCall: () => Promise<T>,
  retries: number = 0
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    // If we've exhausted retries or error is not retryable, throw immediately
    if (retries >= RETRY_CONFIG.maxRetries || !isRetryableError(error)) {
      throw error;
    }
    
    // Calculate exponential backoff delay: initialDelay * (backoffMultiplier ^ retries)
    // Capped at maxDelay
    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retries),
      RETRY_CONFIG.maxDelay
    );
    
    // Log retry attempt
    console.warn(`API call failed, retrying in ${delay}ms (attempt ${retries + 1}/${RETRY_CONFIG.maxRetries})`, {
      error: error instanceof Error ? error.message : String(error),
      retryCount: retries + 1
    });
    
    // Wait for the calculated delay
    await sleep(delay);
    
    // Retry the API call with incremented retry count
    return callWithRetry(apiCall, retries + 1);
  }
}

class EvriPayClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EVRIPAY_API_URL || 'https://evripay.onrender.com',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${process.env.EVRIPAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      })
    });
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResponse> {
    return callWithRetry(async () => {
      const response = await this.client.post('/api/v1/payments/intent', {
        clientId: process.env.EVRIPAY_CLIENT_ID,
        ...params
      });
      return response.data;
    });
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    return callWithRetry(async () => {
      const response = await this.client.get(`/api/v1/payments/${paymentId}/status`);
      return response.data;
    });
  }
}

export default new EvriPayClient();
