const express = require('express');
const router = express.Router();
const paymentSettingsController = require('../controllers/paymentSettingsController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Admin routes (require admin authentication)
router.get('/', authenticate, isAdmin, paymentSettingsController.getPaymentSettings);
router.put('/', authenticate, isAdmin, paymentSettingsController.updatePaymentSettings);
router.put('/gcash', authenticate, isAdmin, paymentSettingsController.updateGCashSettings);
router.put('/downpayment', authenticate, isAdmin, paymentSettingsController.updateDownpaymentSettings);
router.put('/gcash-config', authenticate, isAdmin, paymentSettingsController.updateGCashConfig);
router.get('/gcash-config', authenticate, isAdmin, paymentSettingsController.getGCashConfig);

// Public route for frontend to get payment settings (for order processing)
router.get('/public', paymentSettingsController.getPublicPaymentSettings);

module.exports = router;
