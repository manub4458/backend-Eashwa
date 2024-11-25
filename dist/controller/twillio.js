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
const dotenv_1 = __importDefault(require("dotenv"));
const messageUser_1 = __importDefault(require("../model/messageUser"));
dotenv_1.default.config();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const submitRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, productDescription, vendorName, userPhoneNumber, amount, time } = req.body;
    try {
        const formResposne = yield client.messages.create({
            from: "whatsapp:+919911130173",
            to: `whatsapp:+918077335703`,
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
            to: `whatsapp:+917668612989`,
            contentSid: "HX0d74e16f4926ca40451faa795b3267ea",
            contentVariables: JSON.stringify({
                "1": name,
                "2": productDescription,
                "3": vendorName,
                "4": time,
                "5": amount,
            }),
        });
        const existingUser = yield messageUser_1.default.findOne({ whatsappNumber: userPhoneNumber });
        if (existingUser) {
            const updatedUser = yield messageUser_1.default.updateOne({ whatsappNumber: userPhoneNumber }, {
                $set: {
                    messageId: formResposne.sid,
                    secondMessageId: secondResponse.sid,
                    name,
                    productDescription,
                    vendorName,
                    amount,
                    time
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
                time
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
    let messageWhatsapp = yield messageUser_1.default.findOne({ messageId: body.OriginalRepliedMessageSid });
    if (messageWhatsapp === null) {
        messageWhatsapp = yield messageUser_1.default.findOne({ secondMessageId: body.OriginalRepliedMessageSid });
    }
    try {
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
                })
            });
            yield client.messages.create({
                from: "whatsapp:+919911130173",
                //@ts-ignore
                to: `whatsapp:+918979456475`,
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
                })
            });
            if (req.body.From === "whatsapp:+918077335703") {
                yield client.messages.create({
                    from: "whatsapp:+919911130173",
                    //@ts-ignore
                    to: `whatsapp:+917668612989`,
                    contentSid: "HXb5947d790365975417f2bcc62852ab88",
                });
            }
            else if (req.body.From === "whatsapp:+917668612989") {
                yield client.messages.create({
                    from: "whatsapp:+919911130173",
                    //@ts-ignore
                    to: `whatsapp:+918077335703`,
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
                })
            });
            if (req.body.From === "whatsapp:+918077335703") {
                yield client.messages.create({
                    from: "whatsapp:+919911130173",
                    //@ts-ignore
                    to: `whatsapp:+917668612989`,
                    contentSid: "HXbc0d42ac7ebeac2c22ca5dc2aba4577a",
                    contentVariables: JSON.stringify({
                        "1": rejectionReason
                    })
                });
            }
            else if (req.body.From === "whatsapp:+917668612989") {
                yield client.messages.create({
                    from: "whatsapp:+919911130173",
                    //@ts-ignore
                    to: `whatsapp:+918077335703`,
                    contentSid: "HXbc0d42ac7ebeac2c22ca5dc2aba4577a",
                    contentVariables: JSON.stringify({
                        "1": rejectionReason
                    })
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
