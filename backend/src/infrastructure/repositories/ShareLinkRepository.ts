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
  }): Promise<IShareLink> {
    const { folderName, taskId, orderId, userId } = params;

    const query: Record<string, any> = {};
    if (taskId) query.taskId = taskId;
    else if (orderId) query.orderId = orderId;
    else if (userId) query.userId = userId;

    const existing = await ShareLink.findOne(query);
    if (existing) return existing;

    const base = slugify(folderName);
    let slug = base;
    let counter = 2;
    while (await ShareLink.exists({ slug })) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return ShareLink.create({ slug, folderName, taskId, orderId, userId });
  }

  async findBySlug(slug: string): Promise<IShareLink | null> {
    return ShareLink.findOne({ slug });
  }
}

export const shareLinkRepository = new ShareLinkRepository();
