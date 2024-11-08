// import { Request, Response } from "express";
// import twilio from "twilio";
// import { getFormattedDate } from "../utils/emailer";
// import dotenv from "dotenv";

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
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import twilio from "twilio";
import { getFormattedDate } from "../utils/emailer"; // Ensure this is correctly imported

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Initialize Express
const app = express();

// Middleware to parse JSON
app.use(express.json());

// `submitRequest` endpoint
export const submitRequest = async (req: Request, res: Response) => {
  console.log("Received data:", req.body); // Log incoming data for troubleshooting

  const { name, productDescription, vendorName, userPhoneNumber, amount } = req.body;

  // Validate data
  if (!name || !productDescription || !vendorName || !userPhoneNumber || !amount) {
    res.status(400).json({ success: false, message: "Incomplete data" });
    return;
  }

  const time = getFormattedDate();
  const contentVariables = {
    "1": name,
    "2": productDescription,
    "3": vendorName,
    "4": time,
    "5": `₹${amount}`,
  };

  try {
    // Send message using Twilio
    await client.messages.create({
      from: "whatsapp:+919911130173",
      to: `whatsapp:+918791966851`,
      contentSid: "HX0d74e16f4926ca40451faa795b3267ea",
      //@ts-ignore
      contentVariables,
    });

    res.status(200).json({ success: true, message: "Request sent to admin." });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Failed to send message.", error });
  }
};

// `whatsappWebhook` endpoint
export const whatsappWebhook = async (req: Request, res: Response) => {
  const messageFromAdmin = req.body.Body ? req.body.Body.toLowerCase() : "";
  const userPhoneNumber = `whatsapp:${req.body.From}`;
  console.log("Incoming Webhook Body:", req.body);

  let reason = "";
  const contentVariables = { "1": reason };

  try {
    if (messageFromAdmin === "accept") {
      await client.messages.create({
        from: "whatsapp:+919911130173",
        to: `whatsapp:+918218698921`,
        contentSid: "HXb5947d790365975417f2bcc62852ab88",
      });

      res.status(200).send("<Response></Response>");
    } else if (messageFromAdmin === "reject") {
      await client.messages.create({
        from: "whatsapp:+919911130173",
        to: `whatsapp:+918791966851`,
        contentSid: "HXc4e1cf97fcc0a1434c8154b59aa99b9a",
      });

      res.status(200).send("<Response></Response>");
    } else if (messageFromAdmin.startsWith("reject reason:")) {
      const rejectionReason = messageFromAdmin.replace(/^reject reason:\s*/i, "").trim();
      contentVariables["1"] = rejectionReason;

      await client.messages.create({
        from: "whatsapp:+919911130173",
        to: `whatsapp:+918218698921`,
        contentSid: "HXbc0d42ac7ebeac2c22ca5dc2aba4577a",
        //@ts-ignore
        contentVariables,
      });

      res.status(200).send("<Response></Response>");
    } else {
      res.status(200).send("<Response></Response>");
    }
  } catch (error) {
    console.error("Error handling admin response:", error);
    res.status(500).json({ success: false, message: "Failed to process admin response." });
  }
};

// Start the Express server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
