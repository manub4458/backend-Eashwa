import { Router } from 'express';
import { register, login, forgotPassword, verifyOtp, resetPassword, getAllEmployees, updateTarget, getTopEmployees, getEmployeeDetails, addVisitor, getVisitors } from '../controller/user';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/otp-verify', verifyOtp);
router.post('/add-visitor', authenticateToken, addVisitor);
router.put('/reset-password', resetPassword);
router.put("/update-target/:id", authenticateToken, updateTarget);
router.get('/employees', authenticateToken, getAllEmployees);
router.get('/employee-detail/:userId', authenticateToken, getEmployeeDetails);
router.get('/get-visitor', authenticateToken, getVisitors);
router.get('/top-employees', getTopEmployees);


export default router;