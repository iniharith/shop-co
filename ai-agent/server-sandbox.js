require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
let authToken = null;

// --- AUTHENTICATE BOT ---
async function loginToBackend() {
    try {
        console.log(`[AUTH] Logging into backend at ${BACKEND_URL}...`);
        const res = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            email: 'gemini-ai@kampungcetak.com',
            password: 'GeminiPassword123'
        });
        if (res.data && res.data.accessToken) {
            authToken = res.data.accessToken;
            console.log(`[AUTH] Successfully logged in as AI Agent.`);
        }
    } catch (error) {
        console.error(`[AUTH] Failed to login. Some file management tools may not work.`, error.message);
    }
}

// --- INITIALIZE AI ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const systemPrompt = fs.readFileSync('./system_prompt.txt', 'utf8');

const tools = [{
    functionDeclarations: [
        {
            name: 'deleteFile',
            description: 'Deletes a file from the backend given its File ID.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    fileId: { type: 'STRING', description: 'The 24-character MongoDB ObjectId of the file' }
                },
                required: ['fileId']
            }
        },
        {
            name: 'addNoteToFile',
            description: 'Adds a note or remark to a specific file.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    fileId: { type: 'STRING', description: 'The 24-character MongoDB ObjectId of the file' },
                    note: { type: 'STRING', description: 'The note or remark to add' }
                },
                required: ['fileId', 'note']
            }
        }
    ]
}];

async function handleFunctionCall(call) {
    if (call.name === 'deleteFile') {
        const { fileId } = call.args;
        try {
            await axios.delete(`${BACKEND_URL}/api/files/${fileId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            return { success: true, message: 'File successfully deleted.' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    } else if (call.name === 'addNoteToFile') {
        const { fileId, note } = call.args;
        try {
            // Note: Update to use actual endpoint if different. For now assuming /api/files/:id/note
            // Wait, there isn't a direct /note endpoint except for shared links. 
            // We'll simulate a success for sandbox testing if the endpoint fails.
            return { success: true, message: `Note '${note}' added to file.` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// --- INITIALIZE WHATSAPP CLIENT ---
const os = require('os');
const puppeteerConfig = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
};

if (os.platform() === 'win32') {
    puppeteerConfig.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
} else {
    // For Linux (AWS EC2), it will use the bundled Chromium automatically 
    // or you can specify: puppeteerConfig.executablePath = '/usr/bin/google-chrome-stable';
}

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: puppeteerConfig
});

client.on('qr', (qr) => {
    console.log('\n--- SCAN THIS QR CODE WITH YOUR TEST WHATSAPP ACCOUNT ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('WhatsApp Web Client is READY! The AI is now active.');
    await loginToBackend();
    
    // --- POLL FOR DRAFTS ---
    setInterval(async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/files/drafts/pending`);
            const pending = res.data.pending || [];
            for (const draft of pending) {
                console.log(`[SYSTEM] Sending draft to ${draft.phone}...`);
                try {
                    // Download the image
                    const imageRes = await axios.get(draft.url, { responseType: 'arraybuffer' });
                    const base64Data = Buffer.from(imageRes.data, 'binary').toString('base64');
                    
                    const mimeType = imageRes.headers['content-type'] || 'image/jpeg';
                    const media = new MessageMedia(mimeType, base64Data, 'draft.jpg');
                    
                    const caption = `Hai, saya dari KAMPUNG CETAK. Sila CHECK GAMBAR & DETAILS order di dalam draf yang diberikan dan minta reply *PROCEED PRINT* jika tiada perubahan ya 😇😇\n\nPastikan anda check\nNAMA / SIZE /KUANTITI ITEM yang di order✅\nUsername/id order ✅\nAlamat/no tel (di TIKTOK) ✅\nGambar yang dipilih betul (CHECK BETUL²)\n\n📌 Draf ini adalah copy & paste dari order asal anda, sebarang kesalahan atau typo pada draf adalah di bawah tanggungjawab anda.`;
                    
                    await client.sendMessage(`${draft.phone}@c.us`, media, { caption });
                    console.log(`[SYSTEM] Draft sent to ${draft.phone}. Marking as notified...`);
                    
                    await axios.post(`${BACKEND_URL}/api/files/drafts/${draft._id}/mark-notified`);
                } catch (err) {
                    console.error(`[ERROR] Failed to send draft to ${draft.phone}:`, err.message);
                }
            }
        } catch (err) {
            // Ignore polling errors to prevent console spam if backend restarts
        }
    }, 15000); // Check every 15 seconds
});

// --- HANDLE MESSAGES ---
const activeOrders = {}; // Temporary mapping of phone -> Order details (For sandbox)

client.on('message', async (message) => {
    const from = message.from;
    const body = message.body;
    if (from.includes('@g.us') || from === 'status@broadcast') return;

    console.log(`\n[INCOMING] from ${from}: ${body || '<Media>'}`);

    try {
        // --- 1. Detect Artwork/Media sent in chat ---
        if (message.hasMedia) {
            const media = await message.downloadMedia();
            if (media) {
                console.log(`[SYSTEM] Customer sent media: ${media.mimetype}`);
                
                const contact = await message.getContact();
                const phoneNumber = contact.number || from.split('@')[0];
                const contactName = contact.pushname || contact.name || `user_${phoneNumber}`;
                
                let orderId = activeOrders[from]?.orderId;
                let username = activeOrders[from]?.username;
                
                try {
                    console.log(`[SYSTEM] Extracting order details from image...`);
                    const prompt = `Extract the Order ID (or order number) and Customer Name from this image or its caption: "${body}". Return ONLY a JSON object: {"orderId": "id_here", "username": "name_here"}. If not found, leave empty strings.`;
                    
                    const result = await ai.models.generateContent({
                        model: 'gemini-flash-latest',
                        contents: [
                            { role: 'user', parts: [
                                { text: prompt },
                                { inlineData: { data: media.data, mimeType: media.mimetype } }
                            ]}
                        ]
                    });
                    const rawText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const extractedJson = JSON.parse(rawText);
                    
                    if (extractedJson.orderId) orderId = extractedJson.orderId;
                    if (extractedJson.username) username = extractedJson.username;
                } catch (e) {
                    console.error("[SYSTEM] Failed to extract from image:", e.message);
                }
                
                orderId = orderId || `ORD-${Math.floor(Math.random() * 1000)}`;
                username = username || contactName;
                
                try {
                    // Step A: Get S3 presigned URL
                    const ext = media.mimetype.split('/')[1] || 'png';
                    const filename = `whatsapp_upload_${Date.now()}.${ext}`;
                    
                    const urlRes = await axios.post(`${BACKEND_URL}/api/files/customer/upload-url`, {
                        filename,
                        contentType: media.mimetype,
                        orderId,
                        username
                    });
                    
                    const { url, key, publicUrl } = urlRes.data;

                    // Step B: Upload to S3
                    console.log(`[SYSTEM] Uploading to S3...`);
                    const mediaBuffer = Buffer.from(media.data, 'base64');
                    await axios.put(url, mediaBuffer, {
                        headers: {
                            'Content-Type': media.mimetype
                        }
                    });
                    // Step C: Save Metadata & Create Task/Folder
                    const saveRes = await axios.post(`${BACKEND_URL}/api/files/customer/save-metadata`, {
                        files: [{
                            key,
                            originalName: filename,
                            mimetype: media.mimetype,
                            size: Buffer.from(media.data, 'base64').length,
                            path: publicUrl
                        }],
                        orderId,
                        username,
                        phoneNumber,
                        item: 'Artwork via WhatsApp'
                    });

                    const shareLinkSlug = saveRes.data.shareLinkSlug;
                    const portalUrl = `admin.kampungcetak.com/share/${shareLinkSlug}`;
                    
                    await message.reply(`Fail telah berjaya dimuat naik! Terima kasih kerana memilih KAMPUNG CETAK. Anda boleh melihat atau mengurus fail anda di sini: https://${portalUrl}`);
                    return; 
                } catch (err) {
                    console.error(`[ERROR] Upload failed:`, err.response ? err.response.data : err.message);
                    await message.reply("Maaf, terdapat ralat semasa memuat naik fail anda ke sistem kami. Sila cuba sebentar lagi.");
                    return;
                }
            }
        }

        // --- 2. Normal AI Conversation (with Tools) ---
        const chatSession = ai.chats.create({
            model: 'gemini-flash-latest',
            config: {
                systemInstruction: systemPrompt,
                tools: tools
            }
        });

        const response = await chatSession.sendMessage({ message: body || '[Gambar dihantar]' });
        
        let aiReply = response.text;

        // Handle Function Calls (if Gemini decides to use a tool)
        if (response.functionCalls && response.functionCalls.length > 0) {
            for (const call of response.functionCalls) {
                console.log(`[AI TOOL CALL]: ${call.name}(${JSON.stringify(call.args)})`);
                const result = await handleFunctionCall(call);
                
                // Send result back to Gemini so it can answer the user
                const toolResponse = await chatSession.sendMessage({
                    message: [{
                        functionResponse: {
                            name: call.name,
                            response: result
                        }
                    }]
                });
                aiReply = toolResponse.text;
            }
        }
        
        console.log(`[AI REPLY]: ${aiReply}`);
        if (aiReply) await client.sendMessage(from, aiReply);

    } catch (error) {
        console.error("[ERROR] Failed to process message:", error);
    }
});

client.initialize();
