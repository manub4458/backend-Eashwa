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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db = require("./config/db");
const user_1 = __importDefault(require("./routes/user"));
const product_1 = __importDefault(require("./routes/product"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/user', user_1.default);
app.use('/api/products', product_1.default);
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});
app.get('/', (req, res) => {
    res.send('Welcome to Server');
});
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // connectDB
        yield db.connectDB(process.env.MONGO_URL);
        app.listen(port, () => console.log(`Server is connected to port : ${port}`));
    }
    catch (error) {
        console.log(error);
    }
});
start();
