import { Schema, model, Types } from "mongoose";
import { genSaltSync, hashSync } from "bcrypt";
import { IUser, TargetAchieved } from "../types";

// Schema for historical target data
const targetAchievedHistorySchema = new Schema({
  month: {
    type: String, // e.g., "2025-04" (YYYY-MM format)
    required: true,
  },
  total: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Number,
    default: 0,
  },
  pending: {
    type: Number,
    default: 0,
  },
});

// Existing targetAchievedSchema for current targets (optional)
const targetAchievedSchema = new Schema<TargetAchieved>({
  total: {
    type: Number,
    default: 0,
  },
  pending: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Number,
    default: 0,
  },
});

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
    required: true,
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
      current: {
        type: targetAchievedSchema,
        default: () => ({}),
      },
      history: [targetAchievedHistorySchema],
    },
    eRickshaw: {
      current: {
        type: targetAchievedSchema,
        default: () => ({}),
      },
      history: [targetAchievedHistorySchema],
    },
    scooty: {
      current: {
        type: targetAchievedSchema,
        default: () => ({}),
      },
      history: [targetAchievedHistorySchema],
    },
  },
  profilePicture: {
    type: String,
    default: "",
  },
  visitors: [
    {
      type: Types.ObjectId,
      ref: "Visitor",
    },
  ],
  leads: [
    {
      type: Types.ObjectId,
      ref: "Lead",
    },
  ],
  targetLeads: [{ type: Types.ObjectId, ref: "Lead" }],
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
