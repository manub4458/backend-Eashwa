import {Router} from 'express';

import upload from '../config/multer';
import { uploadImages } from '../controller/image';

const router = Router();
router.post('/upload-images', upload.array('images', 10), uploadImages);

export default router;