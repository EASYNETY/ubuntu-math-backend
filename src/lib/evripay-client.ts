import axios, { AxiosInstance } from 'axios';
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
    const response = await this.client.post('/api/v1/payments/intent', {
      clientId: process.env.EVRIPAY_CLIENT_ID,
      ...params
    });
    return response.data;
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    const response = await this.client.get(`/api/v1/payments/${paymentId}/status`);
    return response.data;
  }
}

export default new EvriPayClient();
