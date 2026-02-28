const Account = require('../models/Account');
const User = require('../models/User');
const BlastLog = require('../models/BlastLog');

// Hitung penghasilan dari blast sukses
const calculateEarnings = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const account = await Account.findOne({
      _id: accountId,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Hitung blast sukses hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBlasts = await BlastLog.countDocuments({
      accountId: accountId,
      status: 'success',
      createdAt: { $gte: today }
    });

    // Hitung penghasilan hari ini
    const todayEarnings = todayBlasts * (account.blastConfig.pricePerBlast || 100);

    // Update statistik akun
    account.stats.todayBlasted = todayBlasts;
    account.stats.todayEarnings = todayEarnings;
    account.stats.totalEarnings = (account.stats.successCount || 0) * (account.blastConfig.pricePerBlast || 100);
    
    await account.save();

    res.json({
      success: true,
      data: {
        todayBlasts,
        todayEarnings,
        totalEarnings: account.stats.totalEarnings,
        pricePerBlast: account.blastConfig.pricePerBlast
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update saldo user dari semua akun
const updateUserBalance = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Ambil semua akun user
    const accounts = await Account.find({ userId: userId });
    
    // Hitung total penghasilan dari semua akun
    let totalEarnings = 0;
    accounts.forEach(acc => {
      totalEarnings += (acc.stats.successCount || 0) * (acc.blastConfig.pricePerBlast || 100);
    });
    
    // Update saldo user
    const user = await User.findById(userId);
    if (user) {
      user.balance.totalEarned = totalEarnings;
      user.balance.current = totalEarnings - user.balance.pending;
      await user.save();
    }
    
    res.json({
      success: true,
      balance: {
        total: totalEarnings,
        current: user.balance.current,
        pending: user.balance.pending
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Request penarikan saldo
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    
    const user = await User.findById(req.userId);
    
    // Validasi saldo cukup
    if (amount > user.balance.current) {
      return res.status(400).json({ error: 'Saldo tidak cukup' });
    }
    
    // Kurangi saldo current, tambah ke pending
    user.balance.current -= amount;
    user.balance.pending += amount;
    
    // Tambah riwayat withdrawal
    user.withdrawals.push({
      amount,
      bankName,
      accountNumber,
      accountName,
      status: 'pending',
      requestedAt: new Date()
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Permintaan penarikan diproses',
      balance: user.balance
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  calculateEarnings,
  updateUserBalance,
  requestWithdrawal
};
