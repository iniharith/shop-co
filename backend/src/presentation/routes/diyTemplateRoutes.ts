import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';
import { DiyTemplateOverride } from '../../domain/entities/DiyTemplateOverride';

const router = Router();
const sourceUrl = () => process.env.DIY_TEMPLATE_SOURCE_URL || 'https://diy.kampungcetak.com/api/diy-template-library';
let cached: { expiresAt: number; templates: any[] } | null = null;

const sourceTemplates = async () => {
  if (cached && cached.expiresAt > Date.now()) return cached.templates;
  const response = await fetch(sourceUrl(), { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`DIY template source returned ${response.status}`);
  const body = await response.json() as { templates?: unknown };
  if (!Array.isArray(body.templates)) throw new Error('DIY template source returned an invalid library');
  cached = { templates: body.templates, expiresAt: Date.now() + 30_000 };
  return cached.templates;
};

router.get('/', asyncHandler(async (_req, res) => {
  const [templates, overrides] = await Promise.all([sourceTemplates(), DiyTemplateOverride.find().lean()]);
  const changed = new Map(overrides.map((item: any) => [item.templateId, item.template]));
  res.json({ success: true, templates: templates.map((template: any) => changed.get(template.id) || template) });
}));

router.put('/:id', authMiddilware, authorizeRoles('admin', 'sysadmin', 'boss', 'designer'), asyncHandler(async (req: any, res) => {
  const template = req.body?.template;
  if (!template || typeof template !== 'object' || String(template.id) !== String(req.params.id)) {
    res.status(400).json({ success: false, message: 'A valid template payload is required.' });
    return;
  }
  await DiyTemplateOverride.findOneAndUpdate(
    { templateId: req.params.id },
    { templateId: req.params.id, template, updatedBy: req.userId },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  cached = null;
  res.json({ success: true, template });
}));

export default router;
