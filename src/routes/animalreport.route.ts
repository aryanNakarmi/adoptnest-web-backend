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

router.post('/', protect, controller.createReport);


router.get('/all', protect, controller.getAllReports);


router.get('/:id', protect, controller.getReportById);


// loggedin user get their own reports
router.get('/my-reports', protect, controller.getMyReports);


// Admin only: approve or reject a report
router.put('/:id/status', protect, adminMiddleware, controller.updateReportStatus);

// Admin 
router.delete('/:id', protect,adminMiddleware, controller.deleteReport);

export default router;
