"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt_1 = require("bcrypt");
const targetAchievedSchema = new mongoose_1.Schema({
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
const userSchema = new mongoose_1.Schema({
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
            type: targetAchievedSchema,
            default: () => ({}),
        },
        eRickshaw: {
            type: targetAchievedSchema,
            default: () => ({}),
        },
        scooty: {
            type: targetAchievedSchema,
            default: () => ({}),
        },
    },
    profilePicture: {
        type: String,
        default: "",
    },
});
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        if (!user.isModified("password") && !user.isModified("passwordResetToken")) {
            return next();
        }
        const salt = (0, bcrypt_1.genSaltSync)(10);
        if (user.isModified("password")) {
            user.password = (0, bcrypt_1.hashSync)(user.password, salt);
        }
        if (user.isModified("passwordResetToken")) {
            user.passwordResetToken = (0, bcrypt_1.hashSync)(user.passwordResetToken, salt);
        }
        next();
    });
});
const User = (0, mongoose_1.model)("User", userSchema);
exports.default = User;
