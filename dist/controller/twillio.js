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
exports.whatsappWebhook = exports.submitRequest = void 0;
const twilio_1 = __importDefault(require("twilio"));
const emailer_1 = require("../utils/emailer");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
var phone = "0000000";
const submitRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, productDescription, vendorName, userPhoneNumber, amount } = req.body;
    const time = (0, emailer_1.getFormattedDate)();
    phone = userPhoneNumber;
    console.log(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
        yield client.messages.create({
            from: "whatsapp:+14155238886",
            to: `whatsapp:+918077335703`,
            body: `Hey! Here are the information about the Order:\n\nName: ${name}\nProduct Description: ${productDescription}\nVendor Name : ${vendorName}\n Date: ${time}\n Amount: ₹${amount} \n\nReply with:\n- "accept" to accept\n- "reject: [reason]" to reject`,
        });
        res
            .status(200)
            .json({ success: true, message: "Request sent to admin in sandbox." });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Failed to send message.", error });
    }
});
exports.submitRequest = submitRequest;
const whatsappWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messageFromAdmin = req.body.Body ? req.body.Body.toLowerCase() : "";
    const userPhoneNumber = `whatsapp:${phone}`;
    try {
        if (messageFromAdmin === "accept") {
            yield client.messages.create({
                from: "whatsapp:+14155238886",
                to: userPhoneNumber,
                body: `Your request has been accepted by the Eashwa. Thank you for your patience.`,
            });
            res.status(200).send("<Response></Response>");
        }
        else if (messageFromAdmin.startsWith("reject:")) {
            const rejectionReason = messageFromAdmin.replace(/^reject:\s*/i, "");
            yield client.messages.create({
                from: "whatsapp:+14155238886",
                to: userPhoneNumber,
                body: `Your request was rejected by the Eashwa. Reason: ${rejectionReason}`,
            });
            res.status(200).send("<Response></Response>");
        }
        else {
            res.status(200).send("<Response></Response>");
        }
    }
    catch (error) {
        console.error("Error handling admin response:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to process admin response." });
    }
});
exports.whatsappWebhook = whatsappWebhook;
