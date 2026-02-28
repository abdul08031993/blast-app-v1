const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
const Account = require('./models/Account');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const sessionsDir = path.join(__dirname, 'baileys_sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

const clients = new Map();

class WhatsAppClientBaileys {
    static async initialize(accountId, phoneNumber = null) {
        console.log(`\n🚀 [${accountId}] Initializing WhatsApp client...`);

        try {
            const account = await Account.findById(accountId);
            if (!account) throw new Error('Account not found');

            account.status = 'scanning';
            account.qrCode = null;
            await account.save();

            // PAKAI KONFIGURASI YANG BERHASIL DARI TEST
            const sessionPath = path.join(sessionsDir, accountId.toString());
            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

            const sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: 'silent' }),
                browser: ['Chrome', 'Linux', '120.0.0.0'],
                version: [2, 2413, 51], // Versi stabil dari test
                syncFullHistory: false,
                generateHighQualityLinkPreview: false,
                connectTimeoutMs: 60000,
                retryRequestDelayMs: 1000
            });

            clients.set(accountId, sock);
            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                // QR CODE - INI YANG PENTING!
                if (qr) {
                    console.log(`\n📱 [${accountId}] QR Code received!`);
                    
                    // Generate QR image untuk database
                    const qrDataURL = await qrcode.toDataURL(qr);
                    
                    const accountToUpdate = await Account.findById(accountId);
                    if (accountToUpdate) {
                        accountToUpdate.qrCode = qrDataURL;
                        accountToUpdate.status = 'scanning';
                        await accountToUpdate.save();
                        console.log(`✅ [${accountId}] QR saved to database`);
                        
                        // Simpan juga ke file untuk backup
                        const qrFile = path.join(__dirname, `qr-${accountId}.html`);
                        fs.writeFileSync(qrFile, `<img src="${qrDataURL}" />`);
                    }
                }

                // PAIRING CODE (jika minta pairing)
                if (phoneNumber && !sock.authState.creds.registered) {
                    try {
                        const formattedPhone = phoneNumber.replace(/\D/g, '');
                        const code = await sock.requestPairingCode(formattedPhone);
                        
                        console.log(`\n🔐 [${accountId}] Pairing Code: ${code}`);
                        
                        const accountToUpdate = await Account.findById(accountId);
                        if (accountToUpdate) {
                            accountToUpdate.pairingCode = code;
                            await accountToUpdate.save();
                        }
                    } catch (err) {
                        console.error(`❌ [${accountId}] Pairing error:`, err);
                    }
                }

                // CONNECTION OPEN
                if (connection === 'open') {
                    console.log(`\n✅✅✅ [${accountId}] CONNECTED!`);
                    
                    const accountToUpdate = await Account.findById(accountId);
                    if (accountToUpdate) {
                        accountToUpdate.status = 'connected';
                        accountToUpdate.qrCode = null;
                        await accountToUpdate.save();
                    }
                }

                // CONNECTION CLOSE
                if (connection === 'close') {
                    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                    console.log(`\n🔌 [${accountId}] Disconnected:`, reason);
                    
                    const accountToUpdate = await Account.findById(accountId);
                    if (accountToUpdate) {
                        accountToUpdate.status = 'disconnected';
                        accountToUpdate.qrCode = null;
                        await accountToUpdate.save();
                    }
                    clients.delete(accountId);
                }
            });

            return { 
                status: 'scanning', 
                message: 'Client initialized' 
            };

        } catch (error) {
            console.error(`❌ [${accountId}] Error:`, error);
            throw error;
        }
    }

    static async getQR(accountId) {
        const account = await Account.findById(accountId);
        return account ? account.qrCode : null;
    }

    static async disconnect(accountId) {
        const sock = clients.get(accountId);
        if (sock) {
            sock.end();
            clients.delete(accountId);
        }
    }
}

module.exports = WhatsAppClientBaileys;
