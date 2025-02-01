import { Router } from "express";

import upload from "../config/multer";
import { uploadExcelFile, uploadImages } from "../controller/image";

const router = Router();
router.post("/upload-images", upload.array("images", 10), uploadImages);
router.post("/upload-excel", uploadExcelFile);

export default router;
