const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create directories
const authDir = path.join(__dirname, 'auth');
const responsesDir = path.join(__dirname, 'responses');
if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
if (!fs.existsSync(responsesDir)) fs.mkdirSync(responsesDir, { recursive: true });

async function startBot() {
    console.log('📱 Wisma WhatsApp Bot');
    console.log('====================\n');

    // Load auth state
    const { state, saveState } = await useMultiFileAuthState(authDir);

    // Get latest version
    const { version } = await fetchLatestBaileysVersion();
    console.log(`Baileys v${version.join('.')}\n`);

    // Create socket
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browserDescription: ['Wisma Bot', 'Chrome', '1.0.0'],
    });

    // Save auth on update
    sock.ev.on('creds.update', saveState);

    // Connection events
    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('\n========================================');
            console.log('📸  SCAN QR CODE INI DI WHATSAPP:');
            console.log('========================================\n');
        }

        if (connection === 'open') {
            console.log('\n✅ WhatsApp CONNECTED!\n');
            console.log('Bot siap menerima pesan...\n');
        }

        if (connection === 'close') {
            console.log('\n❌ Koneksi terputus');
            if (lastDisconnect?.error?.output?.statusCode !== 401) {
                console.log('🔄 Mencoba reconnect dalam 5 detik...\n');
                setTimeout(startBot, 5000);
            }
        }
    });

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            // Skip if own message or group
            if (msg.key.fromMe) continue;
            if (msg.key.remoteJid.endsWith('@g.us')) continue;

            // Get message text
            const messageText = msg.message?.conversation ||
                               msg.message?.extendedTextMessage?.text || '';

            if (!messageText.trim()) continue;

            const sender = msg.key.remoteJid;

            console.log(`📩 ${sender}: ${messageText}`);

            // Call Python bot
            try {
                const response = await callPythonBot(sender, messageText);

                if (response) {
                    // Send response via WhatsApp
                    await sock.sendMessage(sender, { text: response });
                    console.log(`📤 Response sent: ${response.substring(0, 50)}...\n`);
                }
            } catch (err) {
                console.error('Error:', err);
                await sock.sendMessage(sender, {
                    text: 'Maaf, terjadi kesalahan. Ketik *menu* untuk mencoba lagi.'
                });
            }
        }
    });
}

// Call Python bot
function callPythonBot(sender, message) {
    return new Promise((resolve, reject) => {
        const pythonScript = `
import sys
sys.path.insert(0, '${path.join(__dirname, '..', 'wisma-bot').replace(/\\/g, '\\\\')}')
import os
os.chdir('${path.join(__dirname, '..', 'wisma-bot').replace(/\\/g, '\\\\')}')

from handlers import WismaHandler
from db import init_db

init_db()
handler = WismaHandler()
result = handler.handle_message('${sender}', '''${message.replace(/'/g, "\\'")}''')
print(result if result else '')
`;

        const proc = spawn('python3', ['-c', pythonScript], {
            cwd: path.join(__dirname, '..', 'wisma-bot')
        });

        let output = '';
        proc.stdout.on('data', (data) => { output += data; });
        proc.stderr.on('data', (data) => { /* ignore stderr */ });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`Python exited with code ${code}`));
            }
        });

        proc.on('error', reject);
    });
}

// Run
startBot().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});