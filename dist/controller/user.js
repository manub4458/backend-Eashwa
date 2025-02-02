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
exports.getLeads = exports.processExcelAndCreateLeads = exports.getVisitors = exports.addVisitor = exports.getEmployeeDetails = exports.getTopEmployees = exports.updateTarget = exports.getAllEmployees = exports.resetPassword = exports.verifyOtp = exports.forgotPassword = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = require("bcrypt");
const user_1 = __importDefault(require("../model/user"));
const otplib_1 = require("otplib");
const emailer_1 = require("../utils/emailer");
const visitor_1 = __importDefault(require("../model/visitor"));
const healper_1 = require("../utils/healper");
const lead_1 = __importDefault(require("../model/lead"));
const XLSX = __importStar(require("xlsx"));
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = require("mongoose");
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, address, aadhaarNumber, role, employeeId, phone, joiningDate, targetAchieved, profilePicture, post, } = req.body;
        const expression = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        const pass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/;
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
        const existinguser = yield user_1.default.findOne({ email });
        if (existinguser) {
            return res.status(400).json({ ok: false, message: "User already Exist" });
        }
        const newUser = new user_1.default({
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
        yield newUser.save();
        res.status(200).json({ message: "registered successfully" });
    }
    catch (err) {
        res.status(407).json({ message: err });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userName, password } = req.body;
        if (!userName || !password) {
            return res.status(400).json({
                message: "Email/Employee ID and password are required",
            });
        }
        const user = yield user_1.default.findOne({
            $or: [{ email: userName }, { employeeId: userName }],
        });
        if (!user) {
            return res.status(409).json({
                message: "User doesn't exist",
            });
        }
        const isMatch = (0, bcrypt_1.compareSync)(password, user.password);
        if (!isMatch) {
            return res.status(409).json({
                message: "Invalid credentials",
            });
        }
        const authToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET_KEY || " ", { expiresIn: "30m" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET_KEY || " ", { expiresIn: "2h" });
        res.cookie("authToken", authToken, { httpOnly: true });
        res.cookie("refreshToken", refreshToken, { httpOnly: true });
        res.header("Authorization", `Bearer ${authToken}`);
        res.status(200).json({
            ok: true,
            message: "User login successful",
            user: user,
            authToken: authToken,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Something went wrong",
        });
    }
});
exports.login = login;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            return res
                .status(400)
                .json({ message: "User with this email does not exist" });
        }
        const otp = otplib_1.authenticator.generateSecret().slice(0, 6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.passwordResetToken = otp;
        user.tokenExpire = otpExpiry;
        yield user.save();
        (0, emailer_1.sendMail)(user.email, "Password Reset OTP", `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`);
        res.status(200).json({ message: "OTP sent to your email" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.forgotPassword = forgotPassword;
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            return res
                .status(400)
                .json({ message: "User with this email does not exist" });
        }
        if (user.passwordResetToken.length === 0 ||
            (user.tokenExpire && user.tokenExpire < new Date())) {
            return res.status(400).json({ message: "OTP has expired" });
        }
        const isMatch = (0, bcrypt_1.compareSync)(otp, user.passwordResetToken);
        if (!isMatch) {
            return res.status(409).json({
                message: "Invalid otp",
            });
        }
        user.isVerified = true;
        yield user.save();
        res.status(200).json({ message: "OTP verified successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.verifyOtp = verifyOtp;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, newPassword } = req.body;
        const user = yield user_1.default.findOne({ email });
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
        yield user.save();
        res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.resetPassword = resetPassword;
const getAllEmployees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.default.findById(req.userId);
        if (!user) {
            return res.status(403).json({ message: "Forbidden: User not found" });
        }
        if (!["hr", "admin"].includes(user.role)) {
            return res
                .status(403)
                .json({ message: "Forbidden: Insufficient permissions" });
        }
        const query = user.role === "admin"
            ? { role: { $in: ["employee", "hr"] } }
            : { role: "employee" };
        const employees = yield user_1.default.find(query).select("-password");
        res.status(200).json({ employees, requestingUser: user });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.getAllEmployees = getAllEmployees;
const updateTarget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { battery, eRickshaw, scooty } = req.body;
        const requesterId = req.userId;
        const requester = yield user_1.default.findById(requesterId);
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
        const validateTarget = (target) => {
            return target.total !== undefined && target.completed !== undefined;
        };
        if (!validateTarget(battery) ||
            !validateTarget(eRickshaw) ||
            !validateTarget(scooty)) {
            return res.status(400).json({
                message: "Each target must include both 'total' and 'completed' values.",
            });
        }
        const user = yield user_1.default.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Employee not found." });
        }
        const updateField = (newTarget) => {
            const completed = Math.min(newTarget.completed, newTarget.total);
            return {
                total: newTarget.total,
                completed: completed,
                pending: newTarget.total - completed,
            };
        };
        user.targetAchieved = {
            battery: updateField(battery),
            eRickshaw: updateField(eRickshaw),
            scooty: updateField(scooty),
        };
        yield user.save();
        res.status(200).json({
            message: "Target updated successfully.",
            user,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "An error occurred while updating the target.",
            error: error,
        });
    }
});
exports.updateTarget = updateTarget;
const getTopEmployees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find();
        const calculatePercentage = (target) => {
            if (!target.total || target.total === 0)
                return 0;
            return (target.completed / target.total) * 100;
        };
        const employeesWithPercentage = users.map((user) => {
            var _a, _b, _c;
            const batteryPercentage = calculatePercentage(((_a = user.targetAchieved) === null || _a === void 0 ? void 0 : _a.battery) || { total: 0, completed: 0, pending: 0 });
            const eRickshawPercentage = calculatePercentage(((_b = user.targetAchieved) === null || _b === void 0 ? void 0 : _b.eRickshaw) || { total: 0, completed: 0, pending: 0 });
            const scootyPercentage = calculatePercentage(((_c = user.targetAchieved) === null || _c === void 0 ? void 0 : _c.scooty) || { total: 0, completed: 0, pending: 0 });
            const overallPercentage = (batteryPercentage + eRickshawPercentage + scootyPercentage) / 3;
            return {
                user,
                percentage: overallPercentage,
            };
        });
        const topEmployees = employeesWithPercentage
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 3)
            .map((item) => (Object.assign(Object.assign({}, item.user.toObject()), { percentage: item.percentage.toFixed(2) })));
        res.status(200).json({
            message: "Top 3 employees based on target achievement percentage",
            topEmployees,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "An error occurred while fetching top employees.",
            error: error,
        });
    }
});
exports.getTopEmployees = getTopEmployees;
const getEmployeeDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestingUser = yield user_1.default.findById(req.userId);
        if (!requestingUser || !["hr", "admin"].includes(requestingUser.role)) {
            return res
                .status(403)
                .json({ message: "Forbidden: Insufficient permissions" });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const user = yield user_1.default.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (requestingUser.role === "hr" && user.role !== "employee") {
            return res
                .status(403)
                .json({ message: "HR can only view employee details" });
        }
        const visitors = yield visitor_1.default.find({ visitedBy: userId })
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
            addedBy: visitor.visitedBy.name,
        }));
        const leads = yield lead_1.default.find({ leadBy: userId })
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
            interestedLeads: leads.filter((lead) => lead.interestedAndNotInterested.toLowerCase().includes("interested")).length,
            pendingLeads: leads.filter((lead) => lead.status.toLowerCase().includes("pending")).length,
            requiresVisit: leads.filter((lead) => lead.officeVisitRequired).length,
        };
        res.status(200).json({
            user,
            visitors: visitorDetails,
            leads: leadDetails,
            leadsSummary,
        });
    }
    catch (error) {
        if (error instanceof Error && error.name === "CastError") {
            return res.status(400).json({ message: "Invalid user ID format" });
        }
        res.status(500).json({ message: "Server error", error });
    }
});
exports.getEmployeeDetails = getEmployeeDetails;
const addVisitor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { clientName, clientPhoneNumber, clientAddress, visitDateTime, purpose, feedback, } = req.body;
        const user = yield user_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const newVisitor = new visitor_1.default({
            clientName,
            clientPhoneNumber,
            clientAddress,
            visitDateTime,
            purpose,
            feedback,
            visitedBy: userId,
        });
        const savedVisitor = yield newVisitor.save();
        user.visitors = user.visitors || [];
        user.visitors.push(savedVisitor._id);
        yield user.save();
        return res.status(201).json({
            message: "Visitor added successfully",
            visitor: savedVisitor,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
});
exports.addVisitor = addVisitor;
const getVisitors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const visitors = yield visitor_1.default.find({ visitedBy: userId })
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
            addedBy: visitor.visitedBy.name,
        }));
        res.status(200).json({ visitorDetails });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
});
exports.getVisitors = getVisitors;
const processExcelAndCreateLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileUrl, employeeId } = req.body;
        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: "File URL is required",
            });
        }
        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }
        const userId = req.userId;
        const requester = yield user_1.default.findById(userId);
        if (!requester || !["hr", "admin"].includes(requester.role)) {
            return res.status(403).json({
                message: "Access denied. Only HR and admin can add leads.",
            });
        }
        const response = yield axios_1.default.get(fileUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data);
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Excel file is empty",
            });
        }
        const firstRow = data[0];
        const missingHeaders = Object.keys(healper_1.headerMapping).filter((header) => !(header in firstRow));
        if (missingHeaders.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Excel format. Missing headers: " + missingHeaders.join(", "),
            });
        }
        const leads = [];
        const invalidRows = [];
        const errors = [];
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;
            if (!(0, healper_1.validateLeadData)(row)) {
                invalidRows.push({
                    row: rowNumber,
                    reason: "Missing or invalid data",
                });
                continue;
            }
            try {
                const lead = (0, healper_1.convertRowToLead)(row, employeeId);
                leads.push(lead);
            }
            catch (error) {
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
                message: "No valid leads found in the Excel file",
                invalidRows,
                errors,
            });
        }
        const session = yield lead_1.default.startSession();
        try {
            session.startTransaction();
            const savedLeads = yield lead_1.default.insertMany(leads, { session });
            yield user_1.default.findByIdAndUpdate(employeeId, {
                $push: {
                    leads: {
                        $each: savedLeads.map((lead) => lead._id),
                    },
                },
            }, { session });
            yield session.commitTransaction();
            return res.status(200).json({
                success: true,
                message: `Successfully processed ${leads.length} leads`,
                totalRows: data.length,
                successfulRows: leads.length,
                invalidRows: invalidRows.length > 0 ? invalidRows : undefined,
                errors: errors.length > 0 ? errors : undefined,
            });
        }
        catch (error) {
            yield session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    catch (error) {
        console.error("Error processing Excel file:", error);
        return res.status(500).json({
            success: false,
            message: "Error processing Excel file",
            error: error,
        });
    }
});
exports.processExcelAndCreateLeads = processExcelAndCreateLeads;
const getLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.userId;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }
        const user = yield user_1.default.findById(userId).populate({
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
        const formattedLeads = (_a = user === null || user === void 0 ? void 0 : user.leads) === null || _a === void 0 ? void 0 : _a.map((lead) => ({
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
    }
    catch (error) {
        console.error("Error fetching leads:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching leads",
            error: error,
        });
    }
});
exports.getLeads = getLeads;
