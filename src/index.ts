import express, { Express, Request, Response , Application, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import db = require('./config/db');
import userRoutes from "./routes/user";
import productRoutes from "./routes/product";
import requestRouter from "./routes/twillio";
import imageRouter from "./routes/image";
import morgan from "morgan"
declare global {
    namespace Express {
      interface Request {
        userId?: string ;
  }
}}


dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

var corsOptions = {
  origin: ["http://localhost:3000", "https://eashwa-frontend-iptp.vercel.app","https://eashwastock.in"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/request', requestRouter);
app.use('/api/images', imageRouter);
app.use((err: Error, req: Request, res:Response, next: NextFunction) => {
    res.status(500).json({message: err.message});  
  });


app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the Server');
});

const start = async () => {
  try {
    // connectDB
    await db.connectDB(process.env.MONGO_URL!);
    app.listen(port, () => console.log(`Server is connected to port : ${port}`));
  } catch (error) {
    console.log(error);
  }
};

start();
