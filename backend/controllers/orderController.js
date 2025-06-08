const db = require('../config/db');
const Order = require('../models/orderModel.js');
const Reward = require('../models/rewardModel.js');
const SharedCart = require('../models/sharedCartModel'); 

exports.createOrder = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { items, totalAmount, discountId } = req.body;
        const userId = req.user.id;

        // Check if items array is valid
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'No items provided' });
        }

        // Debug log
        console.log('Creating order with items:', items);

        let finalAmount = totalAmount;
        let appliedDiscount = 0;

        // Apply discount if provided
        if (discountId) {
            try {
                appliedDiscount = await Reward.applyDiscount(userId, null, discountId);
                finalAmount = Math.max(0, totalAmount - appliedDiscount);
            } catch (error) {
                console.error('Error applying discount:', error);
            }
        }
        
        // Use the Order model's create method to handle the order creation and stock update
        const orderId = await Order.create(userId, items, finalAmount);

        // If discount was applied, update the order_id in available_discounts
        if (discountId && appliedDiscount > 0) {
            await connection.execute(
                'UPDATE available_discounts SET order_id = ?, used = TRUE WHERE id = ?',
                [orderId, discountId]
            );
        }

        // Check if user has an active shared cart and terminate it
        const activeShare = await SharedCart.getActiveSharedCart(userId);
        if (activeShare && activeShare.shareId) {
            // Terminate the shared cart (set status to "expired")
            await db.execute(
                'UPDATE shared_carts SET status = "expired" WHERE share_id = ? AND status = "active"',
                [activeShare.shareId]
            );
        }

        await connection.commit();

        // Add reward points for the final amount paid
        let pointsEarned = 0;
        try {
            pointsEarned = await Reward.addPoints(userId, orderId, finalAmount);
        } catch (error) {
            console.error('Error adding reward points:', error);
        }

        res.status(201).json({ 
            orderId,
            pointsEarned,
            appliedDiscount,
            finalAmount,
            message: 'Order created successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order: ' + error.message });
    } finally {
        connection.release();
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const orders = await Order.getUserOrders(req.user.id);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Cancellation reason is required' });
        }

        // Verify order belongs to user
        const [order] = await db.execute(
            'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
            [orderId, req.user.id]
        );

        if (!order.length) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order[0].status !== 'pending') {
            return res.status(400).json({ 
                message: 'Only pending orders can be cancelled' 
            });
        }

        await Order.cancelOrder(orderId, reason);
        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ message: 'Error canceling order' });
    }
};