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
            `SELECT o.*, u.email, 
                    CASE 
                        WHEN o.is_physical_order = 1 THEN o.customer_name
                        ELSE u.username
                    END as customer_name,
                    ad.amount as discount_amount,
                    (SELECT SUM(oi.price * oi.quantity) 
                     FROM order_items oi 
                     WHERE oi.order_id = o.order_id) as subtotal
             FROM orders o 
             LEFT JOIN users u ON o.user_id = u.id
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
            `SELECT o.*, u.email, 
                    CASE 
                        WHEN o.is_physical_order = 1 THEN o.customer_name
                        ELSE u.username
                    END as customer_name,
                    ad.amount as discount_amount,
                    (SELECT SUM(oi.price * oi.quantity) 
                     FROM order_items oi 
                     WHERE oi.order_id = o.order_id) as subtotal
             FROM orders o 
             LEFT JOIN users u ON o.user_id = u.id
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

        // Calculate estimated time: 3 minutes per product
        const timePerProduct = 180; // seconds per product (3 minutes)
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const estimatedSeconds = totalQuantity * timePerProduct;
        
        const estimatedTime = new Date();
        estimatedTime.setSeconds(estimatedTime.getSeconds() + estimatedSeconds);
        
        // Prepare order details for email
        const orderDetails = {
            ...order,
            items: formattedItems,
            subtotal: subtotal,
            order_id: orderId,
            estimatedPickupTime: estimatedTime.toISOString(),
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

// Staff Analytics Methods
exports.getStaffAnalyticsStats = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { timeFilter } = req.query;
        
        const now = new Date();
        let startDate, endDate, previousStartDate, previousEndDate;
        
        switch(timeFilter) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 1);
                previousEndDate = new Date(endDate);
                previousEndDate.setDate(previousEndDate.getDate() - 1);
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                startDate = weekStart;
                endDate = new Date(weekStart);
                endDate.setDate(weekStart.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 7);
                previousEndDate = new Date(endDate);
                previousEndDate.setDate(previousEndDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
                previousEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                break;
        }
        
        // Get current period stats - include all orders handled by this staff that generated revenue
        let currentStatsQuery = `
            SELECT 
                COALESCE(SUM(o.total_amount), 0) as totalSales,
                COUNT(o.order_id) as totalOrders,
                COALESCE(AVG(o.total_amount), 0) as avgOrderValue
            FROM orders o 
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'preparing', 'ready for pickup', 'completed', 'ready_for_pickup')
        `;
        
        let currentParams = [staffId];
        if (timeFilter !== 'all') {
            currentStatsQuery += ' AND o.accepted_at BETWEEN ? AND ?';
            currentParams.push(startDate, endDate);
        }
        
        const [currentStats] = await db.execute(currentStatsQuery, currentParams);
        
        // Get previous period stats for comparison
        let previousStatsQuery = `
            SELECT 
                COALESCE(SUM(o.total_amount), 0) as totalSales,
                COUNT(o.order_id) as totalOrders
            FROM orders o 
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'preparing', 'ready for pickup', 'completed', 'ready_for_pickup')
        `;
        
        let previousParams = [staffId];
        if (timeFilter !== 'all' && timeFilter !== 'year') {
            previousStatsQuery += ' AND o.accepted_at BETWEEN ? AND ?';
            previousParams.push(previousStartDate, previousEndDate);
        }
        
        const [previousStats] = await db.execute(previousStatsQuery, previousParams);
        
        // Get today's income
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        const [todayStats] = await db.execute(`
            SELECT COALESCE(SUM(o.total_amount), 0) as dailyIncome
            FROM orders o 
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'preparing', 'ready for pickup', 'completed', 'ready_for_pickup')
            AND o.accepted_at BETWEEN ? AND ?
        `, [staffId, today, todayEnd]);
        
        // Get yesterday's income for comparison
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        
        const [yesterdayStats] = await db.execute(`
            SELECT COALESCE(SUM(o.total_amount), 0) as dailyIncome
            FROM orders o 
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'preparing', 'ready for pickup', 'completed', 'ready_for_pickup')
            AND o.accepted_at BETWEEN ? AND ?
        `, [staffId, yesterday, yesterdayEnd]);
        
        // Calculate growth percentages
        const salesGrowth = previousStats[0]?.totalSales > 0 
            ? ((currentStats[0].totalSales - previousStats[0].totalSales) / previousStats[0].totalSales) * 100 
            : 0;
            
        const ordersGrowth = previousStats[0]?.totalOrders > 0 
            ? ((currentStats[0].totalOrders - previousStats[0].totalOrders) / previousStats[0].totalOrders) * 100 
            : 0;
            
        const dailyGrowth = yesterdayStats[0]?.dailyIncome > 0 
            ? ((todayStats[0].dailyIncome - yesterdayStats[0].dailyIncome) / yesterdayStats[0].dailyIncome) * 100 
            : 0;
        
        res.json({
            totalSales: currentStats[0].totalSales || 0,
            dailyIncome: todayStats[0].dailyIncome || 0,
            totalOrders: currentStats[0].totalOrders || 0,
            avgOrderValue: currentStats[0].avgOrderValue || 0,
            salesGrowth: salesGrowth || 0,
            ordersGrowth: ordersGrowth || 0,
            dailyGrowth: dailyGrowth || 0
        });
        
    } catch (error) {
        console.error('Error fetching staff analytics stats:', error);
        res.status(500).json({ message: 'Error fetching analytics data' });
    }
};

exports.getTopCustomers = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { period } = req.query;
        
        const now = new Date();
        let startDate;
        let queryParams = [staffId];
        let dateCondition = '';
        
        switch(period) {
            case 'weekly':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                dateCondition = 'AND o.accepted_at >= ?';
                queryParams.push(startDate);
                break;
            case 'monthly':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                dateCondition = 'AND o.accepted_at >= ?';
                queryParams.push(startDate);
                break;
            case 'quarterly':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 3);
                dateCondition = 'AND o.accepted_at >= ?';
                queryParams.push(startDate);
                break;
            case 'annually':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                dateCondition = 'AND o.accepted_at >= ?';
                queryParams.push(startDate);
                break;
        }
        
        const query = `
            SELECT 
                u.id as user_id,
                u.username as customer_name,
                u.email,
                COUNT(o.order_id) as order_count,
                SUM(o.total_amount) as total_spent,
                AVG(o.total_amount) as avg_order_value,
                MAX(o.accepted_at) as last_order_date
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'preparing', 'ready for pickup', 'completed', 'ready_for_pickup')
            ${dateCondition}
            GROUP BY u.id, u.username, u.email
            ORDER BY total_spent DESC, order_count DESC
            LIMIT 10
        `;
        
        const [customers] = await db.execute(query, queryParams);
        
        res.json(customers);
        
    } catch (error) {
        console.error('Error fetching top customers:', error);
        res.status(500).json({ message: 'Error fetching top customers' });
    }
};

exports.getSalesInsights = async (req, res) => {
    try {
        const staffId = req.user.id;
        
        // Get most sold product by this staff
        const [mostSoldProduct] = await db.execute(`
            SELECT 
                p.products_id,
                p.name,
                p.image,
                SUM(oi.quantity) as totalSold,
                SUM(oi.price * oi.quantity) as revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.products_id
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'preparing', 'ready for pickup', 'completed', 'ready_for_pickup')
            GROUP BY p.products_id, p.name, p.image
            ORDER BY totalSold DESC
            LIMIT 1
        `, [staffId]);
        
        // Get best sales day
        const [bestDay] = await db.execute(`
            SELECT 
                DATE(o.accepted_at) as date,
                COUNT(o.order_id) as order_count,
                SUM(o.total_amount) as revenue
            FROM orders o
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'preparing', 'ready for pickup', 'completed', 'ready_for_pickup')
            AND o.accepted_at IS NOT NULL
            GROUP BY DATE(o.accepted_at)
            ORDER BY revenue DESC
            LIMIT 1
        `, [staffId]);
        
        // Get average order value
        const [avgOrder] = await db.execute(`
            SELECT AVG(o.total_amount) as avgOrderValue
            FROM orders o
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'preparing', 'ready for pickup', 'completed', 'ready_for_pickup')
        `, [staffId]);
        
        // Get completion rate (orders with revenue-generating status vs all accepted orders)
        const [completionRate] = await db.execute(`
            SELECT 
                COUNT(CASE WHEN status IN ('paid', 'preparing', 'ready for pickup', 'completed', 'ready_for_pickup') THEN 1 END) as completed,
                COUNT(*) as total
            FROM orders o
            WHERE o.accepted_by = ?
        `, [staffId]);
        
        const completion = completionRate[0].total > 0 
            ? (completionRate[0].completed / completionRate[0].total) * 100 
            : 0;
        
        res.json({
            mostSold: mostSoldProduct[0] || null,
            bestDay: bestDay[0] || null,
            avgOrderValue: avgOrder[0]?.avgOrderValue || 0,
            completionRate: completion
        });
        
    } catch (error) {
        console.error('Error fetching sales insights:', error);
        res.status(500).json({ message: 'Error fetching sales insights' });
    }
};