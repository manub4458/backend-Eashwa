import { Document, Types } from "mongoose";

export type Role = "admin" | "employee" | "hr";

export interface TargetAchieved {
  total: number;
  pending: number;
  completed: number;
  history?: Array<{
    month: string;
    total: number;
    completed: number;
    pending: number;
  }>;
}

export interface ITargetAchieved {
  battery?: TargetAchieved;
  eRickshaw?: TargetAchieved;
  scooty?: TargetAchieved;
}

export interface IVisitor extends Document {
  clientName: string;
  clientPhoneNumber: number;
  clientAddress: string;
  visitDateTime: Date;
  purpose: string;
  feedback?: string;
  visitedBy?: Types.ObjectId;
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
  visitors?: Types.ObjectId[];
  leads?: Types.ObjectId[];
  targetLeads: {
    type: typeof Types.ObjectId;
    ref: string;
  }[];
}

export interface mUser extends Document {
  name: string;
  messageId: string;
  whatsappNumber: string;
  secondMessageId: string;
  productDescription: string;
  vendorName: string;
  amount: string;
  time: string;
}

export interface Ilead extends Document {
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
  leadBy?: Types.ObjectId;
  isTargetLead: {
    type: BooleanConstructor;
    default: false;
  };
}

export interface LeadType extends Document {
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
