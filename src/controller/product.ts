import { Request, Response } from "express";
import Product from "../model/product";
 
 
const addStock = async (updates: { type: string; item: string; quantity: number; updatedBy: string, specification: string}[]) => {
    const updatedProducts: any[] = [];
 
    for (const { type, item, quantity, updatedBy, specification } of updates) {
        const product = await Product.findOne({ type, item });
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
            speci:specification
        });
        await product.save();
        updatedProducts.push(product);
    }
 
    return updatedProducts;
};
 
const addSoldStock = async (updates: { type: string; item: string; quantity: number; updatedBy: string, specification: string }[]) => {
    const updatedProducts: any[] = [];
 
    for (const { type, item, quantity, updatedBy, specification } of updates) {
        const product = await Product.findOne({ type, item });
        if (!product) {
            throw new Error(`Product ${item} not found`);
        }
        console.log(specification);
        const currentSoldStock = Number(product.soldStock);
        const quantityToAdd = Number(quantity);
        product.soldStock =  currentSoldStock + quantityToAdd;
        product.updatedBy = updatedBy;
        product.specification = specification;
        product.stockHistory.push({
            user: updatedBy,
            speci: specification,
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
    const { type, item, currentStock, soldStock, updatedBy, specification } = req.body;
 
    const newProduct = new Product({
        type,
        item,
        currentStock,
        soldStock,
        updatedBy,
        specification,
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
            updatedBy: battery.updatedBy,
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

export const getVehiclesStock = async (req: Request, res: Response) => {
    try {
        const vehicles = await Product.find({ type: 'Vehicle' });

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
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getStockHistory = async (req: Request, res: Response) => {
    const { type } = req.params;

    // Ensure the type is one of the allowed product types: 'battery', 'charger', or 'vehicle'
    if (!['battery', 'charger', 'vehicle'].includes(type.toLowerCase())) {
        return res.status(400).json({ message: "Invalid type. Use 'battery', 'charger', or 'vehicle'." });
    }

    // Capitalize the first letter of the product type to match the model naming convention
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);

    // Fetch products based on the type
    const products = await Product.find({ type: formattedType });

    // If no products found, return a 404 response
    if (products.length === 0) {
        return res.status(404).json({ message: `No ${type}s found.` });
    }

    // Map over the products and flatten the stock history
    const history = products.flatMap(product =>
        product.stockHistory.map(entry => ({
            item: product.item,
            action: entry.action,
            quantity: entry.quantity,
            user: entry.user,
            date: entry.date,
            specification: entry.speci ? entry.speci : '-' // Ensure specification is included
        }))
    );

    res.json({
        message: `${formattedType} stock history retrieved successfully.`,
        history,
    });
};
