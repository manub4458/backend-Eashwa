import { Request, Response } from "express";
import twilio from "twilio";
import { getFormattedDate } from "../utils/emailer";
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// export const submitRequest = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const { name, productDescription, vendorName, userPhoneNumber, amount } =
//     req.body;
//   const time = getFormattedDate();
//   phone = userPhoneNumber;
//   try {
//     await client.messages.create({
//       from: "whatsapp:+919911130173", 
//       to: `whatsapp:+918077335703`, 
//       // body: `Hey! Here are the information about the Order:\n\nName: ${name}\nProduct Description: ${productDescription}\nVendor Name : ${vendorName}\n Date: ${time}\n Amount: ₹${amount} \n\nReply with:\n- "accept" to accept\n- "reject: [reason]" to reject`,
//       contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
//         contentVariables: '{"1":"12/1","2":"3pm"}'
//     });

//     res
//       .status(200)
//       .json({ success: true, message: "Request sent to admin in sandbox." });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to send message.", error });
//   }
// };


// export const submitRequest = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const { name, productDescription, vendorName, userPhoneNumber, amount } = req.body;
//   const time = getFormattedDate(); // Assume this function returns the formatted date
//   const phone = userPhoneNumber; // The recipient's phone number

//   try {
//     // Use the correct contentSid for the approved template
//     await client.messages.create({
//       from: "whatsapp:+919911130173",  // Your Twilio WhatsApp number
//       to: `whatsapp:${phone}`,         // Recipient's phone number
//       contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e', 
//        // Your approved template SID
//       contentVariables: {
//         "1": name,                // Dynamic value for {{1}} (name)
//         "2": productDescription,  // Dynamic value for {{2}} (product description)
//         "3": vendorName,          // Dynamic value for {{3}} (vendor name)
//         "4": time,                // Dynamic value for {{4}} (time)
//         "5": `₹${amount}`         // Dynamic value for {{5}} (amount)
//       }
//     });

//     res.status(200).json({ success: true, message: "Request sent to admin in sandbox." });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to send message.", error });
//   }
// };

export const submitRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, productDescription, vendorName, userPhoneNumber, amount } = req.body;
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
      from: 'whatsapp:+919911130173',
      to: `whatsapp:+918077335703`,
      contentSid: 'HX0d74e16f4926ca40451faa795b3267ea', 
      //@ts-ignore
      contentVariables: contentVariables,
      });

    res.status(200).json({ success: true, message: "Request sent to admin." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message.", error });
  }
};


export const whatsappWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const messageFromAdmin = req.body.Body ? req.body.Body.toLowerCase() : ""; 
  const userPhoneNumber = `whatsapp:${req.body.userPhoneNumber}`; 
  console.log("Incoming Webhook Body:", req.body);  // Debugging the incoming request body

  try {
    if (messageFromAdmin === "accept") {
      await client.messages.create({
        from: "whatsapp:+919911130173",
        to: userPhoneNumber,
        body: `Your request has been accepted by Eashwa. Thank you for your patience.`,
      });

      res.status(200).send("<Response></Response>");
    } 
    // Check if the user responded with "reject" and handle the rejection flow
    else if (messageFromAdmin === "reject") {
      // Notify admin to provide a rejection reason
      const adminPhoneNumber = "whatsapp:+919911130173";  // Replace with admin's phone number

      await client.messages.create({
        from: "whatsapp:+919911130173", // Your Twilio WhatsApp sender number
        to: adminPhoneNumber,
        body: `The user has rejected the request. Please provide a reason for rejection.`,
      });

      // Respond to the user asking for a reason for rejection
      // await client.messages.create({
      //   from: "whatsapp:+919911130173", // Your Twilio WhatsApp sender number
      //   to: userPhoneNumber,
      //   body: `Your request was rejected. Please wait while the admin provides a rejection reason.`,
      // });

      res.status(200).send("<Response></Response>");
    } 
    // Check if the admin provides the rejection reason
    else if (messageFromAdmin.startsWith("reject reason:")) {
      // Extract the rejection reason from admin's message
      const rejectionReason = messageFromAdmin.replace(/^reject reason:\s*/i, "").trim();

      // Send the rejection reason to the user
      await client.messages.create({
        from: "whatsapp:+919911130173", // Your Twilio WhatsApp sender number
        to: userPhoneNumber,
        body: `Your request was rejected by Eashwa. Reason: ${rejectionReason}`,
      });

      res.status(200).send("<Response></Response>");
    } 
    // If no valid response, send an empty Twilio response
    else {
      res.status(200).send("<Response></Response>");
    }
  } catch (error) {
    console.error("Error handling admin response:", error);
    res.status(500).json({ success: false, message: "Failed to process admin response." });
  }
};
