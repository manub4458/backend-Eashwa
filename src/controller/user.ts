import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { compareSync } from "bcrypt";
import User from "../model/user";
import { authenticator } from "otplib";
import { sendMail } from "../utils/emailer";


export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, address, aadhaarNumber, role, employeeId, phone, joiningDate, targetAchieved, profilePicture,post } = req.body;
    const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const pass: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/;
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
    const { email, password } = req.body;
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(409).json({
        message: "User doesn't exist"
      })
    }

    const isMatch =  compareSync(password, user.password);
    if (!isMatch) {
      return res.status(409).json({
        message: "Invalid credentials"
      })
    }

    const authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY || " ", { expiresIn: '30m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET_KEY || " ", { expiresIn: '2h' });


    res.cookie('authToken', authToken, ({ httpOnly: true }));
    res.cookie('refreshToken', refreshToken, ({ httpOnly: true }));
    res.header('Authorization', `Bearer ${authToken}`);

    res.status(200).json({ ok: true, message: "User login successfully",  user:user, authToken: authToken });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Something went wrong"
    })
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
    const hr = (req as any);
    const user  = await User.findById(hr.userId);

    if (user && user.role !== 'hr') {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const employees = await User.find({ role: 'employee' }).select('-password'); 
    res.status(200).json({ employees, hr:user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { battery, eRickshaw, scooty } = req.body;

    const hrId = (req as any);
    const hr  = await User.findById(hrId.userId);

    if (hr && hr.role !== 'hr') {
      return res.status(403).json({ message: "Access denied. Only HR can update targets." });
    }

    if (battery === undefined || eRickshaw === undefined || scooty === undefined) {
      return res.status(400).json({ message: "All target fields (battery, eRickshaw, scooty) are required." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Employee not found." });
    }

    user.targetAchieved = {
      battery: battery ?? (user.targetAchieved?.battery || 0),
      eRickshaw: eRickshaw ?? (user.targetAchieved?.eRickshaw || 0),
      scooty: scooty ?? (user.targetAchieved?.scooty || 0),
    };

    await user.save();

    res.status(200).json({ message: "Target updated successfully.", user });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while updating the target.", error: error });
  }
};



