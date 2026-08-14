/**
 * Coded by Harith
 * Kampungcetak ®
 * Chunks + embeds MongoDB documents (products, tasks, files) into pgvector.
 */
import { Task } from '../../domain/entities/Task';
import { FileUpload } from '../../domain/entities/FileUpload';
import ProductModel from '../../infrastructure/db/models/product.model';
import { pgVectorStore } from '../../infrastructure/vector/pgVectorStore';
import { embedTexts, aiConfigured } from '../../infrastructure/ai/openaiClient';

export const AI_COLLECTIONS = {
  products: 'products',
  tasks: 'tasks',
  files: 'files',
} as const;

const CHUNK_SIZE = 800;

export function chunkText(text: string, size = CHUNK_SIZE): string[] {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += size) {
    chunks.push(clean.slice(i, i + size));
  }
  return chunks;
}

function safeMetadata(obj: Record<string, unknown>): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(obj || {}));
  } catch {
    return {};
  }
}

interface IndexEntityInput {
  collection: string;
  entityId: string;
  text: string;
  metadata: Record<string, unknown>;
}

async function indexEntity(input: IndexEntityInput): Promise<void> {
  if (!aiConfigured()) return;
  const chunks = chunkText(input.text);
  const metadata = safeMetadata(input.metadata);

  if (chunks.length === 0) {
    // Keep a stub row so counts/recently-indexed are meaningful even for
    // entities without searchable text (e.g. binary-only uploads).
    await pgVectorStore.upsertBatch(input.collection, [
      { entityId: input.entityId, chunkIndex: 0, text: input.text || '', metadata, embedding: new Array(1536).fill(0) },
    ]);
    return;
  }

  const embeddings = await embedTexts(chunks);
  await pgVectorStore.upsertBatch(
    input.collection,
    chunks.map((chunk, i) => ({
      entityId: input.entityId,
      chunkIndex: i,
      text: chunk,
      metadata,
      embedding: embeddings[i],
    }))
  );
}

export async function indexTask(task: any): Promise<void> {
  if (!task?._id || !aiConfigured()) return;
  const text = [
    task.title,
    task.description,
    task.customerUsername && `Pelanggan: ${task.customerUsername}`,
    task.orderId && `Order ID: ${task.orderId}`,
    task.category && `Kategori: ${task.category}`,
    task.productName && `Produk: ${task.productName}`,
    task.status && `Status: ${task.status}`,
  ]
    .filter(Boolean)
    .join('\n');

  await indexEntity({
    collection: AI_COLLECTIONS.tasks,
    entityId: task._id.toString(),
    text,
    metadata: {
      id: task._id.toString(),
      title: task.title,
      status: task.status,
      category: task.category,
      orderId: task.orderId,
      customerUsername: task.customerUsername,
      productName: task.productName,
      updatedAt: task.updatedAt || new Date().toISOString(),
    },
  });
}

export async function indexFile(file: any): Promise<void> {
  if (!file?._id || !aiConfigured()) return;
  const text = [
    file.originalName,
    file.notes,
    file.category && `Kategori: ${file.category}`,
    file.orderId && `Order ID: ${file.orderId}`,
    file.taskId && `Task ID: ${file.taskId}`,
  ]
    .filter(Boolean)
    .join('\n');

  await indexEntity({
    collection: AI_COLLECTIONS.files,
    entityId: file._id.toString(),
    text,
    metadata: {
      id: file._id.toString(),
      originalName: file.originalName,
      mimetype: file.mimetype,
      category: file.category,
      orderId: file.orderId,
      taskId: file.taskId,
      path: file.path,
      adminReviewed: Boolean(file.adminReviewed),
      uploadedAt: file.uploadedAt || new Date().toISOString(),
    },
  });
}

export async function indexProduct(product: any): Promise<void> {
  if (!product?._id || !aiConfigured()) return;
  const sizes = Array.isArray(product.sizes)
    ? product.sizes.map((s: any) => s.size || s).filter(Boolean).join(', ')
    : '';

  const text = [
    product.name,
    product.description,
    product.category && `Kategori: ${product.category}`,
    sizes && `Saiz: ${sizes}`,
    product.price != null && `Harga: RM ${product.price}`,
  ]
    .filter(Boolean)
    .join('\n');

  await indexEntity({
    collection: AI_COLLECTIONS.products,
    entityId: product._id.toString(),
    text,
    metadata: {
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      price: product.price,
      image: Array.isArray(product.images) ? product.images[0] : undefined,
      rating: product.rating,
    },
  });
}

async function forEachEntity(
  model: any,
  filter: Record<string, unknown>,
  batchSize: number,
  fn: (doc: any) => Promise<void>
): Promise<number> {
  let count = 0;
  let cursor: any = null;
  for (;;) {
    const query: Record<string, unknown> = { ...filter };
    if (cursor) query._id = { $gt: cursor };
    const docs = await model.find(query).sort({ _id: 1 }).limit(batchSize).lean();
    if (docs.length === 0) break;
    for (const doc of docs) {
      await fn(doc);
      count += 1;
    }
    cursor = docs[docs.length - 1]._id;
  }
  return count;
}

export async function reindexAll(opts: { onProgress?: (msg: string) => void } = {}): Promise<{
  products: number;
  tasks: number;
  files: number;
}> {
  if (!aiConfigured()) throw new Error('AI is not configured (OPENAI_API_KEY missing)');
  await pgVectorStore.initSchema();
  const report = { products: 0, tasks: 0, files: 0 };

  opts.onProgress?.('Mengindeks produk...');
  report.products = await forEachEntity(ProductModel, { isDelete: { $ne: true } }, 20, indexProduct);

  opts.onProgress?.('Mengindeks task...');
  report.tasks = await forEachEntity(Task, { isDeleted: { $ne: true } }, 20, indexTask);

  opts.onProgress?.('Mengindeks fail...');
  report.files = await forEachEntity(FileUpload, {}, 20, indexFile);

  return report;
}
