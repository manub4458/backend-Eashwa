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
const submitRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, productDescription, vendorName, userPhoneNumber, amount } = req.body;
    const time = (0, emailer_1.getFormattedDate)();
    const contentVariables = {
        "1": name,
        "2": productDescription,
        "3": vendorName,
        "4": time,
        "5": `₹${amount}`,
    };
    try {
        yield client.messages.create({
            from: "whatsapp:+919911130173",
            to: `whatsapp:+918077335703`,
            contentSid: "HX0d74e16f4926ca40451faa795b3267ea",
            //@ts-ignore
            contentVariables: contentVariables,
        });
        res.status(200).json({ success: true, message: "Request sent to admin." });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Failed to send message.", error });
    }
});
exports.submitRequest = submitRequest;
// export const whatsappWebhook = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const messageFromAdmin = req.body.Body ? req.body.Body.toLowerCase() : "";
//   const userPhoneNumber = `whatsapp:${req.body.From}`;
//   console.log("Incoming Webhook Body:", req.body);
//   try {
//     if (messageFromAdmin === "Accept") {
//       await client.messages.create({
//         from: "whatsapp:+919911130173",
//         to: userPhoneNumber,
//         body: `Your request has been accepted by Eashwa. Thank you for your patience.`,
//       });
//       res.status(200).send("<Response></Response>");
//     } else if (messageFromAdmin === "Reject") {
//       await client.messages.create({
//         from: "whatsapp:+919911130173",
//         to: "whatsapp:+918077335703",
//         body: `The user has rejected the request. Please provide a reason for rejection.`,
//       });
//       res.status(200).send("<Response></Response>");
//     } else if (messageFromAdmin.startsWith("reject reason:")) {
//       const rejectionReason = messageFromAdmin
//         .replace(/^reject reason:\s*/i, "")
//         .trim();
//       await client.messages.create({
//         from: "whatsapp:+919911130173",
//         to: userPhoneNumber,
//         body: `Your request was rejected by Eashwa. Reason: ${rejectionReason}`,
//       });
//       res.status(200).send("<Response></Response>");
//     } else {
//       res.status(200).send("<Response></Response>");
//     }
//   } catch (error) {
//     console.error("Error handling admin response:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to process admin response." });
//   }
// };
const whatsappWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messageFromAdmin = req.body.Body ? req.body.Body.toLowerCase() : "";
    const userPhoneNumber = `whatsapp:+917668612989`;
    console.log("ss", req.body);
    try {
        if (messageFromAdmin === "accept") {
            yield client.messages.create({
                from: "whatsapp:+919911130173",
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
