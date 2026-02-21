import express, { Router } from 'express';
import { uploadImage } from '../middleware/multer.middleware';
import { adminMiddleware, protect } from '../middleware/authorized.middleware';
import { AnimalPostController } from '../controllers/animalpost.controller';

const router: Router = express.Router();
const controller = new AnimalPostController();

// Public routes
router.get('/', controller.getAllPosts);                     // GET all posts
router.get('/species/:species', controller.getPostsBySpecies); // GET by species

router.get('/my-adoptions', protect, controller.getMyAdoptions);

router.get('/:id', controller.getPostById);                 // GET single post by ID

// Admin routes
router.post(
  '/',
  protect,
  adminMiddleware,
  uploadImage.array('animalPost', 5),
  controller.createPost
);

router.put(
  '/:id',
  protect,
  adminMiddleware,
  uploadImage.array('animalPost', 5),
  controller.updatePost
);

router.put(
  '/:id/status',
  protect,
  adminMiddleware,
  controller.updatePostStatus
);

router.delete(
  '/:id',
  protect,
  adminMiddleware,
  controller.deletePost
);

export default router;