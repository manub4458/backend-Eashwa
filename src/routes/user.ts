import {Router} from 'express';
import { register, login, forgotPassword, verifyOtp, resetPassword, getAllEmployees, updateTarget, updateCompletedTarget, getTopEmployees } from '../controller/user';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/otp-verify', verifyOtp);
router.put('/reset-password', resetPassword);
router.put("/update-target/:id", authenticateToken, updateTarget);
router.put("/update-completed-target", authenticateToken, updateCompletedTarget);
router.get('/employees', authenticateToken, getAllEmployees);
router.get('/top-employees', getTopEmployees)

export default router;