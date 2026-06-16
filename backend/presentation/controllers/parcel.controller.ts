import { NextFunction, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ParcelModel from '../../infrastructure/db/models/parcel.model';
import FileStoreModel from '../../infrastructure/db/models/filestore.model';
import { EasyParcelService } from '../../shared/services/easyparcel.service';
import { WhatsAppService } from '../../shared/services/whatsapp.service';
import { AuthRequest } from '../../domain/types/api';
import { statusCodes } from '../../shared/constants/api.constant';

const easyParcel = new EasyParcelService();
const whatsApp = new WhatsAppService();

/** @Controller */
export class ParcelController {

  /**
   * @description Create a new parcel record linked to an order
   * @Method POST
   * @Access PRIVATE (Admin)
   * @Route /api/parcels
   */
  async createParcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        orderId,
        customerName,
        customerPhone,
        awbNumber,
        courier,
        easyparcelOrderId,
      } = req.body;

      if (!orderId || !customerName || !customerPhone || !awbNumber) {
        res.status(statusCodes.BAD_REQUEST).json({
          message: 'orderId, customerName, customerPhone and awbNumber are required',
        });
        return;
      }

      // Generate unique upload token for this order's file uploads
      const uploadToken = uuidv4();

      // Fetch initial tracking status from EasyParcel
      const tracking = await easyParcel.trackParcel(awbNumber);

      const parcel = await ParcelModel.create({
        orderId,
        customerName,
        customerPhone,
        awbNumber,
        courier: courier || '',
        easyparcelOrderId: easyparcelOrderId || '',
        status: tracking?.status || 'PENDING',
        statusHistory: tracking
          ? [{ status: tracking.status, description: tracking.description, timestamp: new Date() }]
          : [{ status: 'PENDING', description: 'Parcel created', timestamp: new Date() }],
        uploadToken,
      });

      // Create a linked FileStore record for customer artwork uploads
      await FileStoreModel.create({
        orderId,
        uploadToken,
        customerName,
        isActive: true,
      });

      res.status(statusCodes.CREATED).json({
        message: 'Parcel created successfully',
        parcel,
        uploadLink: `${process.env.FRONTEND_URL || 'https://studioivory.art'}/upload/${uploadToken}`,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Get all parcels
   * @Method GET
   * @Access PRIVATE (Admin)
   * @Route /api/parcels
   */
  async getParcels(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parcels = await ParcelModel.find()
        .populate('orderId', 'orderStatus totalAmount paymentStatus')
        .sort({ createdAt: -1 });
      res.status(statusCodes.OK).json({ message: 'Parcels fetched successfully', parcels });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Get single parcel by ID
   * @Method GET
   * @Access PRIVATE (Admin)
   * @Route /api/parcels/:parcelId
   */
  async getParcelById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parcel = await ParcelModel.findById(req.params.parcelId)
        .populate('orderId', 'orderStatus totalAmount paymentStatus address products');
      if (!parcel) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'Parcel not found' });
        return;
      }
      res.status(statusCodes.OK).json({ message: 'Parcel fetched successfully', parcel });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Refresh tracking status from EasyParcel and notify customer via WhatsApp if changed
   * @Method POST
   * @Access PRIVATE (Admin)
   * @Route /api/parcels/:parcelId/refresh
   */
  async refreshTracking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parcel = await ParcelModel.findById(req.params.parcelId);
      if (!parcel) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'Parcel not found' });
        return;
      }

      const tracking = await easyParcel.trackParcel(parcel.awbNumber);
      if (!tracking) {
        res.status(statusCodes.OK).json({
          message: 'Could not fetch tracking data from EasyParcel. AWB may not be registered yet.',
          parcel,
        });
        return;
      }

      const previousStatus = parcel.status;
      const statusChanged = previousStatus !== tracking.status;

      if (statusChanged) {
        parcel.status = tracking.status;
        parcel.statusHistory.push({
          status: tracking.status,
          description: tracking.description,
          timestamp: new Date(),
        });

        // Send WhatsApp notification on every status change
        if (parcel.customerPhone) {
          const sent = await whatsApp.sendParcelStatusUpdate(
            parcel.customerPhone,
            parcel.customerName,
            parcel.awbNumber,
            tracking.status,
            tracking.tracking_url
          );
          if (sent) {
            parcel.lastWhatsappSentStatus = tracking.status;
          }
        }

        await parcel.save();
      }

      res.status(statusCodes.OK).json({
        message: statusChanged
          ? `Status updated: ${previousStatus} → ${tracking.status}`
          : 'Status unchanged',
        statusChanged,
        parcel,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Get AWB PDF URL from EasyParcel
   * @Method GET
   * @Access PRIVATE (Admin)
   * @Route /api/parcels/:parcelId/awb
   */
  async getAWBPdf(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parcel = await ParcelModel.findById(req.params.parcelId);
      if (!parcel) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'Parcel not found' });
        return;
      }

      const pdfUrl = await easyParcel.getAWBPdfUrl(parcel.awbNumber);
      if (!pdfUrl) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'AWB PDF not available from EasyParcel' });
        return;
      }

      // Cache the PDF URL in the parcel record
      parcel.awbPdfUrl = pdfUrl;
      await parcel.save();

      res.status(statusCodes.OK).json({
        message: 'AWB PDF URL fetched successfully',
        awbPdfUrl: pdfUrl,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Manually update parcel status and notify customer
   * @Method PATCH
   * @Access PRIVATE (Admin)
   * @Route /api/parcels/:parcelId/status
   */
  async updateParcelStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, description } = req.body;
      if (!status) {
        res.status(statusCodes.BAD_REQUEST).json({ message: 'status is required' });
        return;
      }

      const parcel = await ParcelModel.findById(req.params.parcelId);
      if (!parcel) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'Parcel not found' });
        return;
      }

      const previousStatus = parcel.status;
      parcel.status = status;
      parcel.statusHistory.push({
        status,
        description: description || `Status manually updated to ${status}`,
        timestamp: new Date(),
      });

      // Send WhatsApp notification
      if (parcel.customerPhone) {
        const sent = await whatsApp.sendParcelStatusUpdate(
          parcel.customerPhone,
          parcel.customerName,
          parcel.awbNumber,
          status,
          `https://studioivory.art`
        );
        if (sent) {
          parcel.lastWhatsappSentStatus = status;
        }
      }

      await parcel.save();

      res.status(statusCodes.OK).json({
        message: `Parcel status updated: ${previousStatus} → ${status}`,
        parcel,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Delete parcel record
   * @Method DELETE
   * @Access PRIVATE (Admin)
   * @Route /api/parcels/:parcelId
   */
  async deleteParcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parcel = await ParcelModel.findByIdAndDelete(req.params.parcelId);
      if (!parcel) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'Parcel not found' });
        return;
      }
      res.status(statusCodes.OK).json({ message: 'Parcel deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @description Generate or regenerate upload link token for customer
   * @Method POST
   * @Access PRIVATE (Admin)
   * @Route /api/parcels/:parcelId/upload-link
   */
  async generateUploadLink(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parcel = await ParcelModel.findById(req.params.parcelId);
      if (!parcel) {
        res.status(statusCodes.NOT_FOUND).json({ message: 'Parcel not found' });
        return;
      }

      const newToken = uuidv4();
      parcel.uploadToken = newToken;
      await parcel.save();

      // Update the linked FileStore record too
      await FileStoreModel.findOneAndUpdate(
        { orderId: parcel.orderId },
        { uploadToken: newToken, isActive: true },
        { upsert: true, new: true }
      );

      const uploadLink = `${process.env.FRONTEND_URL || 'https://studioivory.art'}/upload/${newToken}`;

      res.status(statusCodes.OK).json({
        message: 'Upload link regenerated successfully',
        uploadToken: newToken,
        uploadLink,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
