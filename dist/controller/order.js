"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderPriority = exports.getDispatchOrders = exports.getAllOrders = exports.getMyOrders = exports.markPending = exports.deliverOrder = exports.submitOrder = void 0;
const orderService = __importStar(require("../services/orderService"));
const notificationService = __importStar(require("../services/notificationService"));
const order_1 = __importDefault(require("../model/order"));
const submitOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        if (!data.piPdf) {
            res
                .status(400)
                .json({ success: false, message: "PI PDF URL is required." });
            return;
        }
        const orderData = Object.assign(Object.assign({}, data), { quantity: parseInt(data.quantity), totalAmount: parseFloat(data.totalAmount), amountReceived: parseFloat(data.amountReceived), deadline: new Date(data.deadline), piPdf: data.piPdf, submittedBy: req.userId });
        const order = yield orderService.createOrder(orderData);
        const sid = yield notificationService.sendAccountsVerificationNotification(order);
        //@ts-ignore
        yield orderService.updateOrder(order._id, { accountsMessageSid: sid });
        res.status(200).json({ success: true, order });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Failed to submit order.", error });
    }
});
exports.submitOrder = submitOrder;
const deliverOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { driverNumber, vehicleNumber, transporterName } = req.body;
        const order = yield orderService.findOrderById(req.params.orderId);
        if (!order ||
            (order.status !== "ready_for_dispatch" && order.status !== "pending")) {
            res
                .status(400)
                .json({ success: false, message: "Invalid order status." });
            return;
        }
        const updatedOrder = yield orderService.updateOrder(req.params.orderId, {
            status: "completed",
            driverNumber,
            vehicleNumber,
            transporterName,
            pendingReason: "-",
        });
        if (updatedOrder) {
            yield notificationService.sendDeepakConfirmation(updatedOrder);
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Failed to confirm delivery.", error });
    }
});
exports.deliverOrder = deliverOrder;
const markPending = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pendingReason } = req.body;
        if (!pendingReason ||
            typeof pendingReason !== "string" ||
            !pendingReason.trim()) {
            res
                .status(400)
                .json({ success: false, message: "Pending reason is required." });
            return;
        }
        const order = yield orderService.findOrderById(req.params.orderId);
        if (!order || order.status !== "ready_for_dispatch") {
            res
                .status(400)
                .json({ success: false, message: "Invalid order status." });
            return;
        }
        yield orderService.updateOrder(req.params.orderId, {
            status: "pending",
            pendingReason,
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Failed to mark as pending.", error });
    }
});
exports.markPending = markPending;
const getMyOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            res.status(400).json({ success: false, message: "User ID is required." });
            return;
        }
        // Extract query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const month = req.query.month; // Format: YYYY-MM
        const orderId = req.query.orderId;
        const sortBy = req.query.sortBy; // pending_first, delivered_first, or latest
        const result = yield orderService.getMyOrders(req.userId, page, limit, month, orderId, sortBy);
        res.status(200).json({
            success: true,
            orders: result.orders,
            totalPages: result.totalPages,
            currentPage: page,
            totalOrders: result.totalOrders,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch orders.", error });
    }
});
exports.getMyOrders = getMyOrders;
/**
 * Fetch all orders with pagination, filtering, and sorting (admin only)
 * @param req Express request object
 * @param res Express response object
 */
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const month = req.query.month;
        const orderId = req.query.orderId;
        const sortBy = req.query.sortBy;
        const result = yield orderService.getAllOrders(page, limit, month, orderId, sortBy);
        res.status(200).json({
            success: true,
            orders: result.orders,
            totalPages: result.totalPages,
            currentPage: page,
            totalOrders: result.totalOrders,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch all orders.", error });
    }
});
exports.getAllOrders = getAllOrders;
const getDispatchOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, orderId } = req.query;
        const filters = {
            month: month ? parseInt(month) : undefined,
            orderId: orderId,
        };
        const orders = yield orderService.getDispatchOrders(filters);
        res.status(200).json({ success: true, orders });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch dispatch orders.",
            error,
        });
    }
});
exports.getDispatchOrders = getDispatchOrders;
const updateOrderPriority = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { priority } = req.body;
        if (typeof priority !== "number" || priority < 1) {
            res.status(400).json({
                success: false,
                message: "Priority must be a positive number.",
            });
            return;
        }
        const updatedOrder = yield order_1.default.findByIdAndUpdate(id, { priority }, { new: true, runValidators: true });
        if (!updatedOrder) {
            res.status(404).json({ success: false, message: "Order not found." });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Priority updated successfully.",
            order: updatedOrder,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Failed to update priority.", error });
    }
});
exports.updateOrderPriority = updateOrderPriority;
