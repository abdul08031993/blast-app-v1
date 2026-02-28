const Account = require('../models/Account');
const WhatsAppClientBaileys = require('../whatsappClientBaileys');

// User menambahkan akun WhatsApp sendiri
const addOwnAccount = async (req, res) => {
  try {
    console.log('\n📱 User adding new WhatsApp account');
    console.log('User ID:', req.userId);
    console.log('Request body:', req.body);

    const { phoneNumber, accountName } = req.body;

    // Validasi input
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Cek apakah nomor sudah terdaftar untuk user ini
    const existingAccount = await Account.findOne({
      userId: req.userId,
      phoneNumber: phoneNumber
    });

    if (existingAccount) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Buat akun baru
    const account = new Account({
      userId: req.userId,
      phoneNumber,
      accountName: accountName || `Akun ${phoneNumber}`,
      status: 'disconnected',
      blastConfig: {
        contactsCount: 0,
        delay: 5,
        isActive: false,
        pricePerBlast: 100 // Default price
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
    console.log('✅ Account created:', account._id);

    res.status(201).json({
      message: 'Account added successfully',
      account: {
        id: account._id,
        phoneNumber: account.phoneNumber,
        accountName: account.accountName,
        status: account.status
      }
    });

  } catch (error) {
    console.error('❌ Error adding account:', error);
    res.status(500).json({ error: error.message });
  }
};

// User menghapus akunnya sendiri
const deleteOwnAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await Account.findOne({
      _id: accountId,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Disconnect dulu jika connected
    if (account.status === 'connected') {
      await WhatsAppClientBaileys.disconnect(accountId);
    }

    await Account.deleteOne({ _id: accountId });
    console.log('✅ Account deleted:', accountId);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting account:', error);
    res.status(500).json({ error: error.message });
  }
};

// User mengupdate nama akun
const updateOwnAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { accountName } = req.body;

    const account = await Account.findOneAndUpdate(
      { _id: accountId, userId: req.userId },
      { accountName },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({
      message: 'Account updated',
      account: {
        id: account._id,
        accountName: account.accountName
      }
    });

  } catch (error) {
    console.error('❌ Error updating account:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addOwnAccount,
  deleteOwnAccount,
  updateOwnAccount
};