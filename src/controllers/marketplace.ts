/**
 * Marketplace controller — handles:
 * - Product catalog
 * - Patent Dossier product
 * - License agreement acceptance
 * - Customer library (all purchases)
 * - Coupon validation
 * - DRM / download tracking
 * - Sales analytics
 */
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PlatformContent, { Book, Essay, IndustrialProcess } from '../models/PlatformContent';
import https from 'https';

// ─────────────────────────────────────────────────────────────────────────────
// Product catalog
// ─────────────────────────────────────────────────────────────────────────────

export const getCatalog = async (_req: Request, res: Response) => {
  try {
    const [books, processes] = await Promise.all([
      Book.find({ published: true }),
      IndustrialProcess.find({ published: true }),
    ]);

    const catalog = {
      categories: [
        {
          id: 'books',
          label: 'Books',
          description: 'Premium digital books on African innovation and mathematics',
          icon: '📘',
          items: books,
          bundlePrice: 499.99,
          singlePrice: 39.99,
        },
        {
          id: 'industrial-cookbook',
          label: 'Industrial Cookbook',
          description: 'CAMS Industrial Cookbook – Small-Scale Recipes for Soap, Food, Medicine & Materials',
          icon: '🧪',
          price: 9.99,
          subscriptionPlans: [
            { id: 'monthly', label: 'Monthly', price: 50, interval: 'month' },
            { id: 'premium', label: 'Premium', price: 100, interval: 'month' },
            { id: 'annual', label: 'Annual', price: 500, interval: 'year' },
          ],
          freeFirstYear: true,
          items: processes,
        },
        {
          id: 'patent-dossier',
          label: 'Patent Dossier',
          description: 'CAMS Industrial Patent Dossier – Full Access + 1 Year Updates & Support',
          icon: '🧠',
          price: 1000,
          subscriptionPlans: [
            { id: 'monthly', label: 'Monthly', price: 50, interval: 'month' },
            { id: 'premium', label: 'Premium', price: 100, interval: 'month' },
            { id: 'annual', label: 'Annual', price: 500, interval: 'year' },
          ],
          features: [
            '388 Industrial Patents',
            'Technical claims & specifications',
            'Industrial applications guide',
            '1 Year update subscription',
            'Email support <48h SLA',
            'Quarterly webinars',
            'Subscriber forum access',
            'Technical bulletins',
          ],
        },
        {
          id: 'courses',
          label: 'Free Courses',
          description: 'Free courses — learn Ubuntu Mathematics and unlock premium content',
          icon: '🎓',
          price: 0,
        },
        {
          id: 'essays',
          label: 'Academic Papers',
          description: 'Free academic essays and research papers',
          icon: '📄',
          price: 0,
        },
      ],
    };

    res.json(catalog);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch catalog', error: err }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Patent Dossier
// ─────────────────────────────────────────────────────────────────────────────

export const getPatentDossier = (_req: Request, res: Response) => {
  res.json({
    id: 'patent-dossier',
    title: 'CAMS Industrial Patent Dossier',
    subtitle: 'Full Access + 1 Year Updates & Support',
    price: 1000,
    currency: 'USD',
    patentCount: 388,
    description: 'Comprehensive access to 388 industrial patents covering manufacturing, food processing, materials science, and sustainable technology.',
    sections: {
      whatYouGet: [
        '388 fully documented industrial patents',
        'Technical claims and specifications',
        'Industrial application guides',
        'Scaling and manufacturing instructions',
        '1 year of update subscription',
        'Priority email support (< 48h response)',
        'Quarterly webinar access',
        'Exclusive subscriber forum',
        'Technical bulletins and update releases',
      ],
      patentCoverage: [
        'Food & Beverage Processing',
        'Soap & Cosmetics Manufacturing',
        'Pharmaceutical Compounds',
        'Agricultural Technology',
        'Water Treatment Systems',
        'Renewable Energy Devices',
        'Construction Materials',
        'Textile & Fiber Processing',
      ],
      supportSLA: {
        emailResponse: '< 48 hours',
        webinars: 'Quarterly (4x per year)',
        forum: 'Subscriber-only community',
        bulletins: 'Monthly technical updates',
        updates: 'Continuous patent additions',
      },
      subscriptionPlans: [
        { id: 'monthly', label: 'Monthly Updates', price: 50, interval: 'month', description: 'Monthly patent updates + support' },
        { id: 'premium', label: 'Premium Support', price: 100, interval: 'month', description: 'Priority support + all updates' },
        { id: 'annual', label: 'Annual Plan', price: 500, interval: 'year', description: 'Best value — full year access' },
      ],
      legalAgreement: {
        version: '1.0',
        grantOfLicense: 'Single-user, non-transferable license for internal business use only.',
        restrictions: [
          'No redistribution or resale of patent documents',
          'No sublicensing to third parties',
          'No public disclosure of proprietary formulations',
          'Export control compliance required',
        ],
        terminationClause: 'License terminates immediately upon breach of terms.',
        refundPolicy: 'No refunds after document access is granted.',
        liabilityDisclaimer: 'CAMS provides patents as-is. No warranty of commercial viability.',
      },
      faqs: [
        { q: 'Can I use these patents commercially?', a: 'Yes, for your own business operations. Resale or sublicensing is prohibited.' },
        { q: 'How are updates delivered?', a: 'Via your customer portal and email notifications.' },
        { q: 'What format are the documents?', a: 'PDF with watermarking and digital fingerprinting.' },
        { q: 'Is there a refund policy?', a: 'No refunds once access is granted due to the digital nature of the product.' },
      ],
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// License agreement acceptance
// ─────────────────────────────────────────────────────────────────────────────

export const acceptLicense = async (req: Request, res: Response) => {
  try {
    const { userId, productId, productType, agreementVersion, ipAddress } = req.body;
    if (!userId || !productId || !agreementVersion) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Store consent in analyticsevents collection (no new collection)
    await (PlatformContent as any).create({
      contentType: 'license_acceptance',
      userId,
      productId,
      productType,
      agreementVersion,
      ipAddress: ipAddress || req.ip,
      acceptedAt: new Date(),
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      accepted: true,
      consentId: new mongoose.Types.ObjectId().toString(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ message: 'Failed to record license acceptance', error: err }); }
};

export const checkLicenseAccepted = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.query;
    const acceptance = await PlatformContent.findOne({
      contentType: 'license_acceptance',
      userId,
      productId,
    });
    res.json({ accepted: !!acceptance, acceptance });
  } catch (err) { res.status(500).json({ message: 'Failed to check license', error: err }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Customer library — all purchases for a user
// ─────────────────────────────────────────────────────────────────────────────

export const getCustomerLibrary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const purchases = await PlatformContent.find({
      contentType: { $in: ['bookpurchase', 'product_purchase'] },
      userId,
      status: 'completed',
    }).sort({ createdAt: -1 });

    // Enrich with product details
    const library = await Promise.all(purchases.map(async (p: any) => {
      let product = null;
      if (p.productType === 'book' || p.bookId) {
        product = await Book.findById(p.bookId || p.productId);
      } else if (p.productType === 'process') {
        product = await IndustrialProcess.findById(p.productId);
      } else if (p.productType === 'patent-dossier') {
        product = { title: 'CAMS Industrial Patent Dossier', type: 'patent-dossier' };
      }
      return {
        purchaseId: p._id,
        productType: p.productType || (p.bookId ? 'book' : 'unknown'),
        product,
        amountPaid: p.amountPaid,
        currency: p.currency || 'USD',
        purchasedAt: p.createdAt,
        downloadCount: p.downloadCount || 0,
        maxDownloads: p.maxDownloads || 5,
        licenseId: p.licenseId,
        bundlePurchase: p.bundlePurchase,
      };
    }));

    res.json(library);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch library', error: err }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Coupon validation
// ─────────────────────────────────────────────────────────────────────────────

// Simple in-memory coupon store — replace with DB in production
const COUPONS: Record<string, { discount: number; type: 'percent' | 'fixed'; maxUses: number; uses: number; expires?: Date }> = {
  'UBUNTU10': { discount: 10, type: 'percent', maxUses: 1000, uses: 0 },
  'CAMS50': { discount: 50, type: 'fixed', maxUses: 100, uses: 0 },
  'LAUNCH25': { discount: 25, type: 'percent', maxUses: 500, uses: 0 },
  'DOSSIER100': { discount: 100, type: 'fixed', maxUses: 50, uses: 0 },
};

export const validateCoupon = (req: Request, res: Response) => {
  const { code, amount } = req.body;
  const coupon = COUPONS[code?.toUpperCase()];

  if (!coupon) return res.status(404).json({ valid: false, message: 'Invalid coupon code' });
  if (coupon.uses >= coupon.maxUses) return res.status(400).json({ valid: false, message: 'Coupon has expired' });
  if (coupon.expires && new Date() > coupon.expires) return res.status(400).json({ valid: false, message: 'Coupon has expired' });

  const discountAmount = coupon.type === 'percent'
    ? (amount * coupon.discount) / 100
    : coupon.discount;

  const finalAmount = Math.max(0, amount - discountAmount);

  res.json({
    valid: true,
    code: code.toUpperCase(),
    discountType: coupon.type,
    discountValue: coupon.discount,
    discountAmount: discountAmount.toFixed(2),
    finalAmount: finalAmount.toFixed(2),
    originalAmount: amount,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Product purchase (Patent Dossier + general products)
// ─────────────────────────────────────────────────────────────────────────────

export const initProductPayment = async (req: Request, res: Response) => {
  try {
    const { userId, productId, productType, email, couponCode, amount: rawAmount } = req.body;

    let amount = rawAmount;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = COUPONS[couponCode?.toUpperCase()];
      if (coupon && coupon.uses < coupon.maxUses) {
        amount = coupon.type === 'percent'
          ? amount * (1 - coupon.discount / 100)
          : Math.max(0, amount - coupon.discount);
        coupon.uses++;
      }
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const params = JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      currency: 'USD',
      metadata: { userId, productId, productType, couponCode, type: 'product' },
      callback_url: `${clientUrl}/payment/success?gateway=paystack&type=${productType}`,
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
        res.json({ url: parsed.data.authorization_url, reference: parsed.data.reference, amount });
      });
    });
    paystackReq.on('error', (e: any) => res.status(500).json({ message: e.message }));
    paystackReq.write(params);
    paystackReq.end();
  } catch (err: any) { res.status(500).json({ message: 'Payment init failed', error: err.message }); }
};

export const verifyProductPayment = async (req: Request, res: Response) => {
  try {
    const { reference, userId, productId, productType } = req.body;

    const options = {
      hostname: 'api.paystack.co', port: 443,
      path: `/transaction/verify/${reference}`, method: 'GET',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    };

    https.get(options as any, (paystackRes: any) => {
      let data = '';
      paystackRes.on('data', (chunk: any) => data += chunk);
      paystackRes.on('end', async () => {
        const parsed = JSON.parse(data);
        if (!parsed.status || parsed.data.status !== 'success') {
          return res.status(402).json({ message: 'Payment not successful' });
        }

        const meta = parsed.data.metadata || {};
        const licenseId = `CAMS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const purchase = await (PlatformContent as any).create({
          contentType: 'product_purchase',
          userId: userId || meta.userId,
          productId: productId || meta.productId,
          productType: productType || meta.productType,
          amountPaid: parsed.data.amount / 100,
          currency: 'USD',
          paymentGateway: 'paystack',
          paymentReference: reference,
          status: 'completed',
          licenseId,
          downloadCount: 0,
          maxDownloads: 5,
          ipAddress: req.ip,
          purchasedAt: new Date(),
        });

        res.json({ ...(purchase as any).toObject(), licenseId });
      });
    });
  } catch (err: any) { res.status(500).json({ message: 'Verification failed', error: err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// DRM — protected download with fingerprinting
// ─────────────────────────────────────────────────────────────────────────────

export const protectedDownload = async (req: Request, res: Response) => {
  try {
    const { userId, purchaseId } = req.body;
    const { productId } = req.params;

    // Verify purchase
    const purchase = await PlatformContent.findOne({
      _id: purchaseId,
      userId,
      status: 'completed',
      contentType: { $in: ['product_purchase', 'bookpurchase'] },
    });

    if (!purchase) {
      return res.status(403).json({ message: 'No valid purchase found. Please purchase to download.' });
    }

    const p = purchase as any;

    // Check download limit
    if (p.downloadCount >= (p.maxDownloads || 5)) {
      // Log suspicious activity
      await (PlatformContent as any).create({
        contentType: 'download_alert',
        userId,
        productId,
        purchaseId,
        alertType: 'download_limit_exceeded',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
      });
      return res.status(429).json({ message: 'Download limit reached. Contact support to reset.' });
    }

    // Get product file URL
    let fileUrl = '';
    let productTitle = '';
    const user = await import('../models/User').then(m => m.default.findById(userId).select('name email'));

    if (p.productType === 'patent-dossier') {
      fileUrl = process.env.PATENT_DOSSIER_URL || '';
      productTitle = 'CAMS Industrial Patent Dossier';
    } else {
      const product = await PlatformContent.findOne({ _id: productId });
      fileUrl = (product as any)?.fullFileUrl || (product as any)?.fileUrl || '';
      productTitle = (product as any)?.title || 'Document';
    }

    // Generate watermark metadata (actual PDF watermarking would be server-side)
    const fingerprint = {
      buyerName: (user as any)?.name || 'Licensed User',
      buyerEmail: (user as any)?.email || '',
      orderId: purchaseId,
      licenseId: p.licenseId || purchaseId,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      documentHash: Buffer.from(`${purchaseId}-${userId}-${Date.now()}`).toString('base64'),
      notice: 'Licensed copy — unauthorized redistribution prohibited',
    };

    // Increment download count
    await PlatformContent.findByIdAndUpdate(purchaseId, { $inc: { downloadCount: 1 } });

    // Log download
    await (PlatformContent as any).create({
      contentType: 'download_log',
      userId,
      productId,
      purchaseId,
      licenseId: p.licenseId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      fingerprint,
      timestamp: new Date(),
    });

    res.json({
      downloadUrl: fileUrl,
      fingerprint,
      productTitle,
      remainingDownloads: (p.maxDownloads || 5) - (p.downloadCount + 1),
      watermarkData: {
        name: fingerprint.buyerName,
        email: fingerprint.buyerEmail,
        orderId: fingerprint.orderId,
        timestamp: fingerprint.timestamp,
        notice: fingerprint.notice,
      },
    });
  } catch (err) { res.status(500).json({ message: 'Download failed', error: err }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin — sales dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const getSalesDashboard = async (_req: Request, res: Response) => {
  try {
    const [purchases, downloads, alerts] = await Promise.all([
      PlatformContent.find({ contentType: { $in: ['product_purchase', 'bookpurchase'] }, status: 'completed' })
        .sort({ createdAt: -1 }).limit(100),
      PlatformContent.find({ contentType: 'download_log' }).sort({ timestamp: -1 }).limit(50),
      PlatformContent.find({ contentType: 'download_alert' }).sort({ timestamp: -1 }).limit(20),
    ]);

    const totalRevenue = (purchases as any[]).reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);

    const byProduct = (purchases as any[]).reduce((acc: any, p: any) => {
      const key = p.productType || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const revenueByProduct = (purchases as any[]).reduce((acc: any, p: any) => {
      const key = p.productType || 'unknown';
      acc[key] = (acc[key] || 0) + (p.amountPaid || 0);
      return acc;
    }, {});

    res.json({
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalPurchases: purchases.length,
        totalDownloads: downloads.length,
        suspiciousAlerts: alerts.length,
      },
      byProduct,
      revenueByProduct,
      recentPurchases: purchases.slice(0, 20),
      recentDownloads: downloads.slice(0, 20),
      alerts: alerts,
    });
  } catch (err) { res.status(500).json({ message: 'Failed to fetch sales dashboard', error: err }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Invoice generation
// ─────────────────────────────────────────────────────────────────────────────

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const purchase = await PlatformContent.findOne({
      _id: req.params.purchaseId,
      userId: req.query.userId,
      status: 'completed',
    });

    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

    const p = purchase as any;
    const user = await import('../models/User').then(m => m.default.findById(p.userId).select('name email'));

    const invoice = {
      invoiceNumber: `INV-${p._id.toString().slice(-8).toUpperCase()}`,
      issuedDate: p.createdAt,
      customer: { name: (user as any)?.name, email: (user as any)?.email },
      items: [{
        description: p.productType === 'patent-dossier'
          ? 'CAMS Industrial Patent Dossier – Full Access'
          : p.productType === 'book'
          ? 'Digital Book – CAMS Series'
          : 'Industrial Process Document',
        quantity: 1,
        unitPrice: p.amountPaid,
        total: p.amountPaid,
      }],
      subtotal: p.amountPaid,
      tax: 0,
      total: p.amountPaid,
      currency: p.currency || 'USD',
      paymentMethod: p.paymentGateway || 'Paystack',
      licenseId: p.licenseId,
      status: 'PAID',
    };

    res.json(invoice);
  } catch (err) { res.status(500).json({ message: 'Failed to generate invoice', error: err }); }
};
