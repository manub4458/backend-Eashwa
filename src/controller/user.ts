import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { compareSync } from "bcrypt";
import User from "../model/user";
import { authenticator } from "otplib";
import { sendMail } from "../utils/emailer";
import { ITargetAchieved, TargetAchieved } from "../types";



export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, address, aadhaarNumber, role, employeeId, phone, joiningDate, targetAchieved, profilePicture,post } = req.body;
    const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const pass: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/;

    if(!role){
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
      address, aadhaarNumber, role, employeeId, phone, joiningDate, targetAchieved, profilePicture,post
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
        message: "Email/Employee ID and password are required"
      });
    }

    const user = await User.findOne({
      $or: [
        { email: userName },
        { employeeId: userName }
      ]
    });

    if (!user) {
      return res.status(409).json({
        message: "User doesn't exist"
      });
    }

    const isMatch = compareSync(password, user.password);
    if (!isMatch) {
      return res.status(409).json({
        message: "Invalid credentials"
      });
    }

    const authToken = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET_KEY || " ", 
      { expiresIn: '30m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_REFRESH_SECRET_KEY || " ", 
      { expiresIn: '2h' }
    );

    res.cookie('authToken', authToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.header('Authorization', `Bearer ${authToken}`);

    res.status(200).json({ 
      ok: true, 
      message: "User login successful",  
      user: user, 
      authToken: authToken 
    });
    
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User with this email does not exist" });
    }

    const otp = authenticator.generateSecret().slice(0, 6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetToken = otp;
    user.tokenExpire = otpExpiry;
    await user.save();

    sendMail(user.email, "Password Reset OTP", `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`)
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
      return res.status(400).json({ message: "User with this email does not exist" });
    }

    if (user.passwordResetToken.length === 0 || (user.tokenExpire && user.tokenExpire < new Date())) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const isMatch = compareSync(otp, user.passwordResetToken);

    if (!isMatch) {
      return res.status(409).json({
        message: "Invalid otp"
      })
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
      return res.status(400).json({ message: "User with this email does not exist" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "User is not verified. Please verify the OTP first." });
    }
    user.password = newPassword;
    user.passwordResetToken = '';
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
      return res.status(403).json({ message: 'Forbidden: User not found' });
    }
    if (!['hr', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const query = user.role === 'admin' 
      ? { role: { $in: ['employee', 'hr'] } }  
      : { role: 'employee' };    

    const employees = await User.find(query).select('-password'); 
    res.status(200).json({ employees, requestingUser: user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { battery, eRickshaw, scooty } = req.body;

    const requesterId = (req as any).userId;
    const requester = await User.findById(requesterId);
    if (!requester || !['hr', 'admin'].includes(requester.role)) {
      return res.status(403).json({ message: "Access denied. Only HR and admin can update targets." });
    }

    if (!battery || !eRickshaw || !scooty) {
      return res.status(400).json({
        message: "All target fields (battery, eRickshaw, scooty) are required.",
      });
    }

    const validateTarget = (target: TargetAchieved) => {
      return target.total !== undefined && target.completed !== undefined;
    };

    if (!validateTarget(battery) || !validateTarget(eRickshaw) || !validateTarget(scooty)) {
      return res.status(400).json({
        message: "Each target must include both 'total' and 'completed' values.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const updateField = (newTarget: { total: number; completed: number }): TargetAchieved => {
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

    await user.save();

    res.status(200).json({
      message: "Target updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while updating the target.",
      error: error,
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
      const batteryPercentage = calculatePercentage(user.targetAchieved?.battery || { total: 0, completed: 0, pending: 0 });
      const eRickshawPercentage = calculatePercentage(user.targetAchieved?.eRickshaw || { total: 0, completed: 0, pending: 0 });
      const scootyPercentage = calculatePercentage(user.targetAchieved?.scooty || { total: 0, completed: 0, pending: 0 });

      const overallPercentage = (batteryPercentage + eRickshawPercentage + scootyPercentage) / 3;

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

    if (!requestingUser || !['hr', 'admin'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (requestingUser.role === 'hr' && user.role !== 'employee') {
      return res.status(403).json({ message: 'HR can only view employee details' });
    }

    res.status(200).json({ user });

  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    res.status(500).json({ message: 'Server error', error });
  }
};






