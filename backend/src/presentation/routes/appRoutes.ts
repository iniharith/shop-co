import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

const router = Router();

// GET /api/app/version
// Returns the latest app version and download URL.
router.get(
  '/version',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      version: '1.7.7',
      apkUrl: 'https://admin.kampungcetak.com/downloads/app-release.apk',
      forceUpdate: false,
      message: 'New update available!',
    });
  })
);

export default router;
