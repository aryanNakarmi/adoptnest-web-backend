import express, { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { protect, adminMiddleware } from '../middleware/authorized.middleware';
import { uploadImage } from '../middleware/multer.middleware';

const router: Router = express.Router();
const controller = new AdminController();

router.post('/users', protect, adminMiddleware, uploadImage.single('profilePicture'), controller.createUser);
router.put('/users/:id', protect, adminMiddleware, uploadImage.single('profilePicture'), controller.updateUser);
router.delete('/users/:id', protect, adminMiddleware, controller.deleteUser);
router.get('/users', protect, adminMiddleware, controller.getAllUsers);
router.get('/users/:id', protect, adminMiddleware, controller.getUserById);

export default router;  