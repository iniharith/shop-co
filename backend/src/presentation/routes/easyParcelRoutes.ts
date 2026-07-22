import { Request, Response, Router } from 'express';
import asyncHandler from 'express-async-handler';
import { easyParcelService } from '../../infrastructure/services/EasyParcelService';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';

const router = Router();

router.get(
  '/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const adminAppUrl = (process.env.ADMIN_APP_URL?.trim() || 'https://admin.kampungcetak.com').replace(/\/$/, '');
    try {
      const code = typeof req.query.code === 'string' ? req.query.code : '';
      const state = typeof req.query.state === 'string' ? req.query.state : '';
      await easyParcelService.handleAuthorizationCallback(code, state);
      res.redirect(`${adminAppUrl}/admin/orders?easyparcel=connected`);
    } catch (_error) {
      res.redirect(`${adminAppUrl}/admin/orders?easyparcel=error`);
    }
  })
);

router.get(
  '/status',
  authMiddilware,
  authorizeRoles('admin', 'sysadmin', 'boss', 'production', 'packaging'),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await easyParcelService.getConnectionStatus());
  })
);

router.post(
  '/connect',
  authMiddilware,
  authorizeRoles('admin', 'sysadmin', 'boss'),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ authorizationUrl: await easyParcelService.createAuthorizationUrl() });
  })
);

export default router;
