import { Request, Response } from "express";
import twilio from "twilio";
import dotenv from "dotenv";
import messageUser from "../model/messageUser";

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const submitRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, productDescription, vendorName, userPhoneNumber, amount, time } =
    req.body;

  try {
    const formResposne = await client.messages.create({
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
    await client.messages.create({
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
    const existingUser = await messageUser.findOne({ whatsappNumber: userPhoneNumber });
    if (existingUser) {
      const updatedUser = await messageUser.updateOne(
        { whatsappNumber: userPhoneNumber },
        {
          $set: {
            messageId: formResposne.sid,
            name,
          },
        }
      );
      console.log("whatsapp user updated", updatedUser)
    } else {
      const newMessage = new messageUser({
        name,
        messageId: formResposne.sid,
        whatsappNumber: userPhoneNumber
      });
      await newMessage.save();

    }

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
  const body = req.body;
  const messageWhatsapp : typeof messageUser | null = await messageUser.findOne({ messageId: body.OriginalRepliedMessageSid });
  console.log("ss", req.body);
  try {
    if (messageFromAdmin === "accept") {
      await client.messages.create({
        from: "whatsapp:+919911130173",
        //@ts-ignore
        to: `whatsapp:${messageWhatsapp.whatsappNumber}`,
        contentSid: "HXb5947d790365975417f2bcc62852ab88",
      });

      if(req.body.From ==="whatsapp:+918077335703"){
        await client.messages.create({
          from: "whatsapp:+919911130173",
          //@ts-ignore
          to: `whatsapp:+917668612989`,
          contentSid: "HXb5947d790365975417f2bcc62852ab88",
        });
      }else if(req.body.From ==="whatsapp:+917668612989"){
        await client.messages.create({
          from: "whatsapp:+919911130173",
          //@ts-ignore
          to: `whatsapp:+918077335703`,
          contentSid: "HXb5947d790365975417f2bcc62852ab88",
        });
      }


      res.status(200).send("<Response></Response>");
    }
    else if (messageFromAdmin === "reject") {
      await client.messages.create({
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
      await client.messages.create({
        from: "whatsapp:+919911130173",
        //@ts-ignore
        to: `whatsapp:${messageWhatsapp.whatsappNumber}`,
        contentSid: "HXbc0d42ac7ebeac2c22ca5dc2aba4577a",
        contentVariables: JSON.stringify({
          "1": rejectionReason
        })
      });

      if(req.body.From ==="whatsapp:+918077335703"){
        await client.messages.create({
          from: "whatsapp:+919911130173",
          //@ts-ignore
          to: `whatsapp:+917668612989`,
          contentSid: "HXbc0d42ac7ebeac2c22ca5dc2aba4577a",
          contentVariables: JSON.stringify({
            "1": rejectionReason
          })
        });
      }else if(req.body.From ==="whatsapp:+917668612989"){
        await client.messages.create({
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

