import { Request, Response } from "express";
import twilio from "twilio";
import { getFormattedDate } from "../utils/emailer";

const client = twilio(
  "ACc03a2fcf7c68a2969352289d6042b5fb",
  "d43a11b9dfa73a5c85761c24202f1553"
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
