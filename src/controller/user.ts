import { Request, Response, NextFunction, RequestHandler } from "express";
import { Types } from "mongoose";
import { compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import * as XLSX from "xlsx";

import User from "../model/user";
import Lead from "../model/lead";
import LeadFile from "../model/leadFile";
import TargetLeadFile from "../model/targetLeadFile";
import Visitor from "../model/visitor";
import { authenticator } from "otplib";
import { sendMail } from "../utils/emailer";
import { TargetAchieved } from "../types";
import {
  convertRowToLead,
  headerMapping,
  validateLeadData,
} from "../utils/healper";

interface LeadType {
  leadDate: Date;
  callingDate: Date;
  agentName: string;
  customerName: string;
  mobileNumber: string;
  occupation: string;
  location: string;
  town: string;
  state: string;
  status: string;
  remark: string;
  interestedAndNotInterested: string;
  officeVisitRequired: boolean;
  leadBy: Types.ObjectId;
  isTargetLead?: boolean;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      email,
      password,
      address,
      aadhaarNumber,
      role,
      employeeId,
      phone,
      joiningDate,
      targetAchieved,
      profilePicture,
      post,
    } = req.body;
    const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const pass: RegExp =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/;

    if (!role) {
      return res.status(407).json({ message: "role is required" });
    }
    if (!pass.test(password.toString())) {
      return res.status(407).json({
        message: "Enter valid password with uppercase, lowercase, number & @",
      });
    }
    if (!expression.test(email.toString())) {
      return res.status(407).json({ message: "Enter valid email" });
    }
    const existinguser = await User.findOne({ email });
    if (existinguser) {
      return res.status(400).json({ ok: false, message: "User already Exist" });
    }
    const newUser = new User({
      name,
      email,
      password,
      address,
      aadhaarNumber,
      role,
      employeeId,
      phone,
      joiningDate,
      targetAchieved,
      profilePicture,
      post,
    });
    await newUser.save();
    res.status(200).json({ message: "registered successfully" });
  } catch (err) {
    res.status(407).json({ message: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({
        message: "Email/Employee ID and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: userName }, { employeeId: userName }],
    });

    if (!user) {
      return res.status(409).json({
        message: "User doesn't exist",
      });
    }

    const isMatch = compareSync(password, user.password);
    if (!isMatch) {
      return res.status(409).json({
        message: "Invalid credentials",
      });
    }

    const authToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET_KEY || " ",
      { expiresIn: "30m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET_KEY || " ",
      { expiresIn: "2h" }
    );

    res.cookie("authToken", authToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });
    res.header("Authorization", `Bearer ${authToken}`);

    res.status(200).json({
      ok: true,
      message: "User login successful",
      user: user,
      authToken: authToken,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    delete updateData.password;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      updateData.ratings?.history &&
      Array.isArray(updateData.ratings.history)
    ) {
      updateData.ratings.history.forEach((newEntry: any) => {
        const { month, managerRating, adminRating, managerId, adminId } =
          newEntry;
        if (month) {
          const existingEntry = user.ratings.history.find(
            (entry) => entry.month === month
          );

          if (existingEntry) {
            if (managerRating !== undefined)
              existingEntry.managerRating = managerRating;
            if (adminRating !== undefined)
              existingEntry.adminRating = adminRating;
            if (managerId !== undefined) existingEntry.managerId = managerId;
            if (adminId !== undefined) existingEntry.adminId = adminId;
          } else {
            user.ratings.history.push({
              month,
              managerRating: managerRating ?? null,
              adminRating: adminRating ?? null,
              managerId: managerId ?? null,
              adminId: adminId ?? null,
            });
          }
        }
      });

      delete updateData.ratings;
    }

    Object.assign(user, updateData);
    const updatedUser = await user.save();
    const responseUser = updatedUser.toObject();
    // delete responseUser.password;
    // delete responseUser.passwordResetToken;

    res.status(200).json(responseUser);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getManagedEmployees = async (req: Request, res: Response) => {
  try {
    const id = (req as any).userId;

    const managedEmployees = await User.find({ managedBy: id })
      .select("-password -passwordResetToken")
      .lean();

    if (!managedEmployees || managedEmployees.length === 0) {
      return res.status(200).json({
        message: "No employees managed by this user",
        employees: [],
      });
    }

    res.status(200).json({
      message: "Managed employees retrieved successfully",
      employees: managedEmployees,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });
    }

    const otp = authenticator.generateSecret().slice(0, 6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetToken = otp;
    user.tokenExpire = otpExpiry;
    await user.save();

    sendMail(
      user.email,
      "Password Reset OTP",
      `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`
    );
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });
    }

    if (
      user.passwordResetToken.length === 0 ||
      (user.tokenExpire && user.tokenExpire < new Date())
    ) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const isMatch = compareSync(otp, user.passwordResetToken);

    if (!isMatch) {
      return res.status(409).json({
        message: "Invalid otp",
      });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message: "User is not verified. Please verify the OTP first.",
      });
    }
    user.password = newPassword;
    user.passwordResetToken = "";
    user.tokenExpire = null;
    user.isVerified = false;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).userId);

    if (!user) {
      return res.status(403).json({ message: "Forbidden: User not found" });
    }
    if (!["hr", "admin"].includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }

    const query =
      user.role === "admin"
        ? { role: { $in: ["employee", "hr"] } }
        : { role: "employee" };

    const employees = await User.find(query).select("-password");
    res.status(200).json({ employees, requestingUser: user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { battery, eRickshaw, scooty, month } = req.body;

    const requesterId = (req as any).userId;
    const requester = await User.findById(requesterId);
    if (!requester || !["hr", "admin"].includes(requester.role)) {
      return res.status(403).json({
        message: "Access denied. Only HR and admin can update targets.",
      });
    }

    if (!battery || !eRickshaw || !scooty) {
      return res.status(400).json({
        message: "All target fields (battery, eRickshaw, scooty) are required.",
      });
    }

    const validateTarget = (target: TargetAchieved) => {
      return target.total !== undefined && target.completed !== undefined;
    };

    if (
      !validateTarget(battery) ||
      !validateTarget(eRickshaw) ||
      !validateTarget(scooty)
    ) {
      return res.status(400).json({
        message:
          "Each target must include both 'total' and 'completed' values.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const updateField = (newTarget: {
      total: number;
      completed: number;
    }): TargetAchieved => {
      const completed = Math.min(newTarget.completed, newTarget.total);
      return {
        total: newTarget.total,
        completed: completed,
        pending: newTarget.total - completed,
      };
    };

    const updatedTargets = {
      battery: {
        total: battery.total,
        completed: battery.completed,
        pending: battery.total - battery.completed,
        current: {
          ...updateField(battery),
        },
        history: user.targetAchieved?.battery?.history || [],
      },
      eRickshaw: {
        total: eRickshaw.total,
        completed: eRickshaw.completed,
        pending: eRickshaw.total - eRickshaw.completed,
        current: {
          ...updateField(eRickshaw),
        },
        history: user.targetAchieved?.eRickshaw?.history ?? [],
      },
      scooty: {
        total: scooty.total,
        completed: scooty.completed,
        pending: scooty.total - scooty.completed,
        current: {
          ...updateField(scooty),
        },
        history: user.targetAchieved?.scooty?.history ?? [],
      },
    };

    // If `month` is provided, push the current targets to history
    if (month && typeof month === "string") {
      const historyEntry = {
        month,
        total: updatedTargets.battery.current.total,
        completed: updatedTargets.battery.current.completed,
        pending: updatedTargets.battery.current.pending,
      };
      updatedTargets.battery.history.push(historyEntry);
      updatedTargets.eRickshaw.history.push({
        ...historyEntry,
        total: updatedTargets.eRickshaw.current.total,
        completed: updatedTargets.eRickshaw.current.completed,
        pending: updatedTargets.eRickshaw.current.pending,
      });
      updatedTargets.scooty.history.push({
        ...historyEntry,
        total: updatedTargets.scooty.current.total,
        completed: updatedTargets.scooty.current.completed,
        pending: updatedTargets.scooty.current.pending,
      });
    }

    user.targetAchieved = updatedTargets;
    await user.save();

    res.status(200).json({
      message: "Target updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while updating the target.",
      error,
    });
  }
};

export const getTopEmployees = async (req: Request, res: Response) => {
  try {
    const users = await User.find();

    const calculatePercentage = (target: TargetAchieved) => {
      if (!target.total || target.total === 0) return 0;
      return (target.completed / target.total) * 100;
    };

    const employeesWithPercentage = users.map((user) => {
      const batteryPercentage = calculatePercentage(
        user.targetAchieved?.battery || { total: 0, completed: 0, pending: 0 }
      );
      const eRickshawPercentage = calculatePercentage(
        user.targetAchieved?.eRickshaw || { total: 0, completed: 0, pending: 0 }
      );
      const scootyPercentage = calculatePercentage(
        user.targetAchieved?.scooty || { total: 0, completed: 0, pending: 0 }
      );

      const overallPercentage =
        (batteryPercentage + eRickshawPercentage + scootyPercentage) / 3;

      return {
        user,
        percentage: overallPercentage,
      };
    });

    const topEmployees = employeesWithPercentage
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3)
      .map((item) => ({
        ...item.user.toObject(),
        percentage: item.percentage.toFixed(2),
      }));

    res.status(200).json({
      message: "Top 3 employees based on target achievement percentage",
      topEmployees,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while fetching top employees.",
      error: error,
    });
  }
};

export const getEmployeeDetails = async (req: Request, res: Response) => {
  try {
    const requestingUser = await User.findById((req as any).userId);

    if (!requestingUser || !["hr", "admin"].includes(requestingUser.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (requestingUser.role === "hr" && user.role !== "employee") {
      return res
        .status(403)
        .json({ message: "HR can only view employee details" });
    }

    const visitors = await Visitor.find({ visitedBy: userId })
      .populate({
        path: "visitedBy",
        select: "name",
      })
      .exec();

    const visitorDetails = visitors.map((visitor) => ({
      clientName: visitor.clientName,
      clientPhoneNumber: visitor.clientPhoneNumber,
      clientAddress: visitor.clientAddress,
      visitDateTime: visitor.visitDateTime,
      purpose: visitor.purpose,
      feedback: visitor.feedback,
      addedBy: (visitor.visitedBy as any).name,
    }));

    const leads = await Lead.find({ leadBy: userId })
      .sort({ leadDate: -1 })
      .select("-__v")
      .exec();

    const leadDetails = leads.map((lead) => ({
      id: lead._id,
      leadDate: lead.leadDate
        ? new Date(lead.leadDate).toISOString().split("T")[0]
        : null,
      callingDate: lead.callingDate
        ? new Date(lead.callingDate).toISOString().split("T")[0]
        : null,
      agentName: lead.agentName,
      customerName: lead.customerName,
      mobileNumber: lead.mobileNumber,
      occupation: lead.occupation,
      location: lead.location,
      town: lead.town,
      state: lead.state,
      status: lead.status,
      remark: lead.remark,
      interestedAndNotInterested: lead.interestedAndNotInterested,
      officeVisitRequired: lead.officeVisitRequired ? "Yes" : "No",
    }));

    const leadsSummary = {
      totalLeads: leads.length,
      interestedLeads: leads.filter((lead) =>
        lead.interestedAndNotInterested.toLowerCase().includes("interested")
      ).length,
      pendingLeads: leads.filter((lead) =>
        lead.status.toLowerCase().includes("pending")
      ).length,
      requiresVisit: leads.filter((lead) => lead.officeVisitRequired).length,
    };

    res.status(200).json({
      user,
      visitors: visitorDetails,
      leads: leadDetails,
      leadsSummary,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({ message: "Server error", error });
  }
};

export const addVisitor = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      clientName,
      clientPhoneNumber,
      clientAddress,
      visitDateTime,
      purpose,
      feedback,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newVisitor = new Visitor({
      clientName,
      clientPhoneNumber,
      clientAddress,
      visitDateTime,
      purpose,
      feedback,
      visitedBy: userId,
    });

    const savedVisitor = await newVisitor.save();
    user.visitors = user.visitors || [];
    user.visitors.push(savedVisitor._id as any);
    await user.save();

    return res.status(201).json({
      message: "Visitor added successfully",
      visitor: savedVisitor,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const getVisitors = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const visitors = await Visitor.find({ visitedBy: userId })
      .populate({
        path: "visitedBy",
        select: "name",
      })
      .exec();

    const visitorDetails = visitors.map((visitor) => ({
      clientName: visitor.clientName,
      clientPhoneNumber: visitor.clientPhoneNumber,
      clientAddress: visitor.clientAddress,
      visitDateTime: visitor.visitDateTime,
      purpose: visitor.purpose,
      feedback: visitor.feedback,
      addedBy: (visitor.visitedBy as any).name,
    }));

    res.status(200).json({ visitorDetails });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const processExcelAndCreateLeads = async (
  req: Request,
  res: Response
) => {
  try {
    const { fileUrl, employeeId } = req.body;

    if (!fileUrl || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "File URL and Employee ID are required",
      });
    }

    const userId = (req as any).userId;
    const requester = await User.findById(userId);

    if (!requester || !["hr", "admin"].includes(requester.role)) {
      return res.status(403).json({
        message: "Access denied. Only HR and admin can add target leads.",
      });
    }

    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (data.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty" });
    }

    const firstRow = data[0];
    const missingHeaders = Object.keys(headerMapping).filter(
      (header) => !(header in firstRow)
    );
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Excel format. Missing headers: " + missingHeaders.join(", "),
      });
    }

    const leads: LeadType[] = [];
    const invalidRows = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      if (!validateLeadData(row)) {
        invalidRows.push({ row: rowNumber, reason: "Missing or invalid data" });
        continue;
      }

      try {
        const lead = convertRowToLead(row, employeeId);
        lead.isTargetLead = true;
        leads.push(lead);
      } catch (error) {
        invalidRows.push({
          row: rowNumber,
          reason: error || "Invalid data format",
        });
        errors.push(`Row ${rowNumber}: ${error}`);
      }
    }

    if (leads.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid target leads found in the Excel file",
        invalidRows,
        errors,
      });
    }

    const session = await Lead.startSession();
    try {
      session.startTransaction();

      const savedLeads = await Lead.insertMany(leads, { session });

      await User.findByIdAndUpdate(
        employeeId,
        { $push: { leads: { $each: savedLeads.map((lead) => lead._id) } } },
        { session }
      );

      const targetFileRecord = new TargetLeadFile({
        fileUrl,
        uploadedBy: employeeId,
        leadCount: savedLeads.length,
        leads: savedLeads.map((lead) => lead._id),
      });
      await targetFileRecord.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: `Successfully processed ${leads.length} target leads`,
        totalRows: data.length,
        successfulRows: leads.length,
        invalidRows: invalidRows.length > 0 ? invalidRows : undefined,
        errors: errors.length > 0 ? errors : undefined,
        targetFileId: targetFileRecord._id,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error processing Excel file:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing Excel file",
      error,
    });
  }
};

export const createLeadsHistory = async (req: Request, res: Response) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: "File URL is required",
      });
    }

    const userId = (req as any).userId;
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (data.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty" });
    }

    const leads = [];
    for (let row of data) {
      try {
        const lead = convertRowToLead(row, userId);
        // isTargetLead defaults to false, no need to set explicitly
        leads.push(lead);
      } catch (error) {
        console.error("Invalid row data:", error);
      }
    }

    if (leads.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid leads found" });
    }

    const session = await Lead.startSession();
    try {
      session.startTransaction();

      const savedLeads = await Lead.insertMany(leads, { session });

      await User.findByIdAndUpdate(
        userId,
        { $push: { leads: { $each: savedLeads.map((lead) => lead._id) } } },
        { session }
      );

      const fileRecord = new LeadFile({
        fileUrl,
        uploadedBy: userId,
        leadCount: savedLeads.length,
        leads: savedLeads.map((lead) => lead._id),
      });
      await fileRecord.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: `Successfully processed ${leads.length} leads`,
        fileId: fileRecord._id,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error processing Excel file:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing file",
      error,
    });
  }
};

export const getFileUploadHistory = async (req: Request, res: Response) => {
  try {
    const paramId = req.params.id;
    const authUserId = (req as any).userId;

    const userId = paramId ? paramId : authUserId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User ID is required" });
    }

    const files = await LeadFile.find({ uploadedBy: userId })
      .sort({ uploadDate: -1 })
      .select("fileUrl uploadDate leadCount")
      .lean();

    return res.status(200).json({ success: true, files });
  } catch (error) {
    console.error("Error fetching file history:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching file history" });
  }
};

export const getTargetFileUploadHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const paramId = req.params.id;
    const authUserId = (req as any).userId;

    const userId = paramId ? paramId : authUserId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User ID is required" });
    }

    const files = await TargetLeadFile.find({ uploadedBy: userId })
      .sort({ uploadDate: -1 })
      .select("fileUrl uploadDate leadCount")
      .lean();

    return res.status(200).json({ success: true, files });
  } catch (error) {
    console.error("Error fetching target file history:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching target file history" });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(userId).populate({
      path: "leads",
      select: "-__v",
      options: {
        sort: { leadDate: -1 },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const formattedLeads = user?.leads?.map((lead: any) => ({
      id: lead._id,
      leadDate: lead.leadDate
        ? new Date(lead.leadDate).toISOString().split("T")[0]
        : null,
      callingDate: lead.callingDate
        ? new Date(lead.callingDate).toISOString().split("T")[0]
        : null,
      agentName: lead.agentName,
      customerName: lead.customerName,
      mobileNumber: lead.mobileNumber,
      occupation: lead.occupation,
      location: lead.location,
      town: lead.town,
      state: lead.state,
      status: lead.status,
      remark: lead.remark,
      interestedAndNotInterested: lead.interestedAndNotInterested,
      officeVisitRequired: lead.officeVisitRequired ? "Yes" : "No",
    }));

    return res.status(200).json({
      success: true,
      count: formattedLeads ? formattedLeads.length : 0,
      leads: formattedLeads,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching leads",
      error: error,
    });
  }
};

export const deleteRegularLeadFile = async (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId;
    const { requestId } = req.body;
    const id = (req as any).userId;

    const authUserId = requestId ? requestId : id;

    if (!fileId) {
      return res
        .status(400)
        .json({ success: false, message: "File ID is required" });
    }

    if (!authUserId) {
      return res
        .status(401)
        .json({ success: false, message: "User ID is required" });
    }

    // Find the file and ensure it belongs to the user
    const file = await LeadFile.findOne({
      _id: fileId,
      uploadedBy: authUserId,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found or you don’t have permission to delete it",
      });
    }

    const session = await Lead.startSession();
    try {
      session.startTransaction();

      // Optional: Delete associated leads (if you want to cascade delete)
      await Lead.deleteMany({ _id: { $in: file.leads } }, { session });

      // Remove lead references from the user's leads array
      await User.updateOne(
        { _id: authUserId },
        { $pull: { leads: { $in: file.leads } } },
        { session }
      );

      // Delete the file record
      await LeadFile.deleteOne({ _id: fileId }, { session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Regular lead file deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error deleting regular lead file:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error deleting regular lead file" });
  }
};

export const deleteTargetLeadFile = async (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId;
    const { requestId } = req.body;
    const id = (req as any).userId;

    const authUserId = requestId ? requestId : id;

    if (!fileId) {
      return res
        .status(400)
        .json({ success: false, message: "File ID is required" });
    }

    if (!authUserId) {
      return res
        .status(401)
        .json({ success: false, message: "User ID is required" });
    }

    // Find the file and ensure it belongs to the user
    const file = await TargetLeadFile.findOne({
      _id: fileId,
      uploadedBy: authUserId,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message:
          "Target file not found or you don’t have permission to delete it",
      });
    }

    const session = await Lead.startSession();
    try {
      session.startTransaction();

      // Optional: Delete associated leads (if you want to cascade delete)
      await Lead.deleteMany({ _id: { $in: file.leads } }, { session });

      // Remove lead references from the user's leads array
      await User.updateOne(
        { _id: authUserId },
        { $pull: { leads: { $in: file.leads } } },
        { session }
      );

      // Delete the file record
      await TargetLeadFile.deleteOne({ _id: fileId }, { session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Target lead file deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error deleting target lead file:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error deleting target lead file" });
  }
};
