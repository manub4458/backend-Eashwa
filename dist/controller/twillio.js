"use strict";
// import { Request, Response } from "express";
// import twilio from "twilio";
// import { getFormattedDate } from "../utils/emailer";
// import dotenv from "dotenv";
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
// dotenv.config();
// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );
// export const submitRequest = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const { name, productDescription, vendorName, userPhoneNumber, amount } =
//     req.body;
//   const time = getFormattedDate();
//   const contentVariables: { [key: string]: string } = {
//     "1": name,
//     "2": productDescription,
//     "3": vendorName,
//     "4": time,
//     "5": `₹${amount}`,
//   };
//   try {
//     await client.messages.create({
//       from: "whatsapp:+919911130173",
//       to: `whatsapp:+918791966851`,
//       contentSid: "HX0d74e16f4926ca40451faa795b3267ea",
//@ts-ignore
//       contentVariables: contentVariables,
//     });
//     res.status(200).json({ success: true, message: "Request sent to admin." });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to send message.", error });
//   }
// };
// export const whatsappWebhook = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const messageFromAdmin = req.body.Body ? req.body.Body.toLowerCase() : "";
//   const userPhoneNumber = `whatsapp:${req.body.From}`;
//   console.log("Incoming Webhook Body:", req.body);
//   var reason = "";
//   const contentVariables: { [key: string]: string } = {
//     "1": reason,
//   };
//   try {
//     if (messageFromAdmin === "accept") {
//       await client.messages.create({
//         from: "whatsapp:+919911130173",
//           to: `whatsapp:+918218698921`,
//         contentSid:"HXb5947d790365975417f2bcc62852ab88",
//       });
//       res.status(200).send("<Response></Response>");
//     } 
//     else if (messageFromAdmin === "reject") {
//       await client.messages.create({
//         from: "whatsapp:+919911130173",
//           to: `whatsapp:+918791966851`,
//         contentSid:"HXc4e1cf97fcc0a1434c8154b59aa99b9a",
//       });
//       res.status(200).send("<Response></Response>");
//     } 
//     else if (messageFromAdmin.startsWith("reject reason:")) {
//       const rejectionReason = messageFromAdmin
//         .replace(/^reject reason:\s*/i, "")
//         .trim();
//       contentVariables["1"] = rejectionReason;
//       await client.messages.create({
//         from: "whatsapp:+919911130173",
//         to: `whatsapp:+918218698921`,
//         contentSid:"HXbc0d42ac7ebeac2c22ca5dc2aba4577a",
//@ts-ignore
//         contentVariables:contentVariables
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
// Import necessary modules and types
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const twilio_1 = __importDefault(require("twilio"));
const emailer_1 = require("../utils/emailer"); // Ensure this is correctly imported
dotenv_1.default.config();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// Initialize Express
const app = (0, express_1.default)();
// Middleware to parse JSON
app.use(express_1.default.json());
// `submitRequest` endpoint
const submitRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received data:", req.body); // Log incoming data for troubleshooting
    const { name, productDescription, vendorName, userPhoneNumber, amount } = req.body;
    // Validate data
    if (!name || !productDescription || !vendorName || !userPhoneNumber || !amount) {
        res.status(400).json({ success: false, message: "Incomplete data" });
        return;
    }
    const time = (0, emailer_1.getFormattedDate)();
    const contentVariables = {
        "1": name,
        "2": productDescription,
        "3": vendorName,
        "4": time,
        "5": `₹${amount}`,
    };
    try {
        // Send message using Twilio
        yield client.messages.create({
            from: "whatsapp:+919911130173",
            to: `whatsapp:+918791966851`,
            contentSid: "HX0d74e16f4926ca40451faa795b3267ea",
            //@ts-ignore
            contentVariables,
        });
        res.status(200).json({ success: true, message: "Request sent to admin." });
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ success: false, message: "Failed to send message.", error });
    }
});
exports.submitRequest = submitRequest;
// `whatsappWebhook` endpoint
const whatsappWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messageFromAdmin = req.body.Body ? req.body.Body.toLowerCase() : "";
    const userPhoneNumber = `whatsapp:${req.body.From}`;
    console.log("Incoming Webhook Body:", req.body);
    let reason = "";
    const contentVariables = { "1": reason };
    try {
        if (messageFromAdmin === "accept") {
            yield client.messages.create({
                from: "whatsapp:+919911130173",
                to: `whatsapp:+918218698921`,
                contentSid: "HXb5947d790365975417f2bcc62852ab88",
            });
            res.status(200).send("<Response></Response>");
        }
        else if (messageFromAdmin === "reject") {
            yield client.messages.create({
                from: "whatsapp:+919911130173",
                to: `whatsapp:+918791966851`,
                contentSid: "HXc4e1cf97fcc0a1434c8154b59aa99b9a",
            });
            res.status(200).send("<Response></Response>");
        }
        else if (messageFromAdmin.startsWith("reject reason:")) {
            const rejectionReason = messageFromAdmin.replace(/^reject reason:\s*/i, "").trim();
            contentVariables["1"] = rejectionReason;
            yield client.messages.create({
                from: "whatsapp:+919911130173",
                to: `whatsapp:+918218698921`,
                contentSid: "HXbc0d42ac7ebeac2c22ca5dc2aba4577a",
                //@ts-ignore
                contentVariables,
            });
            res.status(200).send("<Response></Response>");
        }
        else {
            res.status(200).send("<Response></Response>");
        }
    }
    catch (error) {
        console.error("Error handling admin response:", error);
        res.status(500).json({ success: false, message: "Failed to process admin response." });
    }
});
exports.whatsappWebhook = whatsappWebhook;
// Start the Express server
app.listen(5000, () => {
    console.log("Server running on port 5000");
});
