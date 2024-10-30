import { Request, Response } from "express";
import twilio from "twilio";
import { getFormattedDate } from "../utils/emailer";
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


var phone = "0000000";

export const submitRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, productDescription, vendorName, userPhoneNumber, amount } =
    req.body;
  const time = getFormattedDate();
  phone = userPhoneNumber;
  console.log(process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN);
  try {
    await client.messages.create({
      from: "whatsapp:+14155238886", 
      to: `whatsapp:+918077335703`, 
      body: `Hey! Here are the information about the Order:\n\nName: ${name}\nProduct Description: ${productDescription}\nVendor Name : ${vendorName}\n Date: ${time}\n Amount: ₹${amount} \n\nReply with:\n- "accept" to accept\n- "reject: [reason]" to reject`,
    });

    res
      .status(200)
      .json({ success: true, message: "Request sent to admin in sandbox." });
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
  const userPhoneNumber = `whatsapp:${phone}`; 

  try {
    if (messageFromAdmin === "accept") {
      await client.messages.create({
        from: "whatsapp:+14155238886",
        to: userPhoneNumber,
        body: `Your request has been accepted by the Eashwa. Thank you for your patience.`,
      });

      res.status(200).send("<Response></Response>");
    } else if (messageFromAdmin.startsWith("reject:")) {
      const rejectionReason = messageFromAdmin.replace(/^reject:\s*/i, "");

      await client.messages.create({
        from: "whatsapp:+14155238886",
        to: userPhoneNumber,
        body: `Your request was rejected by the Eashwa. Reason: ${rejectionReason}`,
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
