import { Schema, model, Document } from "mongoose";
import { genSaltSync, hashSync } from "bcrypt";

type Role = "admin" | "employee" | "hr";

interface ITargetAchieved {
  battery: number;
  eRickshaw: number;
  scooty: number;
}

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  passwordResetToken: string;
  tokenExpire?: Date | null;
  isVerified?: boolean;
  address?: string;
  aadhaarNumber?: number;
  role?: Role;
  employeeId?: string;
  phone?: number;
  post?: string;
  joiningDate?: string;
  targetAchieved?: ITargetAchieved;
  profilePicture?: string;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  post: {
    type: String,
    default: "",
  },
  passwordResetToken: {
    type: String,
    default: "",
  },
  tokenExpire: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    default: "",
  },
  aadhaarNumber: {
    type: Number,
    default: null,
  },
  role: {
    type: String,
    enum: ["admin", "employee", "hr"],
    default: "employee",
  },
  employeeId: {
    type: String,
    default: "",
  },
  phone: {
    type: Number,
    default: null,
  },
  joiningDate: {
    type: String,
    default: "",
  },
  targetAchieved: {
    battery: {
      type: Number,
      default: 0,
    },
    eRickshaw: {
      type: Number,
      default: 0,
    },
    scooty: {
      type: Number,
      default: 0,
    },
  },
  profilePicture: {
    type: String,
    default: "",
  },
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password") && !user.isModified("passwordResetToken")) {
    return next();
  }
  const salt = genSaltSync(10);
  if (user.isModified("password")) {
    user.password = hashSync(user.password, salt);
  }
  if (user.isModified("passwordResetToken")) {
    user.passwordResetToken = hashSync(user.passwordResetToken, salt);
  }
  next();
});

const User = model<IUser>("User", userSchema);

export default User;
