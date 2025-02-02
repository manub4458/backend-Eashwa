"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertRowToLead = exports.validateLeadData = exports.headerMapping = void 0;
const mongoose_1 = require("mongoose");
exports.headerMapping = {
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
const validateLeadData = (data) => {
    return Object.keys(exports.headerMapping).every((header) => {
        const value = data[header];
        return value !== undefined && value !== null && value !== "";
    });
};
exports.validateLeadData = validateLeadData;
const convertRowToLead = (row, userId) => {
    var _a;
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
        officeVisitRequired: ((_a = row["Office Visit Required"]) === null || _a === void 0 ? void 0 : _a.toString().toLowerCase()) === "yes" ||
            row["Office Visit Required"] === true ||
            row["Office Visit Required"] === 1,
        leadBy: new mongoose_1.Types.ObjectId(userId),
    };
};
exports.convertRowToLead = convertRowToLead;
