"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const dotenv_1 = __importDefault(require("dotenv"));
const messageUser_1 = __importDefault(require("../model/messageUser"));
const orderService = __importStar(require("../services/orderService"));
const notificationService = __importStar(require("../services/notificationService"));
dotenv_1.default.config();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const submitRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, productDescription, vendorName, userPhoneNumber, amount, time, } = req.body;
    try {
        const formResposne = yield client.messages.create({
            from: "whatsapp:+919911130173",
            to: `whatsapp:+917723866666`,
            contentSid: "HX0d74e16f4926ca40451faa795b3267ea",
            contentVariables: JSON.stringify({
                "1": name,
                "2": productDescription,
                "3": vendorName,
                "4": time,
                "5": amount,
            }),
        });
        const secondResponse = yield client.messages.create({
            from: "whatsapp:+919911130173",
            to: `whatsapp:+919990148011`,
            contentSid: "HX0d74e16f4926ca40451faa795b3267ea",
            contentVariables: JSON.stringify({
                "1": name,
                "2": productDescription,
                "3": vendorName,
                "4": time,
                "5": amount,
            }),
        });
        const existingUser = yield messageUser_1.default.findOne({
            whatsappNumber: userPhoneNumber,
        });
        if (existingUser) {
            const updatedUser = yield messageUser_1.default.updateOne({ whatsappNumber: userPhoneNumber }, {
                $set: {
                    messageId: formResposne.sid,
                    secondMessageId: secondResponse.sid,
                    name,
                    productDescription,
                    vendorName,
                    amount,
                    time,
                },
            });
        }
        else {
            const newMessage = new messageUser_1.default({
                name,
                messageId: formResposne.sid,
                secondMessageId: secondResponse.sid,
                whatsappNumber: userPhoneNumber,
                productDescription,
                vendorName,
                amount,
                time,
            });
            yield newMessage.save();
        }
        res.status(200).json({ success: true, message: "Request sent to admin." });
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
    const body = req.body;
    const reply = body.Body ? body.Body.toLowerCase().trim() : "";
    const repliedSid = body.OriginalRepliedMessageSid;
    try {
        const order = yield orderService.findOrderBySid(repliedSid);
        if (order && (reply === "received" || reply === "not received")) {
            if (reply === "received") {
                const orderId = `ORD-${Date.now()}`;
                //@ts-ignore
                const updatedOrder = yield orderService.updateOrder(order._id, {
                    status: "ready_for_dispatch",
                    orderId,
                });
                yield notificationService.sendNotificationToUser(order.submittedBy, "Your payment has been received.", "HX1449433d60e7fe1ddfbb333486d928cf");
                if (updatedOrder) {
                    yield notificationService.sendDispatchNotification(updatedOrder);
                }
            }
            else if (reply === "not received") {
                //@ts-ignore
                yield orderService.updateOrder(order._id, {
                    status: "payment_not_received",
                });
                yield notificationService.sendNotificationToUser(order.submittedBy.toString(), "Payment not received. Please check with Accounts Department.", "HX17353f91b0a16019c35b353c2ff19fa2");
            }
            res.send("<Response></Response>");
            return;
        }
        let messageWhatsapp = yield messageUser_1.default.findOne({
            messageId: body.OriginalRepliedMessageSid,
        });
        if (messageWhatsapp === null) {
            messageWhatsapp = yield messageUser_1.default.findOne({
                secondMessageId: body.OriginalRepliedMessageSid,
            });
        }
        // let messageWhatsapp = await messageUser.findOne({ messageId: repliedSid });
        // if (!messageWhatsapp) {
        //   messageWhatsapp = await messageUser.findOne({
        //     secondMessageId: repliedSid,
        //   });
        // }
        if (messageFromAdmin === "accept") {
            yield client.messages.create({
                from: "whatsapp:+919911130173",
                //@ts-ignore
                to: `whatsapp:${messageWhatsapp.whatsappNumber}`,
                contentSid: "HXf2dd29e93e8f5588d14f3a1c75fc5391",
                contentVariables: JSON.stringify({
                    "1": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.name,
                    //@ts-ignore
                    "2": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.productDescription,
                    //@ts-ignore
                    "3": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.vendorName,
                    //@ts-ignore
                    "4": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.time,
                    //@ts-ignore
                    "5": `₹${messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.amount}`,
                }),
            });
            yield client.messages.create({
                from: "whatsapp:+919911130173",
                //@ts-ignore
                to: `whatsapp:+919411654217`,
                contentSid: "HXc92a36fb628d717d8505d7c6a9669781",
                contentVariables: JSON.stringify({
                    "1": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.name,
                    //@ts-ignore
                    "2": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.productDescription,
                    //@ts-ignore
                    "3": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.vendorName,
                    //@ts-ignore
                    "4": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.time,
                    //@ts-ignore
                    "5": `₹${messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.amount}`,
                }),
            });
            if (req.body.From === "whatsapp:+917723866666") {
                yield client.messages.create({
                    from: "whatsapp:+919911130173",
                    //@ts-ignore
                    to: `whatsapp:+919990148011`,
                    contentSid: "HXb5947d790365975417f2bcc62852ab88",
                });
            }
            else if (req.body.From === "whatsapp:+919990148011") {
                yield client.messages.create({
                    from: "whatsapp:+919911130173",
                    //@ts-ignore
                    to: `whatsapp:+917723866666`,
                    contentSid: "HXb5947d790365975417f2bcc62852ab88",
                });
            }
            res.status(200).send("<Response></Response>");
        }
        else if (messageFromAdmin === "reject") {
            yield client.messages.create({
                from: "whatsapp:+919911130173",
                to: `${req.body.From}`,
                contentSid: "HXc4e1cf97fcc0a1434c8154b59aa99b9a",
            });
            res.status(200).send("<Response></Response>");
        }
        else if (messageFromAdmin.startsWith("reason:")) {
            const rejectionReason = messageFromAdmin
                .replace(/^reason:\s*/i, "")
                .trim();
            yield client.messages.create({
                from: "whatsapp:+919911130173",
                //@ts-ignore
                to: `whatsapp:${messageWhatsapp.whatsappNumber}`,
                contentSid: "HX1d9067b37433fd2e8b5b8af4a2a09e12",
                contentVariables: JSON.stringify({
                    "1": rejectionReason,
                    "2": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.name,
                    //@ts-ignore
                    "3": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.productDescription,
                    //@ts-ignore
                    "4": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.vendorName,
                    //@ts-ignore
                    "5": messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.time,
                    //@ts-ignore
                    "6": `₹${messageWhatsapp === null || messageWhatsapp === void 0 ? void 0 : messageWhatsapp.amount}`,
                }),
            });
            if (req.body.From === "whatsapp:+917723866666") {
                yield client.messages.create({
                    from: "whatsapp:+919911130173",
                    //@ts-ignore
                    to: `whatsapp:+919990148011`,
                    contentSid: "HXbc0d42ac7ebeac2c22ca5dc2aba4577a",
                    contentVariables: JSON.stringify({
                        "1": rejectionReason,
                    }),
                });
            }
            else if (req.body.From === "whatsapp:+919990148011") {
                yield client.messages.create({
                    from: "whatsapp:+919911130173",
                    //@ts-ignore
                    to: `whatsapp:+917723866666`,
                    contentSid: "HXbc0d42ac7ebeac2c22ca5dc2aba4577a",
                    contentVariables: JSON.stringify({
                        "1": rejectionReason,
                    }),
                });
            }
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
// export const webhook = async (req: Request, res: Response): Promise<void> => {
//   const body = req.body;
//   const reply = body.Body ? body.Body.toLowerCase().trim() : "";
//   const repliedSid = body.OriginalRepliedMessageSid;
//   if (!repliedSid || !reply) {
//     res.send("<Response></Response>");
//     return;
//   }
//   try {
//     const order = await orderService.findOrderBySid(repliedSid);
//     if (!order) {
//       res.send("<Response></Response>");
//       return;
//     }
//     if (reply === "received") {
//       const orderId = `ORD-${Date.now()}`;
//       //@ts-ignore
//       const updatedOrder = await orderService.updateOrder(order._id, {
//         status: "ready_for_dispatch",
//         orderId,
//       });
//       await notificationService.sendNotificationToUser(
//         order.submittedBy.toString(),
//         "Your payment has been received."
//       );
//       if (updatedOrder) {
//         await notificationService.sendDispatchNotification(updatedOrder);
//       }
//     } else if (reply === "not received") {
//       //@ts-ignore
//       await orderService.updateOrder(order._id, {
//         status: "payment_not_received",
//       });
//       await notificationService.sendNotificationToUser(
//         order.submittedBy.toString(),
//         "Payment not received. Please check with Accounts Department."
//       );
//     }
//     res.send("<Response></Response>");
//   } catch (error) {
//     console.error("Webhook error:", error);
//     res.status(500).send("<Response></Response>");
//   }
// };
