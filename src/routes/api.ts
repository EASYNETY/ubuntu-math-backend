import express from 'express';
import { getStories, getStoryBySlug, createStory, updateStory, deleteStory } from '../controllers/story';
import { getInnovationById, getInnovationByStory } from '../controllers/innovation';
import { getModuleById, getModuleByInnovation, getModules, createModule, updateModule, deleteModule } from '../controllers/module';
import { updateProgress, completeModule, getProgress } from '../controllers/progress';
import { trackEvent, getDashboardStats, getAllUsers, updateUserRole } from '../controllers/admin';
import { signin, signup, getMe } from '../controllers/auth';
import { calculateUbuntu } from '../controllers/computation';

const router = express.Router();

// Auth
router.post('/auth/register', signup);
router.post('/auth/signin', signin);
router.get('/auth/me/:userId', getMe);

// Admin & Analytics
router.post('/analytics/track', trackEvent);
router.get('/admin/stats', getDashboardStats);
router.get('/admin/users', getAllUsers);
router.patch('/admin/users/:id/role', updateUserRole);

// Stories
router.get('/stories', getStories);
router.get('/story/:slug', getStoryBySlug);
router.post('/stories', createStory);
router.put('/stories/:id', updateStory);
router.delete('/stories/:id', deleteStory);

// Innovations
router.get('/innovation/:id', getInnovationById);
router.get('/innovation/story/:storyId', getInnovationByStory);

// Math Modules
router.get('/modules', getModules);
router.get('/module/:id', getModuleById);
router.get('/module/innovation/:innovationId', getModuleByInnovation);
router.post('/module', createModule);
router.put('/module/:id', updateModule);
router.delete('/module/:id', deleteModule);

// Progress
router.post('/progress/update', updateProgress);
router.post('/progress/complete', completeModule);
router.get('/progress/:userId', getProgress);

// Computation
router.post('/ubuntu/calculate', calculateUbuntu);

export default router;
