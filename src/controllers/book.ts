import { Request, Response } from 'express';
import { Book, BookPurchase } from '../models/PlatformContent';
import https from 'https';

const BUNDLE_PRICE = 499.99;
const SINGLE_PRICE = 39.99;

// ── Public ──────────────────────────────────────────────────────────────────
export const getBooks = async (_req: Request, res: Response) => {
  try {
    const books = await Book.find({ published: true }).select('-fullFileUrl').sort({ seriesNumber: 1 });
    res.json(books);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch books', error: err }); }
};

export const getBookBySlug = async (req: Request, res: Response) => {
  try {
    const book = await Book.findOne({ slug: req.params.slug }).select('-fullFileUrl');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch book', error: err }); }
};

// ── Purchase check ───────────────────────────────────────────────────────────
export const checkPurchase = async (req: Request, res: Response) => {
  try {
    const { userId, bookId } = req.query;
    
    // Check for bundle purchase in both places
    const bundlePurchaseRecord = await BookPurchase.findOne({ userId, bundlePurchase: true, status: 'completed' });
    if (bundlePurchaseRecord) return res.json({ purchased: true, bundle: true });
    
    // Also check PlatformContent for bundle
    const PlatformContent = (await import('../models/PlatformContent')).default;
    const bundleInPlatformContent = await PlatformContent.findOne({ 
      userId, 
      productType: 'bundle-15-books', 
      status: 'completed' 
    });
    if (bundleInPlatformContent) return res.json({ purchased: true, bundle: true });
    
    if (bookId) {
      // Check BookPurchase collection
      const single = await BookPurchase.findOne({ userId, bookId, status: 'completed' });
      if (single) return res.json({ purchased: true, bundle: false });
      
      // Also check User.purchasedBooks array
      const User = (await import('../models/User')).default;
      const user = await User.findById(userId);
      if (user && user.purchasedBooks && user.purchasedBooks.includes(bookId as any)) {
        return res.json({ purchased: true, bundle: false });
      }
    }
    
    res.json({ purchased: false });
  } catch (err) { res.status(500).json({ message: 'Failed to check purchase', error: err }); }
};

// ── Download (after purchase) ────────────────────────────────────────────────
export const downloadBook = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Check multiple sources for ownership
    const bundlePurchase = await BookPurchase.findOne({ userId, bundlePurchase: true, status: 'completed' });
    const singlePurchase = await BookPurchase.findOne({ userId, bookId: book._id, status: 'completed' });
    
    // Also check User.purchasedBooks
    const User = (await import('../models/User')).default;
    const user = await User.findById(userId);
    const hasInUserModel = user && user.purchasedBooks && user.purchasedBooks.some((id: any) => id.toString() === book._id.toString());
    
    // Check PlatformContent for bundle
    const PlatformContent = (await import('../models/PlatformContent')).default;
    const bundleInPlatform = await PlatformContent.findOne({ 
      userId, 
      productType: 'bundle-15-books', 
      status: 'completed' 
    });

    if (!bundlePurchase && !singlePurchase && !hasInUserModel && !bundleInPlatform) {
      return res.status(403).json({ message: 'Purchase required to download' });
    }

    await Book.findByIdAndUpdate(book._id, { $inc: { downloadCount: 1 } });
    res.json({ downloadUrl: (book as any).fullFileUrl });
  } catch (err) { res.status(500).json({ message: 'Download failed', error: err }); }
};

// ── Paystack payment init ────────────────────────────────────────────────────
export const initBookPayment = async (req: Request, res: Response) => {
  try {
    const { userId, bookId, bundle, email } = req.body;
    const amount = bundle ? BUNDLE_PRICE : SINGLE_PRICE;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const params = JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      currency: 'USD',
      metadata: { userId, bookId: bookId || null, bundle: !!bundle, type: 'book' },
      callback_url: `${clientUrl}/payment/success?gateway=paystack&type=book`,
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

export const verifyBookPayment = async (req: Request, res: Response) => {
  try {
    const { reference, userId, bookId, bundle } = req.body;
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
        const purchase = await BookPurchase.create({
          userId: userId || meta.userId,
          bookId: bookId || meta.bookId || undefined,
          bundlePurchase: bundle ?? meta.bundle ?? false,
          amountPaid: parsed.data.amount / 100,
          currency: 'USD',
          paymentGateway: 'paystack',
          paymentReference: reference,
          status: 'completed',
        });
        if (bookId || meta.bookId) {
          await Book.findByIdAndUpdate(bookId || meta.bookId, { $inc: { purchaseCount: 1 } });
        }
        res.json(purchase);
      });
    });
  } catch (err: any) { res.status(500).json({ message: 'Verification failed', error: err.message }); }
};

// ── Admin CRUD ───────────────────────────────────────────────────────────────
export const getAllBooks = async (_req: Request, res: Response) => {
  try { const books = await Book.find().sort({ seriesNumber: 1 }); res.json(books); }
  catch (err) { res.status(500).json({ message: 'Failed', error: err }); }
};

export const createBook = async (req: Request, res: Response) => {
  try { const book = await Book.create(req.body); res.status(201).json(book); }
  catch (err) { res.status(500).json({ message: 'Failed to create book', error: err }); }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) { res.status(500).json({ message: 'Failed to update book', error: err }); }
};

export const deleteBook = async (req: Request, res: Response) => {
  try { await Book.findByIdAndDelete(req.params.id); res.json({ message: 'Book deleted' }); }
  catch (err) { res.status(500).json({ message: 'Failed to delete book', error: err }); }
};
