const Account = require('../models/Account');
const BlastLog = require('../models/BlastLog');
const WhatsAppClientBaileys = require('../whatsappClientBaileys');

// ==================== FUNGSI GET USER ACCOUNTS ====================
const getUserAccounts = async (req, res) => {
  try {
    console.log('📋 Fetching accounts for user:', req.userId);
    const accounts = await Account.find({ userId: req.userId });
    console.log(`✅ Found ${accounts.length} accounts`);
    res.json(accounts);
  } catch (error) {
    console.error('❌ Error in getUserAccounts:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== FUNGSI GET USER STATS ====================
const getUserStats = async (req, res) => {
  try {
    console.log('📊 Fetching stats for user:', req.userId);
    const accounts = await Account.find({ userId: req.userId });
    
    const stats = {
      totalAccounts: accounts.length,
      connectedAccounts: accounts.filter(a => a.status === 'connected').length,
      totalBlasted: accounts.reduce((sum, a) => sum + (a.stats?.totalBlasted || 0), 0),
      todayBlasted: 0
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const logs = await BlastLog.find({
      userId: req.userId,
      createdAt: { $gte: today }
    });

    stats.todayBlasted = logs.length;

    console.log('✅ Stats fetched:', stats);
    res.json({
      accounts,
      stats
    });
  } catch (error) {
    console.error('❌ Error in getUserStats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== FUNGSI GET ACCOUNT DETAIL ====================
const getAccountDetail = async (req, res) => {
  try {
    const { accountId } = req.params; // Perhatikan: pakai accountId, bukan id
    console.log(`🔍 Fetching account detail for ID: ${accountId}`);
    
    const account = await Account.findOne({ 
      _id: accountId, 
      userId: req.userId 
    });

    if (!account) {
      console.log('❌ Account not found');
      return res.status(404).json({ error: 'Account not found' });
    }

    const recentBlasts = await BlastLog.find({ accountId: accountId })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('✅ Account detail fetched');
    res.json({
      account,
      recentBlasts
    });
  } catch (error) {
    console.error('❌ Error in getAccountDetail:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== FUNGSI CONNECT ACCOUNT (QR) ====================
const connectAccount = async (req, res) => {
  try {
    const { accountId } = req.params; // Perhatikan: pakai accountId
    
    console.log(`🔌 [${accountId}] Connecting with QR...`);
    
    const account = await Account.findOne({ 
      _id: accountId, 
      userId: req.userId 
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // PAKAI KONFIGURASI YANG BERHASIL
    const result = await WhatsAppClientBaileys.initialize(accountId);
    
    res.json({ 
      success: true,
      message: 'QR code akan muncul dalam beberapa detik',
      status: result.status
    });
    
  } catch (error) {
    console.error('❌ Error in connectAccount:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== FUNGSI GET QR CODE ====================
const getQRCode = async (req, res) => {
  try {
    const { accountId } = req.params; // Perhatikan: pakai accountId
    
    console.log(`🖼️ Getting QR for account ${accountId}`);
    
    const account = await Account.findOne({ 
      _id: accountId, 
      userId: req.userId 
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    console.log('QR exists:', account.qrCode ? 'YES' : 'NO');
    
    res.json({ qr: account.qrCode });
    
  } catch (error) {
    console.error('❌ Error in getQRCode:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== FUNGSI DISCONNECT ACCOUNT ====================
const disconnectAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    console.log(`🔌 User disconnecting account: ${accountId}`);

    const account = await Account.findOne({
      _id: accountId,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await WhatsAppClientBaileys.disconnect(accountId);

    account.status = 'disconnected';
    account.qrCode = null;
    await account.save();

    res.json({ message: 'Account disconnected' });

  } catch (error) {
    console.error('❌ Error disconnecting:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== FUNGSI TAMBAHAN (Opsional) ====================
// Connect dengan Pairing Code (LEBIH STABIL!)
const connectWithPairing = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { phoneNumber } = req.body;

    console.log(`\n📞 [${accountId}] ===== PAIRING CODE REQUEST =====`);
    console.log(`Phone: ${phoneNumber}`);

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const account = await Account.findOne({ 
      _id: accountId, 
      userId: req.userId 
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    if (formattedPhone.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    console.log(`📞 Formatted phone: ${formattedPhone}`);
    console.log(`🔄 Initializing Baileys with pairing mode...`);

    const result = await WhatsAppClientBaileys.initialize(accountId, formattedPhone);

    console.log(`✅ Pairing initiated, status: ${result.status}`);

    res.json({
      success: true,
      message: 'Pairing code akan muncul di terminal server',
      status: result.status,
      note: 'Cek terminal untuk kode 8 digit'
    });

  } catch (error) {
    console.error('❌ Pairing error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Connect dengan QR (fallback)
const connectWithQR = async (req, res) => {
  try {
    const { accountId } = req.params;

    console.log(`\n📱 [${accountId}] ===== QR CODE REQUEST =====`);

    const account = await Account.findOne({ 
      _id: accountId, 
      userId: req.userId 
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const result = await WhatsAppClientBaileys.initialize(accountId);

    console.log(`✅ QR initiated, status: ${result.status}`);

    res.json({
      success: true,
      message: 'QR code akan muncul dalam beberapa detik',
      status: result.status,
      note: 'Refresh halaman untuk melihat QR code'
    });

  } catch (error) {
    console.error('❌ QR error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk mendapatkan pairing code
const getPairingCode = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const account = await Account.findOne({ 
      _id: accountId, 
      userId: req.userId 
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ pairingCode: account.pairingCode });
    
  } catch (error) {
    console.error('❌ Error in getPairingCode:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== EXPORTS ====================
module.exports = {
  getUserAccounts,
  getUserStats,
  getAccountDetail,
  connectAccount,
  getQRCode,
  disconnectAccount,
  connectWithPairing,
  connectWithQR,
  getPairingCode
};