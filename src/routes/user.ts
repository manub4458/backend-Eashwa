import {Router} from 'express';
import { register, login, forgotPassword, verifyOtp, resetPassword } from '../controller/user';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/otp-verify', verifyOtp);
router.put('/reset-password', resetPassword);

export default router;