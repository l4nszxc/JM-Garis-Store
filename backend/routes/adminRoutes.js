const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController'); 
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/stats', authenticate, isAdmin, adminController.getStats);
router.get('/users', authenticate, isAdmin, adminController.getAllUsers);
router.get('/staff', authenticate, isAdmin, adminController.getAllStaff);
router.post('/recruit-staff', authenticate, isAdmin, adminController.recruitStaff);
router.post('/products', authenticate, isAdmin, productController.insertProduct);
router.get('/dashboard-stats', authenticate, isAdmin, adminController.getDashboardStats);
router.put('/products/:id', authenticate, isAdmin, productController.updateProduct);
router.put('/staff/:id', authenticate, isAdmin, adminController.updateStaff);
router.delete('/staff/:id', authenticate, isAdmin, adminController.deleteStaff);
router.get('/orders', authenticate, isAdmin, adminController.getAllOrders);
router.get('/orders/:orderId', authenticate, isAdmin, adminController.getOrderDetails);
router.put('/orders/:orderId/pay', authenticate, isAdmin, adminController.processPayment);
router.delete('/products/:id', authenticate, isAdmin, adminController.deleteProduct);
router.get('/rewards/tiers', authenticate, isAdmin, adminController.getAllRewardTiers);
router.post('/rewards/tiers', authenticate, isAdmin, adminController.createRewardTier);
router.put('/rewards/tiers/:id', authenticate, isAdmin, adminController.updateRewardTier);
router.delete('/rewards/tiers/:id', authenticate, isAdmin, adminController.deleteRewardTier);
router.get('/rewards/statistics', authenticate, isAdmin, adminController.getRewardsStatistics);
router.get('/forecasts', adminController.getProductForecasts);
router.get('/low-stock', authenticate, isAdmin, adminController.getLowStockItems);
router.get('/receipt-settings', authenticate, isAdmin, adminController.getReceiptSettings);
router.post('/receipt-settings', authenticate, isAdmin, adminController.saveReceiptSettings);


module.exports = router;