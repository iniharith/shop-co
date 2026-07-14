require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'my_secure_verify_token';

// Initialize SQLite Database
const db = new sqlite3.Database('./ai_sales.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS conversations (
            phone_number TEXT PRIMARY KEY,
            last_interaction_time DATETIME,
            state TEXT
        )`);
    }
});

// Initialize Gemini (Will use GEMINI_API_KEY from .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'placeholder' });

// --- WHATSAPP WEBHOOK VERIFICATION ---
// Meta uses this to verify your webhook URL when you first set it up.
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// --- RECEIVE MESSAGES FROM WHATSAPP ---
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
            const from = body.entry[0].changes[0].value.messages[0].from;
            const message = body.entry[0].changes[0].value.messages[0];
            
            if (message.type === 'text') {
                const msgBody = message.text.body;
                console.log(`Received text message from ${from}: ${msgBody}`);
                
                try {
                    // 1. Process message with Gemini
                    const fs = require('fs');
                    const systemPrompt = fs.readFileSync('./system_prompt.txt', 'utf8');
                    
                    const response = await ai.models.generateContent({
                        model: 'gemini-1.5-flash',
                        contents: msgBody,
                        config: {
                            systemInstruction: systemPrompt
                        }
                    });
                    
                    const aiReply = response.text;
                    console.log(`AI Reply to ${from}: ${aiReply}`);

                    // 2. Send reply via WhatsApp API
                    await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            messaging_product: "whatsapp",
                            to: from,
                            text: { body: aiReply }
                        })
                    });

                    // 3. Update conversation tracker in DB
                    db.run(`INSERT INTO conversations (phone_number, last_interaction_time, state) 
                            VALUES (?, datetime('now'), 'active') 
                            ON CONFLICT(phone_number) DO UPDATE SET last_interaction_time=datetime('now')`, [from]);
                } catch (error) {
                    console.error("Error processing message:", error);
                }
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// --- DRAFT READY ENDPOINT (From your Backend) ---
app.post('/api/draft-ready', (req, res) => {
    const { customerPhone, draftUrl, orderId } = req.body;
    console.log(`Received draft ready notification for ${customerPhone} (Order: ${orderId}). URL: ${draftUrl}`);
    
    // TODO: Use Gemini to draft a message and send it to WhatsApp API
    
    res.status(200).json({ success: true, message: 'Draft notification received by AI agent' });
});

app.listen(PORT, () => {
    console.log(`AI Sales Agent server is running on port ${PORT}`);
});
