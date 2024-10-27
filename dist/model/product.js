"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Battery', 'Charger'],
    },
    item: {
        type: String,
        required: true,
        enum: [
            'Lead Acid Battery',
            'Lead Acid Charger',
            'Lithium-ion Battery',
            'Lithium-ion Charger',
        ],
    },
    currentStock: {
        type: Number,
        required: true,
        default: 0,
    },
    soldStock: {
        type: Number,
        required: true,
        default: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    updatedBy: {
        type: String,
        required: true,
    },
    stockHistory: [{
            date: { type: Date, default: Date.now },
            user: { type: String, required: true },
            quantity: { type: Number, required: true },
            action: { type: String, enum: ['added', 'sold'], required: true },
        }],
});
productSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});
const Product = (0, mongoose_1.model)('Product', productSchema);
exports.default = Product;
