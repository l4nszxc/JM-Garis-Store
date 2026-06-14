const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all reward routes
router.use(authenticate);

// Define routes
router.get('/points', rewardController.getUserPoints);
router.get('/history', rewardController.getRewardHistory);
router.get('/available', rewardController.getAvailableRewards);
router.post('/redeem', rewardController.redeemReward);
router.get('/available-discounts', authenticate, rewardController.getAvailableDiscounts);
router.get('/loyalty-status', rewardController.getUserLoyaltyStatus);
module.exports = router;