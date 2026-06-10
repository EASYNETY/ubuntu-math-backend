import express from 'express';
import { getStories, getStoryBySlug, createStory, updateStory, deleteStory } from '../controllers/story';
import { getInnovationById, getInnovationByStory } from '../controllers/innovation';
import { getModuleById, getModuleByInnovation, getModules, createModule, updateModule, deleteModule } from '../controllers/module';
import { updateProgress, completeModule, getProgress } from '../controllers/progress';
import { trackEvent, getDashboardStats, getAllUsers, updateUserRole, deleteUser } from '../controllers/admin';
import { signin, signup, getMe, createUser } from '../controllers/auth';
import { calculateUbuntu } from '../controllers/computation';
import { getCourses, getCourseBySlug, getCourseById, createCourse, updateCourse, deleteCourse, getAllCourses } from '../controllers/course';
import { enrollCourse, getMyEnrollments, getEnrollment, updateLessonProgress, issueCertificate, purchaseCertificate } from '../controllers/enrollment';
import { getMySubscription, createSubscription, cancelSubscription, getPricingPlans } from '../controllers/subscription';
import { createStripeSession, verifyStripeSession, stripeWebhook, initPaystack, verifyPaystack, initFlutterwave, verifyFlutterwave } from '../controllers/payment';
import { getGoogleAuthUrl, googleCallback, listGoogleCourses, importGoogleCourses } from '../controllers/googleClassroom';
import { upload, uploadFile, uploadFiles, uploadMultiple, deleteFile, listFiles } from '../controllers/upload';
import { getBooks, getBookBySlug, checkPurchase, downloadBook, initBookPayment, verifyBookPayment, getAllBooks, createBook, updateBook, deleteBook } from '../controllers/book';
import { getEssays, getEssayBySlug, downloadEssay, getAllEssays, createEssay, updateEssay, deleteEssay } from '../controllers/essay';
import { getProcesses, getProcessBySlug, initProcessPayment, downloadProcess, getAllProcesses, createProcess, updateProcess, deleteProcess } from '../controllers/industrialProcess';
import { getChannels, getPosts, createPost, likePost, deletePost, pinPost, searchPosts } from '../controllers/community';
import { listCollections, cleanupCollections } from '../controllers/cleanup';
import {
  getCatalog, getPatentDossier, acceptLicense, checkLicenseAccepted,
  getCustomerLibrary, validateCoupon, initProductPayment, verifyProductPayment,
  protectedDownload, getSalesDashboard, getInvoice,
} from '../controllers/marketplace';
import { 
  initiatePayment as evripayInitiate,
  getPaymentStatus as evripayStatus,
  getPaymentHistory as evripayHistory,
  cancelPayment as evripayCancel,
  handleWebhook as evripayWebhook,
  getAllPayments as evripayGetAll,
  approvePayment as evripayApprove,
  rejectPayment as evripayReject
} from '../controllers/evripayPayment';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { sanitizePaymentInputs, sanitizePaymentInitiation, sanitizeAdminAction } from '../middleware/sanitization';

const router = express.Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/register', signup);
router.post('/auth/signin', signin);
router.get('/auth/me/:userId', getMe);
router.post('/admin/users/create', createUser);

// ── Analytics & Admin ─────────────────────────────────────────────────────────
router.post('/analytics/track', trackEvent);
router.get('/admin/stats', getDashboardStats);
router.get('/admin/users', getAllUsers);
router.patch('/admin/users/:id/role', updateUserRole);
router.delete('/admin/users/:id', deleteUser);

// ── Stories ───────────────────────────────────────────────────────────────────
router.get('/stories', getStories);
router.get('/story/:slug', getStoryBySlug);
router.post('/stories', createStory);
router.put('/stories/:id', updateStory);
router.delete('/stories/:id', deleteStory);

// ── Innovations & Modules ─────────────────────────────────────────────────────
router.get('/innovation/:id', getInnovationById);
router.get('/innovation/story/:storyId', getInnovationByStory);
router.get('/modules', getModules);
router.get('/module/:id', getModuleById);
router.get('/module/innovation/:innovationId', getModuleByInnovation);
router.post('/module', createModule);
router.put('/module/:id', updateModule);
router.delete('/module/:id', deleteModule);

// ── Progress ──────────────────────────────────────────────────────────────────
router.post('/progress/update', updateProgress);
router.post('/progress/complete', completeModule);
router.get('/progress/:userId', getProgress);

// ── Ubuntu Computation ────────────────────────────────────────────────────────
router.post('/ubuntu/calculate', calculateUbuntu);

// ── Upload ────────────────────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), uploadFile);
router.post('/upload/multiple', uploadMultiple.array('files', 20), uploadFiles);
router.delete('/upload', deleteFile);
router.get('/upload/list', listFiles);

// ── Courses & Enrollments ─────────────────────────────────────────────────────
router.get('/courses', getCourses);
router.get('/courses/all', getAllCourses);
router.get('/courses/:id', getCourseById);
router.get('/course/slug/:slug', getCourseBySlug);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.post('/enrollments', enrollCourse);
router.get('/enrollments/user/:userId', getMyEnrollments);
router.get('/enrollments/:userId/:courseId', getEnrollment);
router.post('/enrollments/progress', updateLessonProgress);
router.post('/enrollments/:enrollmentId/certificate', issueCertificate);
router.post('/certificates/:certificateId/purchase', purchaseCertificate);

// ── Subscriptions & Payments ──────────────────────────────────────────────────
router.get('/pricing', getPricingPlans);
router.get('/subscriptions/:userId', getMySubscription);
router.post('/subscriptions', createSubscription);
router.delete('/subscriptions/:id', cancelSubscription);
router.post('/payment/stripe/session', createStripeSession);
router.post('/payment/stripe/verify', verifyStripeSession);
router.post('/payment/stripe/webhook', stripeWebhook);
router.post('/payment/paystack/init', initPaystack);
router.post('/payment/paystack/verify', verifyPaystack);
router.post('/payment/flutterwave/init', initFlutterwave);
router.post('/payment/flutterwave/verify', verifyFlutterwave);

// ── EvriPay Payments (South African bank transfers) ───────────────────────────
router.post('/payments/initiate', authenticateJWT, sanitizePaymentInitiation, evripayInitiate);
router.get('/payments/:paymentId/status', authenticateJWT, sanitizePaymentInputs, evripayStatus);
router.get('/payments/history', authenticateJWT, sanitizePaymentInputs, evripayHistory);
router.post('/payments/:paymentId/cancel', authenticateJWT, sanitizePaymentInputs, evripayCancel);
router.post('/payments/webhook', evripayWebhook); // No auth - uses signature verification

// ── Admin: Payment Management ─────────────────────────────────────────────────
router.get('/admin/payments', authenticateJWT, requireAdmin, sanitizePaymentInputs, evripayGetAll);
router.post('/admin/payments/:paymentId/approve', authenticateJWT, requireAdmin, evripayApprove);
router.post('/admin/payments/:paymentId/reject', authenticateJWT, requireAdmin, sanitizeAdminAction, evripayReject);

// ── Google Classroom ──────────────────────────────────────────────────────────
router.get('/google/auth-url', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);
router.get('/google/courses', listGoogleCourses);
router.post('/google/import', importGoogleCourses);

// ── Books ─────────────────────────────────────────────────────────────────────
router.get('/books', getBooks);
router.get('/books/all', getAllBooks);
router.get('/books/slug/:slug', getBookBySlug);
router.get('/books/check-purchase', checkPurchase);
router.post('/books/:id/download', downloadBook);
router.post('/books/payment/init', initBookPayment);
router.post('/books/payment/verify', verifyBookPayment);
router.post('/books', createBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);

// ── Essays ────────────────────────────────────────────────────────────────────
router.get('/essays', getEssays);
router.get('/essays/all', getAllEssays);
router.get('/essays/slug/:slug', getEssayBySlug);
router.post('/essays/:id/download', downloadEssay);
router.post('/essays', createEssay);
router.put('/essays/:id', updateEssay);
router.delete('/essays/:id', deleteEssay);

// ── Industrial Processes ──────────────────────────────────────────────────────
router.get('/processes', getProcesses);
router.get('/processes/all', getAllProcesses);
router.get('/processes/slug/:slug', getProcessBySlug);
router.post('/processes/:id/download', downloadProcess);
router.post('/processes/payment/init', initProcessPayment);
router.post('/processes', createProcess);
router.put('/processes/:id', updateProcess);
router.delete('/processes/:id', deleteProcess);

// ── Community ─────────────────────────────────────────────────────────────────
router.get('/community/channels', getChannels);
router.get('/community/posts', getPosts);
router.post('/community/posts', createPost);
router.post('/community/posts/:id/like', likePost);
router.delete('/community/posts/:id', deletePost);
router.patch('/community/posts/:id/pin', pinPost);
router.get('/community/search', searchPosts);

// ── DB Cleanup (one-time use) ─────────────────────────────────────────────────
router.get('/admin/collections', listCollections);
router.post('/admin/cleanup-collections', cleanupCollections);

// ── Marketplace ───────────────────────────────────────────────────────────────
router.get('/marketplace/catalog', getCatalog);
router.get('/marketplace/patent-dossier', getPatentDossier);
router.post('/marketplace/license/accept', acceptLicense);
router.get('/marketplace/license/check', checkLicenseAccepted);
router.get('/marketplace/library/:userId', getCustomerLibrary);
router.post('/marketplace/coupon/validate', validateCoupon);
router.post('/marketplace/payment/init', initProductPayment);
router.post('/marketplace/payment/verify', verifyProductPayment);
router.post('/marketplace/download/:productId', protectedDownload);
router.get('/marketplace/invoice/:purchaseId', getInvoice);
router.get('/admin/sales', getSalesDashboard);

export default router;
