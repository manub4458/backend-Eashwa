import {Schema, model, Document } from "mongoose";

interface mUser extends Document {
    name: string;
    messageId:string;
    whatsappNumber:string;
    secondMessageId:string;
    productDescription:string;
    vendorName:string;
    amount:string;
    time:string;
  }

const messageUserSchema = new Schema<mUser>({
    name: {
        type: String,
        required: true,
    },
    messageId: {
        type: String,
        required: true,
    },
    productDescription: {
        type: String,
        required: true,
    },
    vendorName: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    secondMessageId: {
        type: String,
        required: true,
    },
    whatsappNumber: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },

})

const messageUser = model('MessageUser', messageUserSchema);

export default messageUser;
