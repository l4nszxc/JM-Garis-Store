const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// User payment routes
router.post('/gcash/create-payment-only', authenticate, paymentController.createGCashPaymentOnly);
router.post('/gcash/create', authenticate, paymentController.createGCashPayment);
router.post('/gcash/create-downpayment', authenticate, paymentController.createGCashDownpayment);
router.get('/status/:orderId', authenticate, paymentController.checkPaymentStatus);
router.get('/status-by-payment-id/:paymentId', authenticate, paymentController.checkPaymentStatusByPaymentId);
router.get('/downpayment-status/:paymentId', authenticate, paymentController.checkDownpaymentStatus);

// Admin payment verification routes
router.get('/admin/pending', authenticate, paymentController.getPendingPayments);
router.post('/admin/verify', authenticate, paymentController.verifyGCashPayment);

module.exports = router;