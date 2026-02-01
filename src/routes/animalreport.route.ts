import express, { Router } from 'express';
import { AnimalReportController } from '../controllers/animalreport.controller';
import { uploadImage } from '../middleware/multer.middleware';
import { adminMiddleware, protect } from '../middleware/authorized.middleware';

const router: Router = express.Router();
const controller = new AnimalReportController();


//loggedin users can upload a report photo
router.post(
  '/upload-photo',
  protect,
  uploadImage.single('animalReport'),
  controller.uploadReportPhoto
);

router.get('/all', protect,adminMiddleware, controller.getAllReports);
router.get('/my-reports', protect, controller.getMyReports);
router.post('/', protect, controller.createReport);
router.get('/:id', protect, controller.getReportById);
router.put('/:id/status', protect, adminMiddleware, controller.updateReportStatus);
router.delete('/:id', protect, controller.deleteReport);
router.get('/species/:species', protect, controller.getReportsBySpecies);



export default router;
