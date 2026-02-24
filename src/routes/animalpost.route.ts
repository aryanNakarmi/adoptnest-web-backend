import express, { Router } from 'express';
import { uploadImage } from '../middleware/multer.middleware';
import { adminMiddleware, protect } from '../middleware/authorized.middleware';
import { AnimalPostController } from '../controllers/animalpost.controller';

const router: Router = express.Router();
const controller = new AnimalPostController();

// Public routes
router.get('/', controller.getAllPosts);
router.get('/species/:species', controller.getPostsBySpecies);
router.get('/my-adoptions', protect, controller.getMyAdoptions);
router.get('/:id', controller.getPostById);

// Admin routes
router.post('/', protect, adminMiddleware, uploadImage.array('animalPost', 5), controller.createPost);
router.put('/:id', protect, adminMiddleware, uploadImage.array('animalPost', 5), controller.updatePost);
router.put('/:id/status', protect, adminMiddleware, controller.updatePostStatus);
router.delete('/:id', protect, adminMiddleware, controller.deletePost);

// User: send adoption request
router.post('/:id/request-adoption', protect, controller.requestAdoption);

// User: cancel adoption request
router.delete('/:id/request-adoption', protect, controller.cancelAdoptionRequest);

// Admin: view all requesters for a post
router.get('/:id/adoption-requests', protect, adminMiddleware, controller.getAdoptionRequests);

export default router;