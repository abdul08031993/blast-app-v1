const { create } = require('wailey-whatsapp-lib');
const Account = require('./models/Account');

const clients = new Map();

class WhatsAppClientPairing {
  static async initializeWithPairing(accountId, phoneNumber) {
    console.log(`\n🚀 [${accountId}] Initializing with PAIRING CODE...`);
    
    try {
      const account = await Account.findById(accountId);
      if (!account) throw new Error('Account not found');

      // Buat client dengan pairing mode
      const client = create({
        sessionPath: `./sessions/${accountId}`,
        printQRInTerminal: false // Matikan QR
      });

      clients.set(accountId, client);

      // Event: Pairing Code (bukan QR!)
      client.on('pairing_code', async (code) => {
        console.log(`\n🔐 [${accountId}] ===== PAIRING CODE =====`);
        console.log(`Kode 8 digit: \x1b[42m\x1b[30m ${code} \x1b[0m`); // Highlight hijau
        console.log('\n📱 Cara menggunakan:');
        console.log('1. Buka WhatsApp di HP');
        console.log('2. Menu > Perangkat Tertaut');
        console.log('3. Tap "Tautkan Perangkat"');
        console.log('4. Di layar QR, tap "Tautkan dengan nomor telepon"');
        console.log(`5. Masukkan kode: ${code}`);
        
        // Simpan kode ke database (opsional)
        account.pairingCode = code;
        await account.save();
      });

      // Event: Siap
      client.on('authenticated', async (user) => {
        console.log(`\n✅✅✅ [${accountId}] AUTHENTICATED!`);
        account.status = 'connected';
        account.qrCode = null;
        await account.save();
      });

      client.on('auth_failure', (msg) => {
        console.error(`❌ [${accountId}] Auth failure:`, msg);
      });

      client.on('disconnected', async (reason) => {
        console.log(`🔌 [${accountId}] Disconnected:`, reason);
        account.status = 'disconnected';
        await account.save();
        clients.delete(accountId);
      });

      // Inisialisasi dan minta pairing code
      await client.initialize();
      
      // Request pairing code dengan nomor telepon
      if (phoneNumber) {
        console.log(`📞 Requesting pairing code for ${phoneNumber}...`);
        await client.requestPairingCode(phoneNumber);
      }

      return { status: 'waiting_pairing', message: 'Check terminal for 8-digit code' };

    } catch (error) {
      console.error(`❌ [${accountId}] Error:`, error);
      throw error;
    }
  }

  static async getPairingCode(accountId) {
    const account = await Account.findById(accountId);
    return account ? account.pairingCode : null;
  }
}

module.exports = WhatsAppClientPairing;
