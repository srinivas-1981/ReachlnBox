import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/google', (req, res) => authController.initiateGoogleAuth(req, res));
router.get('/google/callback', (req, res) => authController.handleGoogleCallback(req, res));

router.post('/login', (req, res) => authController.login(req, res));

router.get('/me', optionalAuthenticate, (req, res) => authController.getMe(req, res));
router.put('/me', optionalAuthenticate, (req, res) => authController.updateMe(req, res));
router.patch('/me', optionalAuthenticate, (req, res) => authController.updateMe(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

export default router;
