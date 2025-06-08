const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/user', orderController.getUserOrders);
router.post('/', orderController.createOrder);
router.get('/history', orderController.getUserOrders);
router.post('/:orderId/cancel', orderController.cancelOrder);

module.exports = router;