const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const Account = require('./models/Account');

const clients = new Map();

class WhatsAppClient {
  static async initialize(accountId) {
    console.log(`\n🚀 [${accountId}] Initializing WhatsApp client...`);
    
    try {
      const account = await Account.findById(accountId);
      if (!account) throw new Error('Account not found');

      account.status = 'scanning';
      account.qrCode = null;
      await account.save();

      const chromePath = '/home/harmed/.cache/puppeteer/chrome/linux-145.0.7632.77/chrome-linux64/chrome';

      // KONFIGURASI PALING STABLE - TANPA webVersionCache!
      // Branch webpack-exodus sudah handle otomatis
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: accountId.toString(),
          dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
          headless: true,
          executablePath: chromePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
          ]
        }
      });

      clients.set(accountId, client);

      client.on('qr', async (qr) => {
        console.log(`\n📱 [${accountId}] QR Code received!`);
        try {
          const qrDataURL = await qrcode.toDataURL(qr);
          
          const accountToUpdate = await Account.findById(accountId);
          if (accountToUpdate) {
            accountToUpdate.qrCode = qrDataURL;
            accountToUpdate.status = 'scanning';
            await accountToUpdate.save();
            console.log(`✅ [${accountId}] QR saved to database`);
          }
        } catch (error) {
          console.error(`❌ [${accountId}] Error:`, error);
        }
      });

      client.on('ready', async () => {
        console.log(`\n✅✅✅ [${accountId}] CLIENT IS READY!`);
        const accountToUpdate = await Account.findById(accountId);
        if (accountToUpdate) {
          accountToUpdate.status = 'connected';
          accountToUpdate.qrCode = null;
          await accountToUpdate.save();
        }
      });

      client.on('auth_failure', (msg) => {
        console.error(`❌ [${accountId}] Auth failure:`, msg);
      });

      client.on('disconnected', async (reason) => {
        console.log(`🔌 [${accountId}] Disconnected:`, reason);
        const accountToUpdate = await Account.findById(accountId);
        if (accountToUpdate) {
          accountToUpdate.status = 'disconnected';
          accountToUpdate.qrCode = null;
          await accountToUpdate.save();
        }
        clients.delete(accountId);
      });

      console.log(`🔄 [${accountId}] Initializing...`);
      await client.initialize();
      
      return { status: 'scanning', message: 'Client initialized' };

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
    const client = clients.get(accountId);
    if (client) {
      await client.destroy();
      clients.delete(accountId);
    }
  }
}

module.exports = WhatsAppClient;
