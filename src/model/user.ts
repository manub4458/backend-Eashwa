import { Schema, model, Document } from "mongoose";
import { genSaltSync, hashSync } from "bcrypt";

interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    passwordResetToken: string;
    tokenExpire?: Date | null;
    isVerified?: boolean;
    address?: string;
    aadhaarNumber?: number;
    role?: string;
    employeeId?: string;
    phone?: number;
    joiningDate?: string;
    targetAchieved?: string;
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
    passwordResetToken: {
        type: String,
        default: '',
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
        default: '',
    },
    aadhaarNumber: {
        type: Number,
        default: null,
    },
    role: {
        type: String,
        default: 'user',
    },
    employeeId: {
        type: String,
        default: '',
    },
    phone: {
        type: Number,
        default: null,
    },
    joiningDate: {
        type: String,
        default: '',
    },
    targetAchieved: {
        type: String,
        default: '',
    },
    profilePicture: {
        type: String,
        default: '',
    },
});

userSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password') && !user.isModified('passwordResetToken')) {
        return next();
    }
    const salt = genSaltSync(10);
    if (user.isModified('password')) {
        user.password = hashSync(user.password, salt);
    }
    if (user.isModified('passwordResetToken')) {
        user.passwordResetToken = hashSync(user.passwordResetToken, salt);
    }
    next();
});

const User = model<IUser>('User', userSchema);

export default User;
