"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTicketStatus = exports.getTickets = exports.createTicket = void 0;
const ticketService_1 = require("../services/ticketService");
const createTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        if (req.userId) {
            data.submittedBy = req.userId;
        }
        else {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const ticket = yield (0, ticketService_1.createTicketService)(data);
        res.status(201).json({ message: "Ticket raised successfully", ticket });
    }
    catch (error) {
        res.status(500).json({ message: "Error creating ticket", error });
    }
});
exports.createTicket = createTicket;
const getTickets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = req.query;
        const tickets = yield (0, ticketService_1.getAllTicketsService)(filters);
        res.json(tickets);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching tickets", error });
    }
});
exports.getTickets = getTickets;
const updateTicketStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, statusRemark } = req.body;
        // Add role check if needed, e.g., if (req.user.role !== 'admin' && req.user.post !== 'service') return unauthorized
        const ticket = yield (0, ticketService_1.updateTicketStatusService)(id, status, statusRemark);
        if (!ticket) {
            res.status(404).json({ message: "Ticket not found" });
            return;
        }
        res.json({ message: "Status updated", ticket });
    }
    catch (error) {
        res.status(500).json({ message: "Error updating status", error });
    }
});
exports.updateTicketStatus = updateTicketStatus;
