import { Router } from 'express';
import { emailController } from '../controllers/email.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/metrics', (req, res) => emailController.getMetrics(req, res));
router.get('/scheduled', (req, res) => emailController.getScheduled(req, res));
router.get('/sent', (req, res) => emailController.getSent(req, res));
router.get('/:id', (req, res) => emailController.getById(req, res));

router.post('/scheduled/:id/pause', (req, res) => emailController.pauseScheduled(req, res));
router.post('/scheduled/:id/resume', (req, res) => emailController.resumeScheduled(req, res));
router.delete('/scheduled/:id', (req, res) => emailController.deleteScheduled(req, res));
router.post('/failed/:id/retry', (req, res) => emailController.retryFailed(req, res));
router.patch('/:id/star', (req, res) => emailController.toggleStar(req, res));

export default router;
