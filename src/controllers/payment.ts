import { Request, Response } from 'express';
import https from 'https';
import Subscription from '../models/Subscription';
const PLANS: Record<string, { name: string; monthlyUSD: number; annualUSD: number }> = {
  basic: { name:'Basic', monthlyUSD:8, annualUSD:80 },
  professional: { name:'Professional', monthlyUSD:19, annualUSD:190 },
  institutional: { name:'Institutional', monthlyUSD:55, annualUSD:550 },
};
function getPrice(tier: string, billing: string) { const p = PLANS[tier]; if (!p) return null; return billing === 'annual' ? p.annualUSD : p.monthlyUSD; }
async function activateSubscription(userId: string, tier: string, billing: string, gateway: string) {
  const price = getPrice(tier, billing)!;
  await Subscription.updateMany({ userId }, { status: 'cancelled' });
  const start = new Date(); const end = new Date(start);
  if (billing === 'annual') end.setFullYear(end.getFullYear() + 1); else end.setMonth(end.getMonth() + 1);
  return Subscription.create({ userId, tier, billingCycle: billing === 'annual' ? 'annual' : 'monthly', priceUSD: price, status: 'active', startDate: start, endDate: end, paymentGateway: gateway });
}
export const createStripeSession = async (_req: Request, res: Response) => { res.status(503).json({ message: 'Stripe not configured' }); };
export const verifyStripeSession = async (_req: Request, res: Response) => { res.status(503).json({ message: 'Stripe not configured' }); };
export const stripeWebhook = async (_req: Request, res: Response) => { res.json({ received: true }); };
export const initPaystack = async (req: Request, res: Response) => {
  try {
    const { userId, tier, billing, email } = req.body;
    const price = getPrice(tier, billing);
    if (!price) return res.status(400).json({ message: 'Invalid plan' });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const params = JSON.stringify({ email, amount: price * 100, currency: 'USD', metadata: { userId, tier, billing }, callback_url: clientUrl + '/payment/success?gateway=paystack' });
    const options = { hostname: 'api.paystack.co', port: 443, path: '/transaction/initialize', method: 'POST', headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY, 'Content-Type': 'application/json' } };
    const paystackReq = https.request(options as any, (paystackRes: any) => {
      let data = ''; paystackRes.on('data', (chunk: any) => data += chunk);
      paystackRes.on('end', () => { const parsed = JSON.parse(data); if (!parsed.status) return res.status(400).json({ message: parsed.message }); res.json({ url: parsed.data.authorization_url, reference: parsed.data.reference }); });
    });
    paystackReq.on('error', (e: any) => res.status(500).json({ message: e.message }));
    paystackReq.write(params); paystackReq.end();
  } catch (err: any) { res.status(500).json({ message: 'Paystack init failed', error: err.message }); }
};
export const verifyPaystack = async (req: Request, res: Response) => {
  try {
    const { reference, userId, tier, billing } = req.body;
    const options = { hostname: 'api.paystack.co', port: 443, path: '/transaction/verify/' + reference, method: 'GET', headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY } };
    https.get(options as any, (paystackRes: any) => {
      let data = ''; paystackRes.on('data', (chunk: any) => data += chunk);
      paystackRes.on('end', async () => {
        const parsed = JSON.parse(data);
        if (!parsed.status || parsed.data.status !== 'success') return res.status(402).json({ message: 'Payment not successful' });
        const meta = parsed.data.metadata || {};
        const sub = await activateSubscription(userId || meta.userId, tier || meta.tier, billing || meta.billing, 'paystack');
        res.json(sub);
      });
    });
  } catch (err: any) { res.status(500).json({ message: 'Paystack verify failed', error: err.message }); }
};
export const initFlutterwave = async (_req: Request, res: Response) => { res.status(503).json({ message: 'Flutterwave not configured' }); };
export const verifyFlutterwave = async (_req: Request, res: Response) => { res.status(503).json({ message: 'Flutterwave not configured' }); };
