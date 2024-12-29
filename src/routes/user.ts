import {Router} from 'express';
import { register, login, forgotPassword, verifyOtp, resetPassword, getAllEmployees, updateTarget } from '../controller/user';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/otp-verify', verifyOtp);
router.put('/reset-password', resetPassword);
router.get('/employees', authenticateToken, getAllEmployees);
router.put("/update-target/:id", authenticateToken, updateTarget);

export default router;