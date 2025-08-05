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
router.get('/sales-chart', authenticate, isAdmin, adminController.getSalesChartData);
router.get('/dashboard-stats', authenticate, isAdmin, adminController.getDashboardStats);
router.get('/top-customers', authenticate, isAdmin, adminController.getTopCustomers);
router.get('/top-products', authenticate, isAdmin, adminController.getTopProducts);

router.get('/order-reports', authenticate, isAdmin, adminController.getOrderReports);
router.get('/product-reports', authenticate, isAdmin, adminController.getProductReports);
router.put('/order-reports/:id', authenticate, isAdmin, adminController.updateOrderReport);
router.put('/product-reports/:id', authenticate, isAdmin, adminController.updateProductReport);
router.get('/receipt-settings/public', adminController.getPublicReceiptSettings);
router.get('/product-insights', adminController.getProductInsights);
router.get('/customer-metrics', adminController.getCustomerMetrics);

// Loyalty tier routes
router.get('/loyalty/tiers', authenticate, isAdmin, adminController.getAllLoyaltyTiers);
router.post('/loyalty/tiers', authenticate, isAdmin, adminController.createLoyaltyTier);
router.put('/loyalty/tiers/:id', authenticate, isAdmin, adminController.updateLoyaltyTier);
router.delete('/loyalty/tiers/:id', authenticate, isAdmin, adminController.deleteLoyaltyTier);
router.get('/loyalty/statistics', authenticate, isAdmin, adminController.getLoyaltyStatistics);

router.get('/rewards/settings', authenticate, isAdmin, adminController.getRewardsSettings);
router.put('/rewards/settings',authenticate, isAdmin,  adminController.updateRewardsSettings);
router.post('/fix-loyalty-data/:userId', authenticate, isAdmin, adminController.fixLoyaltyData);
router.get('/debug-loyalty/:userId', authenticate, isAdmin, adminController.debugLoyaltyData);

router.post('/add-admin', authenticate, isAdmin, adminController.addAdmin);


router.get('/detailed-reports', authenticate, isAdmin, adminController.getDetailedReports);
router.get('/categories', authenticate, isAdmin, adminController.getCategories);
router.get('/download-reports', authenticate, isAdmin, adminController.downloadReports);

router.get('/download-low-stock', adminController.downloadLowStockReport);

// Staff Analytics Routes
router.get('/staff-analytics/summary', authenticate, isAdmin, adminController.getStaffAnalyticsSummary);
router.get('/staff-analytics/performance', authenticate, isAdmin, adminController.getStaffPerformanceData);
router.get('/staff-analytics/sales-chart', authenticate, isAdmin, adminController.getStaffSalesChart);
router.get('/staff-analytics/orders-chart', authenticate, isAdmin, adminController.getStaffOrdersChart);

// Walk-in customer rewards routes
router.get('/walk-in/lookup-user/:userId', authenticate, isAdmin, adminController.lookupUser);
router.post('/walk-in/process-rewards', authenticate, isAdmin, adminController.processWalkInRewards);

module.exports = router;