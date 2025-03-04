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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
exports.getFormattedDate = getFormattedDate;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendMail = (email, mailSubject, body) => {
    const mailData = {
        from: {
            name: 'E-Ashwa',
            address: process.env.NODE_EMAIL
        },
        to: email,
        subject: mailSubject,
        text: body
    };
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODE_EMAIL,
            pass: process.env.NODEMAIL_PASS
        }
    });
    transporter.sendMail(mailData, (err, info) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            console.log(err);
            return false;
        }
        else {
            console.log("Mail sent");
            return true;
        }
    }));
    return true;
};
exports.sendMail = sendMail;
function getFormattedDate() {
    const date = new Date();
    const day = date.getDate();
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const daySuffix = (day) => {
        if (day > 3 && day < 21)
            return "th";
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };
    const formattedHour = hours % 12 || 12;
    const formattedMinute = minutes < 10 ? "0" + minutes : minutes.toString();
    return `${day}${daySuffix(day)} ${month} ${year}, ${formattedHour}:${formattedMinute} ${ampm}`;
}
