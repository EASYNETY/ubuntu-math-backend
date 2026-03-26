import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
const PLANS = [
  { id:'basic', name:'Basic', monthlyPrice:8, yearlyPrice:80 },
  { id:'professional', name:'Professional', monthlyPrice:19, yearlyPrice:190 },
  { id:'institutional', name:'Institutional', monthlyPrice:55, yearlyPrice:550 },
];
export const getPricingPlans = (_req: Request, res: Response) => { res.json(PLANS); };
export const getMySubscription = async (req: Request, res: Response) => {
  try { const sub = await Subscription.findOne({ userId: req.params.userId, status: 'active' }); res.json(sub || null); }
  catch (err) { res.status(500).json({ message: 'Failed to fetch subscription', error: err }); }
};
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { userId, plan, tier, billingCycle } = req.body;
    const planId = plan || tier;
    const planData = PLANS.find(p => p.id === planId);
    if (!planData) return res.status(400).json({ message: 'Invalid plan' });
    await Subscription.updateMany({ userId }, { status: 'cancelled' });
    const isAnnual = billingCycle === 'annual';
    const priceUSD = isAnnual ? planData.yearlyPrice : planData.monthlyPrice;
    const startDate = new Date(); const endDate = new Date(startDate);
    if (isAnnual) endDate.setFullYear(endDate.getFullYear() + 1); else endDate.setMonth(endDate.getMonth() + 1);
    const sub = await Subscription.create({ userId, tier: planId, billingCycle: isAnnual ? 'annual' : 'monthly', priceUSD, status: 'active', startDate, endDate });
    res.status(201).json(sub);
  } catch (err) { res.status(500).json({ message: 'Failed to create subscription', error: err }); }
};
export const cancelSubscription = async (req: Request, res: Response) => {
  try { const sub = await Subscription.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true }); if (!sub) return res.status(404).json({ message: 'Subscription not found' }); res.json(sub); }
  catch (err) { res.status(500).json({ message: 'Failed to cancel subscription', error: err }); }
};
