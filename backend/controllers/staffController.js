const db = require('../config/db');
const Staff = require('../models/staffModel');
const Order = require('../models/orderModel');
const emailService = require('../services/emailService');

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Staff.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderDetails = await Staff.getOrderDetails(orderId);
        
        if (!orderDetails) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(orderDetails);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Error fetching order details' });
    }
};
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // Get order details with user email and discount information
        const [orderResult] = await db.execute(
            `SELECT o.*, u.email, u.username as customer_name,
                    ad.amount as discount_amount,
                    (SELECT SUM(oi.price * oi.quantity) 
                     FROM order_items oi 
                     WHERE oi.order_id = o.order_id) as subtotal
             FROM orders o 
             JOIN users u ON o.user_id = u.id
             LEFT JOIN available_discounts ad ON o.order_id = ad.order_id AND ad.used = TRUE 
             WHERE o.order_id = ?`,
            [orderId]
        );

        const order = orderResult[0];

        if (!order) {
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

        // Update status
        await db.execute(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            [status, orderId]
        );

        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Format items for email
        const formattedItems = items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            name: item.choice_name ? `${item.name} (${item.choice_name})` : item.name,
            choice_name: item.choice_name,
            image: item.actual_image || item.image
        }));

        // Prepare order details for email
        const orderDetails = {
            ...order,
            items: formattedItems,
            subtotal: subtotal,
            order_id: orderId,
            total_amount: order.total_amount,
            discount_amount: parseFloat(order.discount_amount) || 0
        };

        

        res.json({ 
            message: 'Order status updated successfully',
            email: order.email
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status' });
    }
};
exports.acceptOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const staffId = req.user.id;

        // Get order details with user email and discount information
        const [orderResult] = await db.execute(
            `SELECT o.*, u.email, u.username as customer_name,
                    ad.amount as discount_amount,
                    (SELECT SUM(oi.price * oi.quantity) 
                     FROM order_items oi 
                     WHERE oi.order_id = o.order_id) as subtotal
             FROM orders o 
             JOIN users u ON o.user_id = u.id
             LEFT JOIN available_discounts ad ON o.order_id = ad.order_id AND ad.used = TRUE 
             WHERE o.order_id = ?`,
            [orderId]
        );

        const order = orderResult[0];

        if (!order) {
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

        // Update order status and assign staff
        await db.execute(
            `UPDATE orders 
             SET status = 'preparing', 
                 accepted_by = ?, 
                 accepted_at = CURRENT_TIMESTAMP 
             WHERE order_id = ?`,
            [staffId, orderId]
        );

        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Format items for email
        const formattedItems = items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            name: item.choice_name ? `${item.name} (${item.choice_name})` : item.name,
            choice_name: item.choice_name,
            image: item.actual_image || item.image
        }));

        // Prepare order details for email
        const orderDetails = {
            ...order,
            items: formattedItems,
            subtotal: subtotal,
            order_id: orderId,
            total_amount: order.total_amount,
            discount_amount: parseFloat(order.discount_amount) || 0
        };

        res.json({ 
            message: 'Order accepted successfully',
            email: order.email
        });
    } catch (error) {
        console.error('Error accepting order:', error);
        res.status(500).json({ message: 'Error accepting order' });
    }
};
exports.cancelOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { orderId } = req.params;
        const { reason } = req.body;

        // Get order items before cancelling
        const [items] = await connection.execute(
            `SELECT oi.*, p.stock_quantity, pc.stock 
             FROM order_items oi 
             LEFT JOIN products p ON oi.product_id = p.products_id 
             LEFT JOIN product_choices pc ON oi.choice_id = pc.choice_id 
             WHERE oi.order_id = ?`,
            [orderId]
        );

        // Return stock for each item
        for (const item of items) {
            if (item.choice_id) {
                // Return stock to choice
                await connection.execute(
                    'UPDATE product_choices SET stock = stock + ? WHERE choice_id = ?',
                    [item.quantity, item.choice_id]
                );
            } else {
                // Return stock to main product
                await connection.execute(
                    'UPDATE products SET stock_quantity = stock_quantity + ? WHERE products_id = ?',
                    [item.quantity, item.product_id]
                );
            }
        }

        // Update order status
        await connection.execute(
            'UPDATE orders SET status = ?, cancel_reason = ? WHERE order_id = ?',
            ['cancelled', reason, orderId]
        );

        await connection.commit();
        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Error cancelling order' });
    } finally {
        connection.release();
    }
};
exports.getAcceptedOrders = async (req, res) => {
    try {
        const staffId = req.user.id;
        const orders = await Staff.getAcceptedOrders(staffId);
        
        const ordersWithEstimatedTime = orders.map(order => {
            const estimatedTime = Order.calculateEstimatedTime(order.items);
            return {
                ...order,
                estimatedPickupTime: estimatedTime
            };
        });

        res.json(ordersWithEstimatedTime);
    } catch (error) {
        console.error('Error fetching accepted orders:', error);
        res.status(500).json({ message: 'Error fetching accepted orders' });
    }
};
exports.createPhysicalOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { items, customerName, isPhysicalOrder, packagingPreference } = req.body;
        const staffId = req.user.id;
        
        // Validate packaging preference (default to 'eco' if not provided)
        const validPackagingPreference = ['eco', 'plastic'].includes(packagingPreference) ? packagingPreference : 'eco';
        
        // Generate a 7-character order ID format
        const prefix = "PO"; // For Physical Order
        
        // Get the next available order number
        const [latestOrder] = await connection.execute(
            `SELECT order_id FROM orders 
             WHERE order_id LIKE '${prefix}%' 
             ORDER BY CAST(SUBSTRING(order_id, 3) AS UNSIGNED) DESC 
             LIMIT 1`
        );
        
        let orderNum = 1;
        if (latestOrder && latestOrder.length > 0) {
            const lastNum = parseInt(latestOrder[0].order_id.substring(2), 10);
            if (!isNaN(lastNum)) {
                orderNum = lastNum + 1;
            }
        }
        
        // Pad with zeros to make 5 digits
        const paddedNum = orderNum.toString().padStart(5, '0');
        const orderId = `${prefix}${paddedNum}`;
        
        // Create order record with packaging preference
        await connection.execute(
            `INSERT INTO orders (order_id, user_id, status, total_amount, accepted_by, accepted_at, is_physical_order, customer_name, packaging_preference) 
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
            [
                orderId, 
                staffId, 
                'ready for pickup',
                items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                staffId,
                isPhysicalOrder ? 1 : 0,
                customerName || 'Walk-in Customer',
                validPackagingPreference
            ]
        );
        
        // Insert order items
        for (const item of items) {
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price, choice_id) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price, item.choice_id || null]
            );
            
            // Update stock
            if (item.choice_id) {
                await connection.execute(
                    'UPDATE product_choices SET stock = stock - ? WHERE choice_id = ?',
                    [item.quantity, item.choice_id]
                );
            } else {
                await connection.execute(
                    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE products_id = ?',
                    [item.quantity, item.product_id]
                );
            }
        }
        
        await connection.commit();
        res.json({ 
            message: 'Order created successfully',
            orderId: orderId,
            packagingPreference: validPackagingPreference
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating physical order:', error);
        res.status(500).json({ message: 'Error creating order' });
    } finally {
        connection.release();
    }
};