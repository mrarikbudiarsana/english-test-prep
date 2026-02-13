import { Router } from 'express';
import multer from 'multer';
import * as uploadController from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.post('/audio', authMiddleware, upload.single('audio'), uploadController.uploadAudio);
router.post('/image', authMiddleware, upload.single('image'), uploadController.uploadImage);

export default router;
