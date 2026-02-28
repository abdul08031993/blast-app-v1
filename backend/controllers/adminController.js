const Account = require('../models/Account');
const User = require('../models/User');
const BlastLog = require('../models/BlastLog');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

// Store active WhatsApp clients
const clients = new Map();

// ==================== MANAJEMEN AKUN ====================

const createAccount = async (req, res) => {
  try {
    const { userId, phoneNumber, accountName, contactsCount, delay, pricePerBlast } = req.body;

    // Validasi user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cek apakah nomor sudah terdaftar untuk user ini
    const existingAccount = await Account.findOne({ 
      userId, 
      phoneNumber 
    });
    
    if (existingAccount) {
      return res.status(400).json({ error: 'Phone number already registered for this user' });
    }

    const account = new Account({
      userId,
      phoneNumber,
      accountName: accountName || `Akun ${phoneNumber}`,
      blastConfig: {
        contactsCount: contactsCount || 0,
        delay: delay || 5,
        isActive: false,
        pricePerBlast: pricePerBlast || 100 // Default Rp 100 per blast
      },
      stats: {
        totalBlasted: 0,
        successCount: 0,
        failedCount: 0,
        todayBlasted: 0,
        todayEarnings: 0,
        totalEarnings: 0
      }
    });

    await account.save();

    res.status(201).json({
      message: 'Account created successfully',
      account
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate('userId', 'username name email balance')
      .sort({ createdAt: -1 });

    // Tambahkan informasi penghasilan
    const accountsWithEarnings = accounts.map(account => {
      const accountObj = account.toObject();
      
      // Hitung potensi penghasilan
      const earningsPerBlast = account.blastConfig?.pricePerBlast || 100;
      const totalEarnings = (account.stats?.successCount || 0) * earningsPerBlast;
      const todayEarnings = (account.stats?.todayBlasted || 0) * earningsPerBlast;
      
      accountObj.earnings = {
        perBlast: earningsPerBlast,
        total: totalEarnings,
        today: todayEarnings,
        pending: account.earnings?.filter(e => e.status === 'pending')?.reduce((sum, e) => sum + e.amount, 0) || 0
      };
      
      return accountObj;
    });

    res.json(accountsWithEarnings);
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAccountDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const account = await Account.findById(id)
      .populate('userId', 'username name email balance bankAccount');

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Ambil riwayat blast
    const blastLogs = await BlastLog.find({ accountId: id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Ambil riwayat earnings
    const earnings = account.earnings || [];

    res.json({
      account,
      blastLogs,
      earnings
    });
  } catch (error) {
    console.error('Error getting account detail:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      accountName, 
      phoneNumber, 
      contactsCount, 
      delay, 
      message, 
      pricePerBlast,
      isActive 
    } = req.body;

    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Update field yang diberikan
    if (accountName !== undefined) account.accountName = accountName;
    if (phoneNumber !== undefined) account.phoneNumber = phoneNumber;
    if (contactsCount !== undefined) account.blastConfig.contactsCount = contactsCount;
    if (delay !== undefined) account.blastConfig.delay = delay;
    if (message !== undefined) account.blastConfig.message = message;
    if (pricePerBlast !== undefined) account.blastConfig.pricePerBlast = pricePerBlast;
    
    // Handle aktivasi blast
    if (isActive !== undefined) {
      account.blastConfig.isActive = isActive;
      
      // Jika diaktifkan, mulai proses blast
      if (isActive && account.status === 'connected') {
        // Jalankan di background tanpa menunggu
        setTimeout(() => startBlasting(account._id), 1000);
      }
    }

    await account.save();

    res.json({
      message: 'Account updated successfully',
      account
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hapus client jika ada
    if (clients.has(id)) {
      const client = clients.get(id);
      await client.destroy();
      clients.delete(id);
    }

    // Hapus account dari database
    await Account.findByIdAndDelete(id);
    
    // Hapus juga blast logs (optional)
    await BlastLog.deleteMany({ accountId: id });

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== MANAJEMEN WHATSAPP ====================

const getAccountQR = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Jika sudah ada client, disconnect dulu
    if (clients.has(id)) {
      const oldClient = clients.get(id);
      await oldClient.destroy();
      clients.delete(id);
    }

    // Create WhatsApp client with better config
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: id.toString()
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      }
    });

    clients.set(id, client);

    // Handle QR code
    client.on('qr', async (qr) => {
      try {
        console.log(`📱 QR Code received for account ${id}`);
        const qrImage = await qrcode.toDataURL(qr);
        
        account.qrCode = qrImage;
        account.status = 'scanning';
        await account.save();

        // Kirim response jika masih dalam request yang sama
        if (!res.headersSent) {
          res.json({ qr: qrImage, status: 'scanning' });
        }
      } catch (error) {
        console.error('Error generating QR:', error);
      }
    });

    // Handle ready
    client.on('ready', async () => {
      console.log(`✅ Client ready for account ${id}`);
      account.status = 'connected';
      account.qrCode = null;
      await account.save();
    });

    // Handle authenticated
    client.on('authenticated', () => {
      console.log(`🔑 Authenticated for account ${id}`);
    });

    // Handle auth failure
    client.on('auth_failure', async (msg) => {
      console.error(`❌ Auth failure for account ${id}:`, msg);
      account.status = 'disconnected';
      await account.save();
      clients.delete(id);
    });

    // Handle disconnected
    client.on('disconnected', async (reason) => {
      console.log(`🔌 Disconnected for account ${id}:`, reason);
      account.status = 'disconnected';
      await account.save();
      clients.delete(id);
    });

    // Initialize
    await client.initialize();

    // Timeout handler
    setTimeout(() => {
      if (!res.headersSent) {
        res.json({ status: 'scanning', message: 'QR code akan muncul dalam beberapa detik' });
      }
    }, 5000);

  } catch (error) {
    console.error('Error getting QR:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error: ' + error.message });
    }
  }
};

const disconnectAccount = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (clients.has(id)) {
      const client = clients.get(id);
      await client.destroy();
      clients.delete(id);
      
      const account = await Account.findById(id);
      if (account) {
        account.status = 'disconnected';
        account.qrCode = null;
        await account.save();
      }
    }

    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== PROSES BLAST ====================

const startBlasting = async (accountId) => {
  const account = await Account.findById(accountId);
  if (!account) {
    console.error('Account not found for blasting');
    return;
  }

  const client = clients.get(accountId);
  if (!client || account.status !== 'connected') {
    console.log(`Cannot blast: client not ready for account ${accountId}`);
    account.blastConfig.isActive = false;
    await account.save();
    return;
  }

  console.log(`\n🚀 Starting blast for account ${account.accountName}`);
  console.log(`Target: ${account.blastConfig.contactsCount} contacts`);
  console.log(`Delay: ${account.blastConfig.delay} seconds`);
  console.log(`Price per blast: Rp ${account.blastConfig.pricePerBlast}`);

  account.stats.lastBlast = new Date();
  await account.save();

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < account.blastConfig.contactsCount; i++) {
    // Cek apakah masih aktif
    const currentAccount = await Account.findById(accountId);
    if (!currentAccount.blastConfig.isActive) {
      console.log('⏸️ Blast stopped by user');
      break;
    }

    // Simulasi nomor kontak (nanti bisa diganti dengan import dari file)
    const contactNumber = `628${Math.floor(Math.random() * 1000000000)}`;
    
    try {
      // TODO: Implement actual message sending
      // await client.sendMessage(`${contactNumber}@c.us`, account.blastConfig.message);
      
      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log success
      const log = new BlastLog({
        accountId: account._id,
        userId: account.userId,
        contactNumber,
        message: account.blastConfig.message,
        status: 'success',
        sentAt: new Date()
      });
      await log.save();

      successCount++;
      
      // Hitung penghasilan
      const earningsPerBlast = account.blastConfig.pricePerBlast || 100;
      
      // Update account stats
      await Account.findByIdAndUpdate(accountId, {
        $inc: {
          'stats.successCount': 1,
          'stats.totalBlasted': 1,
          'stats.todayBlasted': 1,
          'stats.todayEarnings': earningsPerBlast,
          'stats.totalEarnings': earningsPerBlast
        },
        $push: {
          earnings: {
            date: new Date(),
            amount: earningsPerBlast,
            blastCount: 1,
            status: 'pending'
          }
        }
      });

      // Update user balance
      await User.findByIdAndUpdate(account.userId, {
        $inc: {
          'balance.totalEarned': earningsPerBlast,
          'balance.current': earningsPerBlast
        }
      });

      console.log(`✅ [${i+1}/${account.blastConfig.contactsCount}] Sent to ${contactNumber}`);

    } catch (error) {
      console.error(`❌ Failed to send to ${contactNumber}:`, error.message);

      // Log failure
      const log = new BlastLog({
        accountId: account._id,
        userId: account.userId,
        contactNumber,
        message: account.blastConfig.message,
        status: 'failed',
        error: error.message,
        sentAt: new Date()
      });
      await log.save();

      failedCount++;

      await Account.findByIdAndUpdate(accountId, {
        $inc: { 'stats.failedCount': 1 }
      });
    }

    // Delay antar pengiriman
    await new Promise(resolve => setTimeout(resolve, account.blastConfig.delay * 1000));
  }

  // Selesai blast
  await Account.findByIdAndUpdate(accountId, {
    'blastConfig.isActive': false
  });

  console.log(`\n✅ Blast completed for account ${account.accountName}`);
  console.log(`Success: ${successCount}, Failed: ${failedCount}`);
  console.log(`Total earnings: Rp ${successCount * (account.blastConfig.pricePerBlast || 100)}`);
};

// ==================== STATISTIK ====================

const getStats = async (req, res) => {
  try {
    const totalAccounts = await Account.countDocuments();
    const activeAccounts = await Account.countDocuments({ 'blastConfig.isActive': true });
    const connectedAccounts = await Account.countDocuments({ status: 'connected' });
    
    const totalBlasts = await BlastLog.countDocuments();
    const successBlasts = await BlastLog.countDocuments({ status: 'success' });
    const failedBlasts = await BlastLog.countDocuments({ status: 'failed' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBlasts = await BlastLog.countDocuments({
      createdAt: { $gte: today }
    });

    // Statistik penghasilan
    const accounts = await Account.find();
    const totalEarnings = accounts.reduce((sum, acc) => sum + (acc.stats?.totalEarnings || 0), 0);
    const todayEarnings = accounts.reduce((sum, acc) => sum + (acc.stats?.todayEarnings || 0), 0);
    
    // Pending withdrawals
    const pendingWithdrawals = await User.aggregate([
      { $unwind: '$withdrawals' },
      { $match: { 'withdrawals.status': 'pending' } },
      { $group: { _id: null, total: { $sum: '$withdrawals.amount' } } }
    ]);

    res.json({
      accounts: {
        total: totalAccounts,
        active: activeAccounts,
        connected: connectedAccounts
      },
      blasts: {
        total: totalBlasts,
        success: successBlasts,
        failed: failedBlasts,
        today: todayBlasts
      },
      earnings: {
        total: totalEarnings,
        today: todayEarnings,
        pending: pendingWithdrawals[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== MANAJEMEN WITHDRAWAL ====================

const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await User.find(
      { 'withdrawals.0': { $exists: true } },
      { username: 1, name: 1, email: 1, 'withdrawals': 1 }
    ).sort({ 'withdrawals.requestedAt': -1 });

    // Format data
    const allWithdrawals = [];
    withdrawals.forEach(user => {
      user.withdrawals.forEach(w => {
        allWithdrawals.push({
          _id: w._id,
          userId: user._id,
          userName: user.name || user.username,
          amount: w.amount,
          bankName: w.bankName,
          accountNumber: w.accountNumber,
          accountName: w.accountName,
          status: w.status,
          requestedAt: w.requestedAt,
          processedAt: w.processedAt,
          notes: w.notes
        });
      });
    });

    res.json(allWithdrawals);
  } catch (error) {
    console.error('Error getting withdrawals:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const processWithdrawal = async (req, res) => {
  try {
    const { userId, withdrawalId } = req.params;
    const { status, notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cari withdrawal
    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    // Update status
    withdrawal.status = status;
    withdrawal.processedAt = new Date();
    if (notes) withdrawal.notes = notes;

    // Jika ditolak, kembalikan saldo
    if (status === 'failed') {
      user.balance.pending -= withdrawal.amount;
      user.balance.current += withdrawal.amount;
    } else if (status === 'success') {
      user.balance.pending -= withdrawal.amount;
    }

    await user.save();

    res.json({
      message: `Withdrawal ${status}`,
      withdrawal
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== EXPORTS ====================

module.exports = {
  // Manajemen Akun
  createAccount,
  getAccounts,
  getAccountDetail,
  updateAccount,
  deleteAccount,
  
  // Manajemen WhatsApp
  getAccountQR,
  disconnectAccount,
  
  // Proses Blast
  startBlasting,
  
  // Statistik
  getStats,
  
  // Manajemen Withdrawal
  getWithdrawals,
  processWithdrawal
};
