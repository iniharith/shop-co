require('dotenv').config();
const express = require('express');
const { TelegramBot } = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

const LOG_PORT = parseInt(process.env.LOG_PORT || '5002', 10);
const MAX_LOGS = 1000;
const capturedLogs = [];

function storeLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
  capturedLogs.push({ timestamp, level, message });
  if (capturedLogs.length > MAX_LOGS) capturedLogs.shift();
}

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

console.log = (...args) => {
  storeLog('log', ...args);
  originalLog.apply(console, args);
};
console.error = (...args) => {
  storeLog('error', ...args);
  originalError.apply(console, args);
};
console.warn = (...args) => {
  storeLog('warn', ...args);
  originalWarn.apply(console, args);
};
console.info = (...args) => {
  storeLog('info', ...args);
  originalInfo.apply(console, args);
};

const logApp = express();
logApp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
logApp.get('/api/logs', (req, res) => {
  res.json({ logs: capturedLogs });
});
logApp.listen(LOG_PORT, () => {
  originalLog(`[TELEGRAM] Log API Server running on port ${LOG_PORT}`);
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const SHARE_BASE_URL = process.env.SHARE_BASE_URL || 'https://admin.kampungcetak.com/share';
const PORTAL_FALLBACK_URL = process.env.PORTAL_FALLBACK_URL || 'https://studioivory.art';

if (!BOT_TOKEN || BOT_TOKEN.includes('REPLACE_WITH_YOUR_BOT_TOKEN')) {
  console.error('[TELEGRAM] TELEGRAM_BOT_TOKEN belum ditetapkan. Sila cipta bot di @BotFather dan masukkan token dalam ai-agent/.env');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'placeholder' });

const db = new sqlite3.Database('./telegram_orders.db', (err) => {
  if (err) {
    console.error('[TELEGRAM] Error opening database:', err.message);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS conversations (
      chat_id INTEGER PRIMARY KEY,
      order_id TEXT,
      username TEXT,
      state TEXT,
      updated_at DATETIME
    )`);
  }
});

const WELCOME_MSG = `Selamat datang ke KAMPUNG CETAK! 🖨️

Saya akan membantu memuat naik artwork anda dalam 3 langkah:
1️⃣ Hantar *Nombor Pesanan* (Order ID) anda
2️⃣ Hantar *Nama* anda
3️⃣ Hantar artwork anda (imej JPG/PNG atau PDF, maksimum 20MB setiap fail)

Sila hantar Nombor Pesanan anda sekarang:`;

function getConversation(chatId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM conversations WHERE chat_id = ?', [chatId], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function saveConversation(chatId, data) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO conversations (chat_id, order_id, username, state, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(chat_id) DO UPDATE SET
         order_id = excluded.order_id,
         username = excluded.username,
         state = excluded.state,
         updated_at = datetime('now')`,
      [chatId, data.orderId || null, data.username || null, data.state || 'started'],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function parseJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

async function extractFromText(text) {
  try {
    const prompt = `Extract the Order ID (or order number) and Customer Name from this message from a printing shop customer. Return ONLY a JSON object: {"orderId": "id_here", "username": "name_here"}. If not found, leave empty strings. Message: "${text}"`;
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });
    return parseJson(response.text);
  } catch (e) {
    console.error('[TELEGRAM] Gemini text extraction failed:', e.message);
    return null;
  }
}

async function extractFromImage(mimeType, base64Data, caption) {
  try {
    const prompt = `Extract the Order ID (or order number) and Customer Name from this image or its caption: "${caption || ''}". This is a printing shop customer order. Return ONLY a JSON object: {"orderId": "id_here", "username": "name_here"}. If not found, leave empty strings.`;
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: mimeType } },
          ],
        },
      ],
    });
    return parseJson(response.text);
  } catch (e) {
    console.error('[TELEGRAM] Gemini image extraction failed:', e.message);
    return null;
  }
}

function extFromMime(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/tiff': 'tiff',
    'application/pdf': 'pdf',
  };
  return map[mimeType] || 'bin';
}

async function uploadToBackend(chatId, buffer, mimeType, originalName, orderId, username) {
  const safeExt = extFromMime(mimeType);
  const filename = `telegram_upload_${Date.now()}-${Math.round(Math.random() * 1e9)}.${safeExt}`;

  const urlRes = await axios.post(`${BACKEND_URL}/api/files/customer/upload-url`, {
    filename,
    contentType: mimeType,
    orderId,
    username,
  });
  const { url, key, publicUrl } = urlRes.data;

  await axios.put(url, buffer, {
    headers: { 'Content-Type': mimeType },
  });

  const saveRes = await axios.post(`${BACKEND_URL}/api/files/customer/save-metadata`, {
    files: [
      {
        key,
        originalName,
        mimetype: mimeType,
        size: buffer.length,
        path: publicUrl,
      },
    ],
    orderId,
    username,
    phoneNumber: `telegram-${chatId}`,
    item: 'Artwork via Telegram',
  });

  return saveRes.data;
}

async function handleText(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (text === '/start' || text === '/new' || text === '/mulakan') {
    await saveConversation(chatId, { state: 'awaiting_order' });
    await bot.sendMessage(chatId, WELCOME_MSG);
    return;
  }

  if (text === '/status') {
    const conv = await getConversation(chatId);
    if (conv && conv.order_id && conv.username) {
      await bot.sendMessage(chatId, `Pesanan anda: *${conv.order_id}*\nNama: *${conv.username}*\n\nSila hantar artwork anda.`);
    } else {
      await bot.sendMessage(chatId, 'Belum ada butiran pesanan. Hantar /start untuk bermula.');
    }
    return;
  }

  const conv = await getConversation(chatId);
  const state = (conv && conv.state) || 'awaiting_order';

  if (state === 'awaiting_order') {
    let orderId = text;
    const extracted = await extractFromText(text);
    if (extracted && extracted.orderId) orderId = extracted.orderId;
    await saveConversation(chatId, { orderId, state: 'awaiting_name' });
    await bot.sendMessage(chatId, `Baik! Pesanan *${orderId}* direkodkan. ✅\n\nSekarang sila berikan *Nama* anda (seperti dalam pesanan).`);
    return;
  }

  if (state === 'awaiting_name') {
    const orderId = (conv && conv.order_id) || null;
    let username = text;
    const extracted = await extractFromText(text);
    if (extracted && extracted.username) username = extracted.username;
    await saveConversation(chatId, { orderId, username, state: 'ready' });
    await bot.sendMessage(chatId, `Terima kasih *${username}*! ✅\n\nSila hantar artwork anda — imej (JPG/PNG) atau fail PDF. Maksimum 20MB setiap fail.`);
    return;
  }

  await bot.sendMessage(chatId, `Pesanan *${conv.order_id}* — *${conv.username}* sudah lengkap.\nSila hantar artwork anda, atau hantar /new untuk pesanan baharu.`);
}

async function handleMedia(msg) {
  const chatId = msg.chat.id;

  let fileId = null;
  let mimeType = null;
  let fileName = null;

  if (msg.photo && msg.photo.length) {
    const photo = msg.photo[msg.photo.length - 1];
    fileId = photo.file_id;
    mimeType = 'image/jpeg';
    fileName = `telegram_photo_${Date.now()}.jpg`;
  } else if (msg.document) {
    fileId = msg.document.file_id;
    mimeType = msg.document.mime_type || 'application/octet-stream';
    fileName = msg.document.file_name || `telegram_file_${Date.now()}`;
  } else {
    await bot.sendMessage(chatId, 'Sila hantar artwork dalam bentuk imej (JPG/PNG) atau fail PDF.');
    return;
  }

  let fileInfo;
  try {
    fileInfo = await bot.getFile(fileId);
  } catch (e) {
    console.error('[TELEGRAM] getFile failed:', e.message);
    await bot.sendMessage(chatId, 'Gagal membaca fail daripada Telegram. Sila cuba sekali lagi.');
    return;
  }

  if (fileInfo.file_size && fileInfo.file_size > MAX_FILE_SIZE) {
    await bot.sendMessage(
      chatId,
      `Fail anda terlalu besar (lebih daripada 20MB). Sila mampatkan atau bahagikan fail tersebut, atau muat naik melalui pautan ini:\n${PORTAL_FALLBACK_URL}`
    );
    return;
  }

  let buffer;
  try {
    const link = await bot.getFileLink(fileId);
    const res = await axios.get(link, { responseType: 'arraybuffer' });
    buffer = Buffer.from(res.data);
  } catch (e) {
    console.error('[TELEGRAM] File download failed:', e.message);
    await bot.sendMessage(chatId, 'Gagal memuat turun fail daripada Telegram. Sila cuba sekali lagi.');
    return;
  }

  const conv = await getConversation(chatId);
  let orderId = (conv && conv.order_id) || null;
  let username = (conv && conv.username) || null;

  if (!orderId || !username) {
    try {
      const extracted = await extractFromImage(mimeType, buffer.toString('base64'), msg.caption || '');
      if (extracted && extracted.orderId) orderId = extracted.orderId;
      if (extracted && extracted.username) username = extracted.username;
    } catch (e) {
      console.error('[TELEGRAM] Extraction fallback error:', e.message);
    }
  }

  if (!orderId || !username) {
    await bot.sendMessage(
      chatId,
      'Untuk memuat naik artwork, saya perlukan butiran pesanan dahulu.\n\nHantar /start dan ikuti langkah:\n1️⃣ Nombor Pesanan\n2️⃣ Nama\n3️⃣ Hantar artwork'
    );
    return;
  }

  await bot.sendMessage(chatId, '⏳ Sedang memuat naik fail anda...');

  try {
    const result = await uploadToBackend(chatId, buffer, mimeType, fileName, orderId, username);
    const slug = result.shareLinkSlug;
    const shareUrl = `${SHARE_BASE_URL}/${slug}`;
    await saveConversation(chatId, { orderId, username, state: 'ready' });
    await bot.sendMessage(
      chatId,
      `✅ Fail berjaya dimuat naik! Terima kasih kerana memilih KAMPUNG CETAK.\n\nPesanan: *${orderId}*\nNama: *${username}*\n\nAnda boleh menyemak fail anda di sini:\n${shareUrl}`
    );
  } catch (e) {
    console.error('[TELEGRAM] Upload failed:', e.message);
    const errDetail = (e.response && e.response.data && e.response.data.message) || e.message;
    await bot.sendMessage(chatId, `Maaf, terdapat ralat semasa memuat naik fail anda.\n${errDetail}`);
  }
}

bot.on('message', async (msg) => {
  try {
    if (!msg || !msg.chat) return;
    if (msg.chat.type !== 'private') return;

    if (msg.photo || msg.document) {
      await handleMedia(msg);
    } else if (msg.text) {
      await handleText(msg);
    } else {
      await bot.sendMessage(msg.chat.id, 'Sila hantar imej (JPG/PNG) atau fail PDF untuk artwork anda.');
    }
  } catch (e) {
    console.error('[TELEGRAM] Message handler error:', e.message);
    try {
      await bot.sendMessage(msg.chat.id, 'Maaf, berlaku ralat. Sila cuba semula.');
    } catch (_) {}
  }
});

bot.getMe()
  .then((me) => console.log(`[TELEGRAM] Bot @${me.username} is running. Link: https://t.me/${me.username}`))
  .catch((e) => console.error('[TELEGRAM] getMe failed:', e.message));
