import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getAllEmployees,
  updateTarget,
  getTopEmployees,
  getEmployeeDetails,
  addVisitor,
  getVisitors,
  processExcelAndCreateLeads,
  getLeads,
  createLeadsHistory,
  getFileUploadHistory,
} from "../controller/user";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/otp-verify", verifyOtp);
router.post("/add-visitor", authenticateToken, addVisitor);
router.post("/process-leads", authenticateToken, processExcelAndCreateLeads);
router.post("/upload-file-leads", authenticateToken, createLeadsHistory);
router.put("/reset-password", resetPassword);
router.put("/update-target/:id", authenticateToken, updateTarget);
router.get("/employees", authenticateToken, getAllEmployees);
router.get("/employee-detail/:userId", authenticateToken, getEmployeeDetails);
router.get("/get-visitor", authenticateToken, getVisitors);
router.get("/top-employees", getTopEmployees);
router.get("/leads", authenticateToken, getLeads);
router.get("/get-file-lead", authenticateToken, getFileUploadHistory);

export default router;
