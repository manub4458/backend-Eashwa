import { Types } from "mongoose";

export const headerMapping = {
  "Lead Date": "leadDate",
  "Calling Date": "callingDate",
  "Agent Name": "agentName",
  "Customer Name": "customerName",
  "Mobile No": "mobileNumber",
  Occupation: "occupation",
  Location: "location",
  Town: "town",
  State: "state",
  Status: "status",
  Remark: "remark",
  "Interested & Not Interested": "interestedAndNotInterested",
  "Office Visit Required": "officeVisitRequired",
};

export const validateLeadData = (data: any): boolean => {
  return Object.keys(headerMapping).every((header) => {
    const value = data[header];
    return value !== undefined && value !== null && value !== "";
  });
};

export const convertRowToLead = (row: any, userId: string) => {
  return {
    leadDate: new Date(row["Lead Date"]),
    callingDate: new Date(row["Calling Date"]),
    agentName: row["Agent Name"],
    customerName: row["Customer Name"],
    mobileNumber: String(row["Mobile no"]),
    occupation: row["Occupation"],
    location: row["Location"],
    town: row["Town"],
    state: row["State"],
    status: row["Status"],
    remark: row["Remark"],
    interestedAndNotInterested: row["Interested & Not Interested"],
    officeVisitRequired:
      row["Office Visit Required"]?.toString().toLowerCase() === "yes" ||
      row["Office Visit Required"] === true ||
      row["Office Visit Required"] === 1,
    leadBy: new Types.ObjectId(userId),
  };
};
