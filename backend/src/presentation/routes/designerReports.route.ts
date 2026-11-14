import { Router } from 'express';
import authMiddleware, { authorizeRoles } from '../middlewares/auth.middileware';
import { getDesignerReport } from '../../infrastructure/repositories/DesignerReportRepository';
import { createDesignerReportPdf, DesignerReportError } from '../../shared/utils/designerReport';

const router = Router();
router.use(authMiddleware, authorizeRoles('admin', 'sysadmin', 'boss', 'designer'));
const elevatedRoles = new Set(['admin', 'sysadmin', 'boss']);

router.get(['/', '/pdf'], async (req: any, res, next) => {
  try {
    const userId = req.query.userId === undefined ? req.userId : req.query.userId;
    if (typeof userId !== 'string') throw new DesignerReportError('Select a valid staff member.');
    if (userId !== req.userId && !elevatedRoles.has(req.role)) {
      res.status(403).json({ message: 'You can only download your own designer report.' });
      return;
    }
    const report = await getDesignerReport(userId, req.query.from, req.query.to);
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.path === '/pdf') {
      const bytes = await createDesignerReportPdf(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="designer-report-${report.from}-${report.to}.pdf"`);
      res.send(bytes);
      return;
    }
    res.json({ success: true, report });
  } catch (error) {
    if (error instanceof DesignerReportError) { res.status(error.status).json({ message: error.message }); return; }
    next(error);
  }
});

export default router;
