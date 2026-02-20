import express, { Router } from 'express';
import { uploadImage } from '../middleware/multer.middleware';
import { adminMiddleware, protect } from '../middleware/authorized.middleware';
import { AnimalPostController } from '../controllers/animalpost.controller';

const router: Router = express.Router();
const controller = new AnimalPostController();

// Get all animal posts (for users to browse)
router.get('/', controller.getAllPosts);

// Filter posts by species (for users adoption section)
router.get('/species/:species', controller.getPostsBySpecies);



// Create new animal post
router.post(
  '/',
  protect,
  adminMiddleware,
  uploadImage.array('photos', 5),
  controller.createPost
);

// Edit animal post 
router.put(
  '/:id',
  protect,
  adminMiddleware,
  uploadImage.array('photos', 5),
  controller.updatePost
);

// Change post status 
router.put(
  '/:id/status',
  protect,
  adminMiddleware,
  controller.updatePostStatus
);

// Delete animal post
router.delete(
  '/:id',
  protect,
  adminMiddleware,
  controller.deletePost
);

export default router;