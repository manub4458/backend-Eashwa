import { Request, Response } from "express";
import * as orderService from "../services/orderService";
import * as notificationService from "../services/notificationService";
import Order from "../model/order";

export const submitOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    if (!data.piPdf) {
      res
        .status(400)
        .json({ success: false, message: "PI PDF URL is required." });
      return;
    }
    const orderData = {
      ...data,
      quantity: parseInt(data.quantity),
      totalAmount: parseFloat(data.totalAmount),
      amountReceived: parseFloat(data.amountReceived),
      deadline: new Date(data.deadline),
      piPdf: data.piPdf,
      submittedBy: req.userId,
    };
    const order = await orderService.createOrder(orderData);
    const sid = await notificationService.sendAccountsVerificationNotification(
      order
    );
    //@ts-ignore
    await orderService.updateOrder(order._id, { accountsMessageSid: sid });
    res.status(200).json({ success: true, order });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to submit order.", error });
  }
};

export const deliverOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { driverNumber, vehicleNumber } = req.body;
    const order = await orderService.findOrderById(req.params.orderId);
    if (
      !order ||
      (order.status !== "ready_for_dispatch" && order.status !== "pending")
    ) {
      res
        .status(400)
        .json({ success: false, message: "Invalid order status." });
      return;
    }
    const updatedOrder = await orderService.updateOrder(req.params.orderId, {
      status: "completed",
      driverNumber,
      vehicleNumber,
    });
    if (updatedOrder) {
      await notificationService.sendDeepakConfirmation(updatedOrder);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to confirm delivery.", error });
  }
};

export const markPending = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order = await orderService.findOrderById(req.params.orderId);
    if (!order || order.status !== "ready_for_dispatch") {
      res
        .status(400)
        .json({ success: false, message: "Invalid order status." });
      return;
    }
    await orderService.updateOrder(req.params.orderId, { status: "pending" });
    res.status(200).json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to mark as pending.", error });
  }
};

export const getMyOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(400).json({ success: false, message: "User ID is required." });
      return;
    }

    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const month = req.query.month as string; // Format: YYYY-MM
    const orderId = req.query.orderId as string;
    const sortBy = req.query.sortBy as string; // pending_first, delivered_first, or latest

    const result = await orderService.getMyOrders(
      req.userId as string,
      page,
      limit,
      month,
      orderId,
      sortBy
    );

    res.status(200).json({
      success: true,
      orders: result.orders,
      totalPages: result.totalPages,
      currentPage: page,
      totalOrders: result.totalOrders,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch orders.", error });
  }
};

/**
 * Fetch all orders with pagination, filtering, and sorting (admin only)
 * @param req Express request object
 * @param res Express response object
 */
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const month = req.query.month as string;
    const orderId = req.query.orderId as string;
    const sortBy = req.query.sortBy as string;

    const result = await orderService.getAllOrders(
      page,
      limit,
      month,
      orderId,
      sortBy
    );

    res.status(200).json({
      success: true,
      orders: result.orders,
      totalPages: result.totalPages,
      currentPage: page,
      totalOrders: result.totalOrders,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch all orders.", error });
  }
};

export const getDispatchOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { month, orderId } = req.query;
    const filters = {
      month: month ? parseInt(month as string) : undefined,
      orderId: orderId as string | undefined,
    };
    const orders = await orderService.getDispatchOrders(filters);
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dispatch orders.",
      error,
    });
  }
};

export const updateOrderPriority = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (typeof priority !== "number" || priority < 1) {
      res
        .status(400)
        .json({
          success: false,
          message: "Priority must be a positive number.",
        });
      return;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { priority },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Priority updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update priority.", error });
  }
};
