import { NextFunction, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../../domain/types/api';
import OrderModel from '../../infrastructure/db/models/order.model';

const orderStaffRoles = new Set(['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging']);

/** Customers may only open their own orders; staff may open manual orders too. */
export async function requireOrderOwnerOrStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (orderStaffRoles.has(req.role || '')) {
    next();
    return;
  }

  if (!req.userId || !Types.ObjectId.isValid(req.params.orderId)) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  try {
    const owned = await OrderModel.exists({ _id: req.params.orderId, userId: req.userId });
    if (!owned) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}
