import twilio from "twilio";
import dotenv from "dotenv";
import { IOrder } from "../types";
import User from "../model/user";

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const TWILIO_WHATSAPP_FROM = "whatsapp:+919911130173";
const ACCOUNTS_WHATSAPP = "whatsapp:+919917108992";
const DISPATCH_WHATSAPP = "whatsapp:+916398156961";
const DEEPAK_WHATSAPP = "whatsapp:+919045099190";

export const sendAccountsVerificationNotification = async (
  order: IOrder
): Promise<string> => {
  const message = await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: ACCOUNTS_WHATSAPP,
    contentSid: "HX0349c1e22b81a9a073732ad6992613b2",
    contentVariables: JSON.stringify({
      "1": order.piNumber,
      "2": order.partyName,
      "3": order.showroomName,
      "4": order.location,
      "5": order.quantity.toString(),
      "6": order.totalAmount.toString(),
      "7": order.agentName,
      "8": order.amountReceived.toString(),
      "9": order.orderModel,
      "10": order.colorVariants,
      "11": order.batteryType,
      "12": order.deadline.toLocaleDateString(),
      "13": order.agentPhone,
      "14": order.dealerPhone,
      "15": order.piPdf,
    }),
  });
  return message.sid;
};

export const sendNotificationToUser = async (
  userId: any,
  messageBody: string,
  id: string
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user || !user.phone) return;
  const userWa = `whatsapp:+91${user.phone}`;
  await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: userWa,
    contentSid: id,
  });
};

export const sendDispatchNotification = async (
  order: IOrder
): Promise<void> => {
  const message = await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: DISPATCH_WHATSAPP,
    contentSid: "HX8b6fabf92c6edfbcc5d1dba2793bc80d",
    contentVariables: JSON.stringify({
      "1": order.orderId,
      "2": order.piNumber,
      "3": order.partyName,
      "4": order.showroomName,
      "5": order.location,
      "6": order.quantity.toString(),
      "7": order.totalAmount.toString(),
      "8": order.agentName,
      "9": order.amountReceived.toString(),
      "10": order.orderModel,
      "11": order.colorVariants,
      "12": order.batteryType,
      "13": order.deadline.toLocaleDateString(),
      "14": order.agentPhone,
      "15": order.dealerPhone,
      "16": order.piPdf,
    }),
  });
};

export const sendDeepakConfirmation = async (order: IOrder): Promise<void> => {
  const message = await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: DEEPAK_WHATSAPP,
    contentSid: "HX376339237760e253cb95476662771da2",
    contentVariables: JSON.stringify({
      "1": order.orderId,
      "2": order.driverNumber,
      "3": order.vehicleNumber,
    }),
  });
};

export const sendReminderToDispatch = async (order: IOrder): Promise<void> => {
  await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: DISPATCH_WHATSAPP,
    body: `Reminder: Order ${order.orderId} is past deadline and still pending.`,
  });
};
