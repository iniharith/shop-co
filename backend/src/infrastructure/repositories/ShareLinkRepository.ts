/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { ShareLink, IShareLink } from '../../domain/entities/ShareLink';

const slugify = (input: string): string =>
  input
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'customer';

export class ShareLinkRepository {
  // Finds an existing link for the same folder criteria, or creates a new
  // short slug based on the customer/folder name (e.g. "ahmad-ali", "ahmad-ali-2").
  async findOrCreate(params: {
    folderName: string;
    taskId?: string;
    orderId?: string;
    userId?: string;
    folderId?: string;
  }): Promise<IShareLink> {
    const { folderName, taskId, orderId, userId, folderId } = params;

    // IMPORTANT: only reuse an existing link if we have a real identifier to
    // match on. An empty {} query would match the FIRST document in the
    // entire collection, silently handing back an unrelated customer's link.
    let existing: IShareLink | null = null;
    if (folderId) existing = await ShareLink.findOne({ folderId });
    else if (taskId) existing = await ShareLink.findOne({ taskId });
    else if (orderId) existing = await ShareLink.findOne({ orderId });
    else if (userId) existing = await ShareLink.findOne({ userId });

    if (existing) {
      if (existing.folderName !== folderName) {
        existing.folderName = folderName;
        await existing.save();
      }
      return existing;
    }

    const base = slugify(folderName);
    let slug = base;
    let counter = 2;
    while (await ShareLink.exists({ slug })) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return ShareLink.create({ slug, folderName, taskId, orderId, userId, folderId });
  }

  async findBySlug(slug: string): Promise<IShareLink | null> {
    return ShareLink.findOne({ slug });
  }
}

export const shareLinkRepository = new ShareLinkRepository();
