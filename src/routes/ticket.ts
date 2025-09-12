import express from "express";
import {
  createTicket,
  getTickets,
  updateTicketStatus,
} from "../controller/ticket";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create", authenticateToken, createTicket);
router.get("/", authenticateToken, getTickets);
router.patch("/:id/status", authenticateToken, updateTicketStatus);

export default router;
