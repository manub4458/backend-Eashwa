import {Schema, model, Document } from "mongoose";
import { genSaltSync, hashSync } from "bcrypt";

interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    passwordResetToken: string;
    tokenExpire?: Date | null;
    isVerified?: boolean;
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
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false,
    }

})

userSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password') && !user.isModified('passwordResetToken')) { return next(); }
    const salt =  genSaltSync(10);
    user.password = hashSync(user.password, salt);
    user.passwordResetToken = hashSync(user.passwordResetToken, salt);
    next();
});

const User = model('User', userSchema);

export default User;
