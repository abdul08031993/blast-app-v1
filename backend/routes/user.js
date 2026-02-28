const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');
const userAccountController = require('../controllers/userAccountController');
const earningsController = require('../controllers/earningsController');

// Semua route memerlukan autentikasi
router.use(auth);

// ==================== MANAJEMEN AKUN OLEH USER ====================
// User menambahkan akun WhatsApp sendiri
router.post('/accounts/add', userAccountController.addOwnAccount);

// User melihat semua akunnya
router.get('/accounts', userController.getUserAccounts);

// User melihat detail satu akun
router.get('/accounts/:accountId', userController.getAccountDetail);

// User mengupdate nama akun
router.put('/accounts/:accountId', userAccountController.updateOwnAccount);

// User menghapus akun
router.delete('/accounts/:accountId', userAccountController.deleteOwnAccount);

// ==================== KONEKSI WHATSAPP ====================
// User memulai koneksi WhatsApp (QR code)
router.post('/accounts/:accountId/connect', userController.connectAccount);

// User mendapatkan QR code
router.get('/accounts/:accountId/qr', userController.getQRCode);

// User disconnect WhatsApp
router.post('/accounts/:accountId/disconnect', userController.disconnectAccount);

// ==================== STATISTIK ====================
// User melihat statistik keseluruhan
router.get('/stats', userController.getUserStats);

// User melihat penghasilan per akun
router.get('/earnings/:accountId', earningsController.calculateEarnings);

// User melihat total saldo
router.get('/balance', earningsController.updateUserBalance);

// ==================== WITHDRAWAL ====================
// User minta tarik saldo
router.post('/withdraw', earningsController.requestWithdrawal);

module.exports = router;