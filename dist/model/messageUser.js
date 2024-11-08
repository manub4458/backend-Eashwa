"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageUserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    messageId: {
        type: String,
        required: true,
    },
    whatsappNumber: {
        type: String,
        required: true,
    },
});
const messageUser = (0, mongoose_1.model)('User', messageUserSchema);
exports.default = messageUser;
