import { Request, Response } from 'express';
import IndustrialProcess from '../models/IndustrialProcess';
import https from 'https';

export const getProcesses = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const query: any = { published: true };
    if (category) query.category = category;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    const processes = await IndustrialProcess.find(query)
      .select('-fullFileUrl -steps -inputs -equipment -scalingInstructions')
      .sort({ createdAt: -1 });
    res.json(processes);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch processes', error: err }); }
};

export const getProcessBySlug = async (req: Request, res: Response) => {
  try {
    const process = await IndustrialProcess.findOne({ slug: req.params.slug, published: true })
      .select('-fullFileUrl');
    if (!process) return res.status(404).json({ message: 'Process not found' });
    res.json(process);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch process', error: err }); }
};

export const initProcessPayment = async (req: Request, res: Response) => {
  try {
    const { userId, processId, email } = req.body;
    const proc = await IndustrialProcess.findById(processId);
    if (!proc) return res.status(404).json({ message: 'Process not found' });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const params = JSON.stringify({
      email,
      amount: Math.round(proc.price * 100),
      currency: 'USD',
      metadata: { userId, processId, type: 'process' },
      callback_url: `${clientUrl}/payment/success?gateway=paystack&type=process`,
    });

    const options = {
      hostname: 'api.paystack.co', port: 443, path: '/transaction/initialize',
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    };

    const paystackReq = https.request(options as any, (paystackRes: any) => {
      let data = '';
      paystackRes.on('data', (chunk: any) => data += chunk);
      paystackRes.on('end', () => {
        const parsed = JSON.parse(data);
        if (!parsed.status) return res.status(400).json({ message: parsed.message });
        res.json({ url: parsed.data.authorization_url, reference: parsed.data.reference });
      });
    });
    paystackReq.on('error', (e: any) => res.status(500).json({ message: e.message }));
    paystackReq.write(params);
    paystackReq.end();
  } catch (err: any) { res.status(500).json({ message: 'Payment init failed', error: err.message }); }
};

export const downloadProcess = async (req: Request, res: Response) => {
  try {
    const process = await IndustrialProcess.findById(req.params.id);
    if (!process) return res.status(404).json({ message: 'Process not found' });
    await IndustrialProcess.findByIdAndUpdate(process._id, { $inc: { downloadCount: 1 } });
    res.json({ downloadUrl: process.fullFileUrl });
  } catch (err) { res.status(500).json({ message: 'Download failed', error: err }); }
};

export const getAllProcesses = async (_req: Request, res: Response) => {
  try { const processes = await IndustrialProcess.find().sort({ createdAt: -1 }); res.json(processes); }
  catch (err) { res.status(500).json({ message: 'Failed', error: err }); }
};

export const createProcess = async (req: Request, res: Response) => {
  try { const process = await IndustrialProcess.create(req.body); res.status(201).json(process); }
  catch (err) { res.status(500).json({ message: 'Failed to create process', error: err }); }
};

export const updateProcess = async (req: Request, res: Response) => {
  try {
    const process = await IndustrialProcess.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!process) return res.status(404).json({ message: 'Process not found' });
    res.json(process);
  } catch (err) { res.status(500).json({ message: 'Failed to update process', error: err }); }
};

export const deleteProcess = async (req: Request, res: Response) => {
  try { await IndustrialProcess.findByIdAndDelete(req.params.id); res.json({ message: 'Process deleted' }); }
  catch (err) { res.status(500).json({ message: 'Failed to delete process', error: err }); }
};
