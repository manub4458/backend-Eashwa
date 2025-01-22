import { Document } from "mongoose";

export type Role = "admin" | "employee" | "hr";

export interface TargetAchieved {
  total: number;
  pending: number;
  completed: number;
}

export interface ITargetAchieved {
  battery?: TargetAchieved;
  eRickshaw?: TargetAchieved;
  scooty?: TargetAchieved;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  passwordResetToken: string;
  tokenExpire?: Date | null;
  isVerified?: boolean;
  address?: string;
  aadhaarNumber?: number;
  role: Role;
  employeeId?: string;
  phone?: number;
  post?: string;
  joiningDate?: string;
  targetAchieved?: ITargetAchieved;
  profilePicture?: string;
}

export interface mUser extends Document {
  name: string;
  messageId:string;
  whatsappNumber:string;
  secondMessageId:string;
  productDescription:string;
  vendorName:string;
  amount:string;
  time:string;
}