/**
 * Coded by Harith
 * Kampungcetak ®
 * Scans an uploaded file, extracts its text, and compares it against the
 * linked order/task details (customer name, item, size, quantity, phone,
 * address). Returns human-readable issues when the file looks wrong.
 */
import axios from 'axios';
import OrderModel from '../../infrastructure/db/models/order.model';
import { Task } from '../../domain/entities/Task';
import { FileUpload } from '../../domain/entities/FileUpload';
import {
  aiConfigured,
  extractTextFromBuffer,
  generateJson,
} from '../../infrastructure/ai/aiProvider';

export interface VerificationIssue {
  field: string;
  found: string;
  expected: string;
  severity: 'error' | 'warning';
  explanation: string;
}

export interface VerificationResult {
  ok: boolean;
  issues: VerificationIssue[];
  summary: string;
  textExtracted: string | null;
}

interface FileRef {
  path: string;
  originalName: string;
  mimetype: string;
}

const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

async function downloadFile(path: string): Promise<Buffer | null> {
  try {
    const res = await axios.get(path, {
      responseType: 'arraybuffer',
      timeout: 30_000,
      maxContentLength: MAX_DOWNLOAD_BYTES,
      maxBodyLength: MAX_DOWNLOAD_BYTES,
    });
    return Buffer.from(res.data);
  } catch (err) {
    console.error('[ai] failed to download file for verification:', (err as Error).message);
    return null;
  }
}

export function buildExpectedDetails(order: any, tasks: any[], notes?: string): string {
  const products = Array.isArray(order.products)
    ? order.products.map((p: any) => `- ${p.productNameSnapshot || p.product || 'item'} | Saiz: ${p.size} | Kuantiti: ${p.quantity}`).join('\n')
    : '';

  const manualItem = order.manualItemName
    ? `- ${order.manualItemName}${order.manualItemDescription ? ` (${order.manualItemDescription})` : ''}`
    : '';

  const addr = order.address
    ? `${order.address.address}, ${order.address.street}, ${order.address.city}, ${order.address.state}, ${order.address.postalCode}, ${order.address.country}`
    : '';

  const taskSpecs = tasks
    .filter((t: any) => !t.isDeleted)
    .map((t: any) => `Task: ${t.title}\n${t.description || ''}`)
    .join('\n\n');

  return [
    `Nama pelanggan: ${order.customerName || 'N/A'}`,
    `ID pesanan: ${order._id?.toString() || 'N/A'}`,
    products || manualItem ? `Item dipesan:\n${[products, manualItem].filter(Boolean).join('\n')}` : 'Item dipesan: N/A',
    addr ? `Alamat: ${addr}` : '',
    order.orderNotes ? `Nota pelanggan: ${order.orderNotes}` : '',
    notes ? `Nota pada muat naik: ${notes}` : '',
    taskSpecs ? `Spesifikasi tugas:\n${taskSpecs}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Verifies one uploaded file against the order + linked tasks.
 * Mirrors the ownership checks used elsewhere: the caller decides access.
 */
export async function verifyUploadedFile(opts: {
  file: FileRef;
  orderId?: string;
  taskId?: string;
  notes?: string;
}): Promise<VerificationResult> {
  const empty: VerificationResult = {
    ok: true,
    issues: [],
    summary: 'Pengesahan tidak dapat dijalankan.',
    textExtracted: null,
  };

  if (!aiConfigured()) return empty;

  const { file, orderId, taskId, notes } = opts;

  let order: any = null;
  if (orderId) {
    try {
      order = await OrderModel.findById(orderId).lean();
    } catch (err) {
      console.error('[ai] failed to load order:', (err as Error).message);
    }
  }

  let tasks: any[] = [];
  try {
    const taskFilter: Record<string, unknown> = {};
    if (taskId) taskFilter._id = taskId;
    else if (orderId) taskFilter.orderId = orderId;
    else return empty;
    tasks = await Task.find(taskFilter).lean();
  } catch (err) {
    console.error('[ai] failed to load tasks:', (err as Error).message);
  }

  // A customer upload without an order has nothing to compare against.
  if (!order && tasks.length === 0) {
    return { ...empty, summary: 'Tiada butiran pesanan untuk perbandingan.' };
  }

  const buffer = await downloadFile(file.path);
  if (!buffer) {
    return { ...empty, summary: 'Fail tidak dapat dimuat turun untuk disemak.' };
  }

  const textExtracted = await extractTextFromBuffer(buffer, file.mimetype, file.originalName);

  // Non-parseable (e.g. raw vector/design files) — nothing to compare.
  if (!textExtracted.trim()) {
    return { ...empty, textExtracted: null, summary: 'Tiada teks boleh diekstrak daripada fail.' };
  }

  const expected = buildExpectedDetails(order, tasks, notes);

  const system = [
    'You are a print-shop QC assistant for KAMPUNG CETAK.',
    'A customer uploaded a file against an order. Compare the text extracted from the uploaded file with the expected order/task details.',
    'Detect mismatches ONLY when the file clearly contradicts the expected details (e.g. different customer name, wrong item, wrong size, wrong quantity, wrong address/phone).',
    'Ignore minor formatting differences. Do not invent issues.',
    'Reply ONLY with JSON:',
    '{"issues": [{"field": "Nama", "found": "...", "expected": "...", "severity": "error|warning", "explanation": "..."}], "summary": "One short sentence in Bahasa Melayu", "ok": true|false}',
    '"ok" is false only when at least one severity="error" issue exists.',
  ].join(' ');

  const user = [
    `Nama fail: ${file.originalName}`,
    `Jenis fail: ${file.mimetype}`,
    '',
    '=== BUTIRAN YANG DIJANGKA (ORDER/TASK) ===',
    expected,
    '',
    '=== TEKS YANG DIEKSTRAK DARIPADA FAIL ===',
    textExtracted.slice(0, 20_000),
  ].join('\n');

  try {
    const result = await generateJson<{
      issues: VerificationIssue[];
      summary: string;
      ok: boolean;
    }>(system, user, { maxTokens: 2048 });

    const issues = Array.isArray(result.issues) ? result.issues.slice(0, 10) : [];
    const safeIssues: VerificationIssue[] = issues.map((i: any) => ({
      field: String(i.field || 'Lain-lain').slice(0, 60),
      found: String(i.found ?? '').slice(0, 200),
      expected: String(i.expected ?? '').slice(0, 200),
      severity: i.severity === 'error' ? 'error' : 'warning',
      explanation: String(i.explanation || '').slice(0, 300),
    }));

    return {
      ok: safeIssues.every((i) => i.severity !== 'error'),
      issues: safeIssues,
      summary: (result.summary || 'Pengesahan selesai.').slice(0, 300),
      textExtracted: textExtracted.slice(0, 5_000),
    };
  } catch (err) {
    console.error('[ai] verification LLM call failed:', (err as Error).message);
    return { ...empty, summary: 'Pengesahan gagal dilaksanakan.', textExtracted };
  }
}

/** Convenience: verify an already-saved FileUpload doc by id. */
export async function verifyFileUploadById(fileId: string): Promise<VerificationResult> {
  const doc = await FileUpload.findById(fileId).lean();
  if (!doc) {
    return { ok: true, issues: [], summary: 'Fail tidak dijumpai.', textExtracted: null };
  }
  return verifyUploadedFile({
    file: { path: doc.path, originalName: doc.originalName, mimetype: doc.mimetype },
    orderId: doc.orderId,
    taskId: doc.taskId,
    notes: doc.notes,
  });
}
