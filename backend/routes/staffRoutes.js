const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate } = require('../middleware/auth');

router.get('/orders/accepted', authenticate, staffController.getAcceptedOrders); 
router.get('/orders', authenticate, staffController.getAllOrders);
router.get('/orders/:orderId', authenticate, staffController.getOrderDetails);
router.put('/orders/:orderId/status', authenticate, staffController.updateOrderStatus);
router.post('/orders/:orderId/accept', authenticate, staffController.acceptOrder);
router.post('/orders/create', authenticate, staffController.createPhysicalOrder);


module.exports = router;