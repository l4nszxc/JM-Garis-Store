const Reward = require('../models/rewardModel');

exports.getUserPoints = async (req, res) => {
    try {
        const points = await Reward.getUserPoints(req.user.id);
        res.json({ points });
    } catch (error) {
        console.error('Error getting user points:', error);
        res.status(500).json({ message: 'Error getting user points' });
    }
};

exports.getRewardHistory = async (req, res) => {
    try {
        const history = await Reward.getRewardHistory(req.user.id);
        const totalPointsEarned = await Reward.getTotalPointsEarned(req.user.id);
        res.json({ history, totalPointsEarned });
    } catch (error) {
        console.error('Error getting reward history:', error);
        res.status(500).json({ message: 'Error getting reward history' });
    }
};

exports.getAvailableRewards = async (req, res) => {
    try {
        const rewards = await Reward.getAvailableRewards();
        res.json(rewards);
    } catch (error) {
        console.error('Error getting available rewards:', error);
        res.status(500).json({ message: 'Error getting available rewards' });
    }
};

exports.redeemReward = async (req, res) => {
    try {
        const { points, rewardId } = req.body;
        
        if (!points || !rewardId) {
            return res.status(400).json({ message: 'Points and reward ID are required' });
        }

        const reward = await Reward.redeemPoints(req.user.id, points, rewardId);
        const currentPoints = await Reward.getUserPoints(req.user.id);

        res.json({ 
            message: 'Reward redeemed successfully',
            points: currentPoints,
            reward 
        });
    } catch (error) {
        console.error('Error redeeming reward:', error);
        res.status(500).json({ message: error.message || 'Error redeeming reward' });
    }
};
exports.getAvailableDiscounts = async (req, res) => {
    try {
        const userId = req.user.id;
        const discounts = await Reward.getAvailableDiscounts(userId);
        res.json(discounts);
    } catch (error) {
        console.error('Error getting available discounts:', error);
        res.status(500).json({ message: 'Error getting available discounts' });
    }
};
exports.getUserLoyaltyStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const loyaltyStatus = await Reward.getUserLoyaltyStatus(userId);
        res.json(loyaltyStatus || {
            tier_name: null,
            bonus_percentage: 0,
            current_month_spend: 0,
            has_free_product: false
        });
    } catch (error) {
        console.error('Error getting user loyalty status:', error);
        res.status(500).json({ message: 'Error getting user loyalty status' });
    }
};