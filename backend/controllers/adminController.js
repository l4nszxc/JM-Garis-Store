const db = require('../config/db');
const Admin = require('../models/adminModel');
const Staff = require('../models/staffModel');
const User = require('../models/userModel');
const Reward = require('../models/rewardModel');
const emailService = require('../services/emailService');
const forecastService = require('../services/forecastService');
const jwt = require('jsonwebtoken');

exports.getStats = async (req, res) => {
    try {
        const stats = await Admin.getUserStats();
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await Admin.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Admin.getAllStaff();
        res.json(staff);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ message: 'Error fetching staff' });
    }
};
exports.recruitStaff = async (req, res) => {
    try {
        const staffData = req.body;

        // Check if user exists
        const existingUser = await User.findByEmail(staffData.email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create staff user
        await Admin.createStaff(staffData);

        res.status(201).json({ 
            message: 'Staff member registered successfully'
        });
    } catch (error) {
        console.error('Staff registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await Admin.getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ message: 'Error getting dashboard stats' });
    }
};
exports.updateStaff = async (req, res) => {
    try {
        const staffId = req.params.id;
        const staffData = req.body;
        await Admin.updateStaff(staffId, staffData);
        res.json({ message: 'Staff updated successfully' });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ message: 'Error updating staff' });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const staffId = req.params.id;
        await Admin.deleteStaff(staffId);
        res.json({ message: 'Staff deleted successfully' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ message: 'Error deleting staff' });
    }
};
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Admin.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderDetails = await Admin.getOrderDetails(orderId);
        
        if (!orderDetails) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(orderDetails);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Error fetching order details' });
    }
};
exports.processPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { cashAmount, changeAmount } = req.body;
        
        // Get order details with user email before updating status
        const [orderDetails] = await db.execute(
            `SELECT o.*, u.email, u.username as customer_name,
                    s.username as staff_name,
                    ad.amount as discount_amount,
                    (SELECT SUM(oi.price * oi.quantity) 
                     FROM order_items oi 
                     WHERE oi.order_id = o.order_id) as subtotal
             FROM orders o
             JOIN users u ON o.user_id = u.id
             LEFT JOIN users s ON o.accepted_by = s.id
             LEFT JOIN available_discounts ad ON o.order_id = ad.order_id AND ad.used = TRUE
             WHERE o.order_id = ?`,
            [orderId]
        );

        if (!orderDetails[0]) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Get order items
        const [items] = await db.execute(
            `SELECT oi.*, p.name, pc.name as choice_name,
                    p.image, COALESCE(pc.image, p.image) as actual_image
             FROM order_items oi 
             LEFT JOIN products p ON oi.product_id = p.products_id
             LEFT JOIN product_choices pc ON oi.choice_id = pc.choice_id 
             WHERE oi.order_id = ?`,
            [orderId]
        );

        // Update order status
        await db.execute(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            ['paid', orderId]
        );

        // Email sending is removed

        res.json({ message: 'Payment processed successfully' });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ message: 'Error processing payment' });
    }
};
exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        await Admin.deleteProduct(productId);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
};
exports.getAllRewardTiers = async (req, res) => {
    try {
        const [tiers] = await db.query('SELECT * FROM reward_tiers ORDER BY points_required ASC');
        res.json(tiers);
    } catch (error) {
        console.error('Error getting reward tiers:', error);
        res.status(500).json({ message: 'Error getting reward tiers' });
    }
};

exports.createRewardTier = async (req, res) => {
    try {
        const { name, points_required, discount_amount, description } = req.body;
        
        if (!name || !points_required || !discount_amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const [result] = await db.query(
            'INSERT INTO reward_tiers (name, points_required, discount_amount, description) VALUES (?, ?, ?, ?)',
            [name, points_required, discount_amount, description]
        );
        
        res.status(201).json({ 
            message: 'Reward tier created successfully',
            tierId: result.insertId
        });
    } catch (error) {
        console.error('Error creating reward tier:', error);
        res.status(500).json({ message: 'Error creating reward tier' });
    }
};

exports.updateRewardTier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, points_required, discount_amount, description } = req.body;
        
        if (!name || !points_required || !discount_amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        await db.query(
            'UPDATE reward_tiers SET name = ?, points_required = ?, discount_amount = ?, description = ? WHERE id = ?',
            [name, points_required, discount_amount, description, id]
        );
        
        res.json({ message: 'Reward tier updated successfully' });
    } catch (error) {
        console.error('Error updating reward tier:', error);
        res.status(500).json({ message: 'Error updating reward tier' });
    }
};

exports.deleteRewardTier = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM reward_tiers WHERE id = ?', [id]);
        res.json({ message: 'Reward tier deleted successfully' });
    } catch (error) {
        console.error('Error deleting reward tier:', error);
        res.status(500).json({ message: 'Error deleting reward tier' });
    }
};

exports.getRewardsStatistics = async (req, res) => {
    try {
        // Get total points awarded
        const [totalPointsResult] = await db.query(
            'SELECT COALESCE(SUM(points), 0) as total FROM user_rewards WHERE points > 0'
        );
        
        // Get total points redeemed
        const [redeemedPointsResult] = await db.query(
            'SELECT COALESCE(SUM(ABS(points)), 0) as total FROM user_rewards WHERE points < 0'
        );
        
        // Get top users by points
        const [topUsers] = await db.query(`
            SELECT 
                u.id,
                u.username,
                COALESCE(SUM(r.points), 0) as total_points
            FROM 
                users u
            LEFT JOIN 
                user_rewards r ON u.id = r.user_id
            GROUP BY 
                u.id
            ORDER BY 
                total_points DESC
            LIMIT 10
        `);
        
        res.json({
            totalPointsAwarded: totalPointsResult[0].total,
            totalPointsRedeemed: redeemedPointsResult[0].total,
            topUsers
        });
    } catch (error) {
        console.error('Error getting rewards statistics:', error);
        res.status(500).json({ message: 'Error getting rewards statistics' });
    }
};
exports.getProductForecasts = async (req, res) => {
    try {
        const { type = 'sales', days = 30 } = req.query;
        
        const forecastResult = await forecastService.updateForecastMetrics({
            type,
            days: parseInt(days)
        });
        
        if (forecastResult.status === 'error') {
            return res.status(500).json({ 
                message: forecastResult.message || 'Error generating forecasts' 
            });
        }
        
        res.json(forecastResult);
    } catch (error) {
        console.error('Error getting forecasts:', error);
        res.status(500).json({ message: 'Error generating forecasts' });
    }
};