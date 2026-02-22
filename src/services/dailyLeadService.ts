// services/dailyLeadService.ts
import DailyLead from "../model/dailyLead"; // adjust import path
import { Types } from "mongoose";
import { IDailyLead } from "../types";

export const createDailyLead = async (data: Partial<IDailyLead>): Promise<IDailyLead> => {
  // Optional: you can add validation here if you want
  if (!data.user) {
    throw new Error("user is required");
  }
  if (!data.date) {
    throw new Error("date is required");
  }

  return await DailyLead.create(data);
};

export const getAllDailyLeads = async (
  page: number = 1,
  limit: number = 10,
  month?: number,
  year?: number
) => {
  const query: any = {};

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    query.date = { $gte: start, $lt: end };
  } else if (year) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    query.date = { $gte: start, $lt: end };
  }

  const dailyLeads = await DailyLead.find(query)
    .populate("user", "name email employeeId")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ date: -1 })
    .lean();

  const monthlyTotals = await DailyLead.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        totalLeads: { $sum: "$numberOfLeads" },
        totalInterested: { $sum: "$interestedLeads" },
        totalNotInterestedFake: { $sum: "$notInterestedFake" },
        totalNextMonthConnect: { $sum: "$nextMonthConnect" },
        totalDealer: { $sum: "$totalDealer" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  return { dailyLeads, monthlyTotals };
};

export const getDailyLeadsByUser = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  month?: number,
  year?: number
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const query: any = { user: new Types.ObjectId(userId) };

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    query.date = { $gte: start, $lt: end };
  } else if (year) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    query.date = { $gte: start, $lt: end };
  }

  const dailyLeads = await DailyLead.find(query)
    .populate("user", "name email employeeId")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ date: -1 })
    .lean();

  const monthlyTotals = await DailyLead.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        totalLeads: { $sum: "$numberOfLeads" },
        totalInterested: { $sum: "$interestedLeads" },
        totalNotInterestedFake: { $sum: "$notInterestedFake" },
        totalNextMonthConnect: { $sum: "$nextMonthConnect" },
        totalDealer: { $sum: "$totalDealer" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  return { dailyLeads, monthlyTotals };
};

export const updateDailyLead = async (
  id: string,
  data: Partial<IDailyLead>
): Promise<IDailyLead | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return await DailyLead.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteDailyLead = async (id: string): Promise<IDailyLead | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return await DailyLead.findByIdAndDelete(id);
};

export const getById = async (id: string) => {
  return await DailyLead.findById(id).populate("user", "name email");
};