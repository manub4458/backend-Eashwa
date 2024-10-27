import { Request, Response } from "express";
import Product from "../model/product";


const addStock = async (updates: { type: string; item: string; quantity: number; updatedBy: string }[]) => {
    const updatedProducts: any[] = [];
    
    for (const { type, item, quantity, updatedBy } of updates) {
        const product = await Product.findOne({ type, item });
        if (!product) {
            throw new Error(`Product ${item} not found`);
        }
        product.currentStock += quantity;
        product.updatedBy = updatedBy;
        product.stockHistory.push({
            user: updatedBy,
            quantity,
            action: 'added',
            date: new Date(),
        });
        await product.save();
        updatedProducts.push(product);
    }
    
    return updatedProducts;
};

const addSoldStock = async (updates: { type: string; item: string; quantity: number; updatedBy: string }[]) => {
    const updatedProducts: any[] = [];
    
    for (const { type, item, quantity, updatedBy } of updates) {
        const product = await Product.findOne({ type, item });
        if (!product) {
            throw new Error(`Product ${item} not found`);
        }
        product.soldStock += quantity;
        product.updatedBy = updatedBy;
        product.stockHistory.push({
            user: updatedBy,
            quantity,
            action: 'sold',
            date: new Date(),
        });
        await product.save();
        updatedProducts.push(product);
    }
    
    return updatedProducts;
};

export const createProductHandler = async (req: Request, res: Response) => {
    const { type, item, currentStock, soldStock, updatedBy } = req.body;

    const newProduct = new Product({
        type,
        item,
        currentStock,
        soldStock,
        updatedBy,
    });

    try {
        const savedProduct = await newProduct.save();
        res.status(201).json({
            message: `Product ${savedProduct.item} added successfully.`,
            product: savedProduct,
        });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const addStockHandler = async (req: Request, res: Response) => {
    const { updates } = req.body;
    try {
        const updatedProducts = await addStock(updates);
        res.status(201).json({
            message: `Product added successfully.`,
            product: updatedProducts,
        });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const addSoldStockHandler = async (req: Request, res: Response) => {
    const { updates } = req.body; 
    try {
        const updatedProducts = await addSoldStock(updates);
        res.status(201).json({
            message: `Product added successfully.`,
            product: updatedProducts,
        });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};


export const getBatteriesStock = async (req: Request, res: Response) => {
    try {
        const batteries = await Product.find({ type: 'Battery' });

        const response = batteries.map(battery => ({
            id: battery._id,
            type: battery.type,
            item: battery.item,
            currentStock: battery.currentStock,
            soldStock: battery.soldStock,
            remainingStock: battery.currentStock - battery.soldStock,
            lastUpdated: battery.lastUpdated,
            updatedBy: battery.updatedBy
        }));

        res.json({
            message: "Battery retrieved successfully.",
            products: response,
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getChargersStock = async (req: Request, res: Response) => {
    try {
        const chargers = await Product.find({ type: 'Charger' });

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
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getStockHistory = async (req: Request, res: Response) => {
    const { type } = req.params;

    if (!['battery', 'charger'].includes(type.toLowerCase())) {
        return res.status(400).json({ message: "Invalid type. Use 'battery' or 'charger'." });
    }

    const products = await Product.find({ type: type.charAt(0).toUpperCase() + type.slice(1) });

    if (products.length === 0) {
        return res.status(404).json({ message: `No ${type}s found.` });
    }

    const history = products.flatMap(product => 
        product.stockHistory.map(entry => ({
            item: product.item,
            action: entry.action,
            quantity: entry.quantity,
            user: entry.user,
            date: entry.date,
        }))
    );

    res.json({
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} stock history retrieved successfully.`,
        history,
    });
};