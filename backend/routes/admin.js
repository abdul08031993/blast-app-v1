const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Semua route memerlukan auth admin
router.use(adminAuth);

// ==================== MANAJEMEN AKUN ====================
router.post('/accounts', adminController.createAccount);
router.get('/accounts', adminController.getAccounts);
router.get('/accounts/:id', adminController.getAccountDetail);
router.put('/accounts/:id', adminController.updateAccount);
router.delete('/accounts/:id', adminController.deleteAccount);

// ==================== MANAJEMEN WHATSAPP ====================
router.get('/accounts/:id/qr', adminController.getAccountQR);
router.post('/accounts/:id/disconnect', adminController.disconnectAccount);

// ==================== STATISTIK ====================
router.get('/stats', adminController.getStats);

// ==================== MANAJEMEN WITHDRAWAL ====================
router.get('/withdrawals', adminController.getWithdrawals);
router.put('/withdrawals/:userId/:withdrawalId', adminController.processWithdrawal);

module.exports = router;
