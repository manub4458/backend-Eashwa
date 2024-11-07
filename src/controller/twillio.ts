import { Request, Response } from "express";
import twilio from "twilio";
import { getFormattedDate } from "../utils/emailer";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const submitRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, productDescription, vendorName, userPhoneNumber, amount } =
    req.body;
  const time = getFormattedDate();
  const contentVariables: { [key: string]: string } = {
    "1": name,
    "2": productDescription,
    "3": vendorName,
    "4": time,
    "5": `₹${amount}`,
  };

  try {
    await client.messages.create({
      from: "whatsapp:+919911130173",
      to: `whatsapp:+918077335703`,
      contentSid: "HX0d74e16f4926ca40451faa795b3267ea",
      //@ts-ignore
      contentVariables: contentVariables,
    });

    res.status(200).json({ success: true, message: "Request sent to admin." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to send message.", error });
  }
};

export const whatsappWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const messageFromAdmin = req.body.Body ? req.body.Body.toLowerCase() : "";
  const userPhoneNumber = `whatsapp:${req.body.userPhoneNumber}`;
  console.log("Incoming Webhook Body:", req.body);
  try {
    if (messageFromAdmin === "Accept") {
      await client.messages.create({
        from: "whatsapp:+919911130173",
        to: userPhoneNumber,
        body: `Your request has been accepted by Eashwa. Thank you for your patience.`,
      });

      res.status(200).send("<Response></Response>");
    } else if (messageFromAdmin === "Reject") {
      await client.messages.create({
        from: "whatsapp:+919911130173",
        to: "whatsapp:+918077335703",
        body: `The user has rejected the request. Please provide a reason for rejection.`,
      });

      res.status(200).send("<Response></Response>");
    } else if (messageFromAdmin.startsWith("reject reason:")) {
      const rejectionReason = messageFromAdmin
        .replace(/^reject reason:\s*/i, "")
        .trim();
      await client.messages.create({
        from: "whatsapp:+919911130173",
        to: userPhoneNumber,
        body: `Your request was rejected by Eashwa. Reason: ${rejectionReason}`,
      });

      res.status(200).send("<Response></Response>");
    } else {
      res.status(200).send("<Response></Response>");
    }
  } catch (error) {
    console.error("Error handling admin response:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process admin response." });
  }
};
