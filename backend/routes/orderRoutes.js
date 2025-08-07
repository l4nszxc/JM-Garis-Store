const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/user', orderController.getUserOrders);
router.post('/', orderController.createOrder);
router.post('/cash-with-downpayment', orderController.createCashOrderWithDownpayment);
router.get('/history', orderController.getUserOrders);
router.post('/:orderId/cancel', orderController.cancelOrder);

// Fix: Change authMiddleware to authenticate
router.post('/:id/report', authenticate, orderController.submitOrderReport);
router.get('/:id/reports', authenticate, orderController.getOrderReports);

// Order Reviews - Fix: Change authMiddleware to authenticate
router.post('/:id/review', authenticate, orderController.submitOrderReview);
router.put('/:id/review', authenticate, orderController.updateOrderReview);
router.get('/:id/review', authenticate, orderController.getOrderReview);
router.post('/:orderId/repeat', authenticate, orderController.repeatOrder);

module.exports = router;