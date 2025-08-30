import { Types } from "mongoose";
import * as notificationService from "./notificationService";
import { IOrder } from "../types";
import Order from "../model/order";

export const createOrder = async (data: Partial<IOrder>): Promise<IOrder> => {
  const order = new Order(data);
  return order.save();
};

export const updateOrder = async (
  id: Types.ObjectId | string,
  updates: Partial<IOrder>
): Promise<IOrder | null> => {
  return Order.findByIdAndUpdate(id, updates, { new: true });
};

export const findOrderById = async (
  id: Types.ObjectId | string
): Promise<IOrder | null> => {
  return Order.findById(id);
};

export const findOrderBySid = async (sid: string): Promise<IOrder | null> => {
  return Order.findOne({ accountsMessageSid: sid });
};

export const getMyOrders = async (
  userId: Types.ObjectId | string,
  page: number = 1,
  limit: number = 10,
  month?: string,
  orderId?: string,
  sortBy?: string
): Promise<{
  orders: IOrder[];
  totalPages: number;
  totalOrders: number;
}> => {
  const query: any = { submittedBy: userId };

  if (month) {
    const [year, monthNum] = month.split("-");
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    query.createdAt = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  if (orderId) {
    query.orderId = { $regex: orderId, $options: "i" };
  }

  let sortOption: any = { createdAt: -1 };
  if (sortBy === "pending_first") {
    sortOption = { pendency: -1, createdAt: -1 };
  } else if (sortBy === "delivered_first") {
    sortOption = {
      status: 1,
      createdAt: -1,
    };
  }

  const skip = (page - 1) * limit;

  const [orders, totalOrders] = await Promise.all([
    Order.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
    Order.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalOrders / limit);

  return {
    //@ts-ignore
    orders,
    totalPages,
    totalOrders,
  };
};

/**
 * Fetch all orders with pagination, filtering, and sorting (admin only)
 * @param page Page number for pagination
 * @param limit Number of orders per page
 * @param month Filter by month (YYYY-MM)
 * @param orderId Search by order ID
 * @param sortBy Sort by pending_first, delivered_first, or latest
 * @returns Object containing orders, total pages, and total orders
 */

export const getAllOrders = async (
  page: number = 1,
  limit: number = 10,
  month?: string,
  orderId?: string,
  sortBy?: string
): Promise<{
  orders: IOrder[];
  totalPages: number;
  totalOrders: number;
}> => {
  const query: any = {};

  // Month filter (YYYY-MM format)
  if (month) {
    const [year, monthNum] = month.split("-");
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    query.createdAt = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  // Order ID filter
  if (orderId) {
    query.orderId = { $regex: orderId, $options: "i" };
  }

  // Sorting logic
  let sortOption: any;
  if (sortBy === "pending_first") {
    sortOption = { pendency: -1, createdAt: -1 };
  } else if (sortBy === "delivered_first") {
    sortOption = { status: 1, createdAt: -1 };
  } else {
    // Default sort: priority asc (nulls last), then createdAt desc
    sortOption = [
      { $sort: { priority: 1, createdAt: -1 } },
      {
        $addFields: {
          priority: { $ifNull: ["$priority", Number.MAX_SAFE_INTEGER] },
        },
      },
      { $sort: { priority: 1, createdAt: -1 } },
    ];
  }

  const skip = (page - 1) * limit;

  const [orders, totalOrders] = await Promise.all([
    // Use aggregation for default sort to handle nulls last
    sortBy === "pending_first" || sortBy === "delivered_first"
      ? Order.find(query).sort(sortOption).skip(skip).limit(limit).lean()
      : Order.aggregate([
          { $match: query },
          ...sortOption,
          { $skip: skip },
          { $limit: limit },
        ]),
    Order.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalOrders / limit);

  return {
    //@ts-ignore
    orders,
    totalPages,
    totalOrders,
  };
};

export const getDispatchOrders = async (filters: {
  month?: number;
  orderId?: string;
}): Promise<IOrder[]> => {
  const now = new Date();
  const overdueQuery = {
    status: { $in: ["ready_for_dispatch", "pending"] },
    deadline: { $lt: now },
    reminderSent: false,
  };
  const overdueOrders = await Order.find(overdueQuery);

  for (const order of overdueOrders as IOrder[]) {
    await notificationService.sendReminderToDispatch(order);
    //@ts-ignore
    await updateOrder(order._id, { reminderSent: true });
  }

  const query: any = {
    status: { $in: ["ready_for_dispatch", "pending", "completed"] },
  };
  if (filters.month) {
    const year = new Date().getFullYear();
    query.createdAt = {
      $gte: new Date(year, filters.month - 1, 1),
      $lt: new Date(year, filters.month, 1),
    };
  }
  if (filters.orderId) {
    query.orderId = { $regex: filters.orderId, $options: "i" };
  }
  return Order.find(query).sort({ createdAt: -1 });
};
