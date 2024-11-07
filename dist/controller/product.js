"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockHistory = exports.getVehiclesStock = exports.getChargersStock = exports.getBatteriesStock = exports.addSoldStockHandler = exports.addStockHandler = exports.createProductHandler = void 0;
const product_1 = __importDefault(require("../model/product"));
const addStock = (updates) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedProducts = [];
    for (const { type, item, quantity, updatedBy, specification } of updates) {
        const product = yield product_1.default.findOne({ type, item });
        if (!product) {
            throw new Error(`Product ${item} not found`);
        }
        const currentStock = Number(product.currentStock);
        const quantityToAdd = Number(quantity);
        product.currentStock = currentStock + quantityToAdd;
        product.updatedBy = updatedBy;
        product.specification = specification;
        product.stockHistory.push({
            user: updatedBy,
            quantity,
            action: 'added',
            date: new Date(),
            speci: specification
        });
        yield product.save();
        updatedProducts.push(product);
    }
    return updatedProducts;
});
const addSoldStock = (updates) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedProducts = [];
    for (const { type, item, quantity, updatedBy, specification } of updates) {
        const product = yield product_1.default.findOne({ type, item });
        if (!product) {
            throw new Error(`Product ${item} not found`);
        }
        console.log(specification);
        const currentSoldStock = Number(product.soldStock);
        const quantityToAdd = Number(quantity);
        product.soldStock = currentSoldStock + quantityToAdd;
        product.updatedBy = updatedBy;
        product.specification = specification;
        product.stockHistory.push({
            user: updatedBy,
            speci: specification,
            quantity,
            action: 'sold',
            date: new Date(),
        });
        yield product.save();
        updatedProducts.push(product);
    }
    return updatedProducts;
});
const createProductHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, item, currentStock, soldStock, updatedBy, specification } = req.body;
    const newProduct = new product_1.default({
        type,
        item,
        currentStock,
        soldStock,
        updatedBy,
        specification,
    });
    try {
        const savedProduct = yield newProduct.save();
        res.status(201).json({
            message: `Product ${savedProduct.item} added successfully.`,
            product: savedProduct,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createProductHandler = createProductHandler;
const addStockHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { updates } = req.body;
    try {
        const updatedProducts = yield addStock(updates);
        res.status(201).json({
            message: `Product added successfully.`,
            product: updatedProducts,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.addStockHandler = addStockHandler;
const addSoldStockHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { updates } = req.body;
    try {
        const updatedProducts = yield addSoldStock(updates);
        res.status(201).json({
            message: `Product added successfully.`,
            product: updatedProducts,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.addSoldStockHandler = addSoldStockHandler;
const getBatteriesStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const batteries = yield product_1.default.find({ type: 'Battery' });
        const response = batteries.map(battery => ({
            id: battery._id,
            type: battery.type,
            item: battery.item,
            currentStock: battery.currentStock,
            soldStock: battery.soldStock,
            remainingStock: battery.currentStock - battery.soldStock,
            lastUpdated: battery.lastUpdated,
            updatedBy: battery.updatedBy,
        }));
        res.json({
            message: "Battery retrieved successfully.",
            products: response,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getBatteriesStock = getBatteriesStock;
const getChargersStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chargers = yield product_1.default.find({ type: 'Charger' });
        const response = chargers.map(charger => ({
            id: charger._id,
            type: charger.type,
            item: charger.item,
            currentStock: charger.currentStock,
            soldStock: charger.soldStock,
            remainingStock: charger.currentStock - charger.soldStock,
            lastUpdated: charger.lastUpdated,
            updatedBy: charger.updatedBy
        }));
        res.json({
            message: "Charger retrieved successfully.",
            products: response,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getChargersStock = getChargersStock;
const getVehiclesStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vehicles = yield product_1.default.find({ type: 'Vehicle' });
        const response = vehicles.map(vehicle => ({
            id: vehicle._id,
            type: vehicle.type,
            item: vehicle.item,
            currentStock: vehicle.currentStock,
            soldStock: vehicle.soldStock,
            remainingStock: vehicle.currentStock - vehicle.soldStock,
            lastUpdated: vehicle.lastUpdated,
            updatedBy: vehicle.updatedBy,
            // specifications: vehicle.specifications,
        }));
        res.json({
            message: "Vehicle stock retrieved successfully.",
            products: response,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getVehiclesStock = getVehiclesStock;
const getStockHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.params;
    if (!['battery', 'charger'].includes(type.toLowerCase())) {
        return res.status(400).json({ message: "Invalid type. Use 'battery' or 'charger'." });
    }
    const products = yield product_1.default.find({ type: type.charAt(0).toUpperCase() + type.slice(1) });
    if (products.length === 0) {
        return res.status(404).json({ message: `No ${type}s found.` });
    }
    const history = products.flatMap(product => product.stockHistory.map(entry => ({
        item: product.item,
        action: entry.action,
        quantity: entry.quantity,
        user: entry.user,
        date: entry.date,
        specification: entry.speci ? entry.speci : '-'
    })));
    res.json({
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} stock history retrieved successfully.`,
        history,
    });
});
exports.getStockHistory = getStockHistory;
