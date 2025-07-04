const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/gcash/create', authenticate, paymentController.createGCashPayment);
router.get('/result', paymentController.handlePaymentResult);
router.get('/status/:orderId', authenticate, paymentController.checkPaymentStatus);
router.post('/webhook', paymentController.webhookHandler); // PayMongo webhook

module.exports = router;