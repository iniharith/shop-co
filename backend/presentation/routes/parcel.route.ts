/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router } from 'express';
import { ParcelController } from '../controllers/parcel.controller';
import { authMiddilware } from '../middlewares/auth.middileware';

const router = Router();
const parcelController = new ParcelController();

router.get('/', authMiddilware, parcelController.getParcels.bind(parcelController));
router.post('/', authMiddilware, parcelController.createParcel.bind(parcelController));
router.get('/:parcelId', authMiddilware, parcelController.getParcelById.bind(parcelController));
router.post('/:parcelId/refresh', authMiddilware, parcelController.refreshTracking.bind(parcelController));
router.get('/:parcelId/awb', authMiddilware, parcelController.getAWBPdf.bind(parcelController));
router.patch('/:parcelId/status', authMiddilware, parcelController.updateParcelStatus.bind(parcelController));
router.delete('/:parcelId', authMiddilware, parcelController.deleteParcel.bind(parcelController));
router.post('/:parcelId/upload-link', authMiddilware, parcelController.generateUploadLink.bind(parcelController));

export default router;
