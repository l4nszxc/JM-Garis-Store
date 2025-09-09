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

// Download staff analytics as Excel
exports.downloadStaffAnalytics = async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const staffId = req.user.id;
        const { timeFilter = 'all' } = req.query;
        
        // Get staff information
        const [staffInfo] = await db.execute(`
            SELECT id, username, firstname, lastname, email, phone_number
            FROM users 
            WHERE id = ? AND role = 'staff'
        `, [staffId]);
        
        if (!staffInfo.length) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        
        const staff = staffInfo[0];
        const staffName = `${staff.firstname} ${staff.lastname}`;
        
        // Calculate date ranges
        const now = new Date();
        let startDate, endDate;
        
        switch(timeFilter) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                startDate = weekStart;
                endDate = new Date(weekStart);
                endDate.setDate(weekStart.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            default:
                startDate = null;
                endDate = null;
        }
        
        // Get analytics data
        let analyticsQuery = `
            SELECT 
                COALESCE(SUM(o.total_amount), 0) as totalSales,
                COUNT(o.order_id) as totalOrders,
                COALESCE(AVG(o.total_amount), 0) as avgOrderValue,
                MIN(o.accepted_at) as firstOrder,
                MAX(o.accepted_at) as lastOrder
            FROM orders o 
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup')
        `;
        
        let analyticsParams = [staffId];
        if (startDate && endDate) {
            analyticsQuery += ' AND o.accepted_at BETWEEN ? AND ?';
            analyticsParams.push(startDate, endDate);
        }
        
        const [analyticsData] = await db.execute(analyticsQuery, analyticsParams);
        
        // Get detailed orders
        let ordersQuery = `
            SELECT 
                o.order_id,
                o.total_amount,
                o.status,
                o.payment_method,
                o.created_at,
                o.accepted_at,
                o.updated_at,
                COALESCE(o.customer_name, CONCAT(u.firstname, ' ', u.lastname)) as customer_name,
                COALESCE(u.email, 'N/A') as customer_email,
                COUNT(oi.id) as items_count
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup')
        `;
        
        let ordersParams = [staffId];
        if (startDate && endDate) {
            ordersQuery += ' AND o.accepted_at BETWEEN ? AND ?';
            ordersParams.push(startDate, endDate);
        }
        
        ordersQuery += ` GROUP BY 
            o.order_id, 
            o.total_amount, 
            o.status, 
            o.payment_method, 
            o.created_at, 
            o.accepted_at, 
            o.updated_at,
            COALESCE(o.customer_name, CONCAT(u.firstname, ' ', u.lastname)),
            COALESCE(u.email, 'N/A')
            ORDER BY o.accepted_at DESC`;
        
        const [ordersData] = await db.execute(ordersQuery, ordersParams);
        
        // Get top customers - simplified approach
        let customersQuery = `
            SELECT 
                COALESCE(o.customer_name, CONCAT(u.firstname, ' ', u.lastname)) as customer_name,
                COALESCE(u.email, 'N/A') as customer_email,
                COUNT(o.order_id) as total_orders,
                SUM(o.total_amount) as total_spent,
                AVG(o.total_amount) as avg_order_value,
                MAX(o.accepted_at) as last_order_date
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup')
        `;
        
        let customersParams = [staffId];
        if (startDate && endDate) {
            customersQuery += ' AND o.accepted_at BETWEEN ? AND ?';
            customersParams.push(startDate, endDate);
        }
        
        customersQuery += `
            GROUP BY 
                COALESCE(o.customer_name, CONCAT(u.firstname, ' ', u.lastname)),
                COALESCE(u.email, 'N/A')
            ORDER BY total_spent DESC 
            LIMIT 10
        `;
        
        const [customersData] = await db.execute(customersQuery, customersParams);
        
        // Get daily sales breakdown
        let dailySalesQuery = `
            SELECT 
                DATE(o.accepted_at) as sale_date,
                COUNT(o.order_id) as orders_count,
                SUM(o.total_amount) as daily_sales,
                AVG(o.total_amount) as avg_order_value
            FROM orders o 
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup')
        `;
        
        let dailySalesParams = [staffId];
        if (startDate && endDate) {
            dailySalesQuery += ' AND o.accepted_at BETWEEN ? AND ?';
            dailySalesParams.push(startDate, endDate);
        }
        
        dailySalesQuery += ' GROUP BY DATE(o.accepted_at) ORDER BY sale_date DESC LIMIT 30';
        
        const [dailySalesData] = await db.execute(dailySalesQuery, dailySalesParams);
        
        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'JM Garis Store';
        workbook.created = new Date();
        
        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Staff Analytics Summary');
        
        // Set column widths
        summarySheet.columns = [
            { width: 25 }, // A - Labels
            { width: 20 }, // B - Values
            { width: 15 }, // C - Empty
            { width: 25 }, // D - Labels
            { width: 20 }, // E - Values
            { width: 15 }  // F - Empty
        ];
        
        // Add store header
        summarySheet.mergeCells('A1:F1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = 'JM GARIS STORE';
        titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        
        // Add report title
        summarySheet.mergeCells('A2:F2');
        const reportTitleCell = summarySheet.getCell('A2');
        reportTitleCell.value = `STAFF ANALYTICS REPORT - ${staffName}`;
        reportTitleCell.font = { name: 'Arial', size: 14, bold: true };
        reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add period info
        summarySheet.mergeCells('A3:F3');
        const periodCell = summarySheet.getCell('A3');
        let periodText = timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1);
        if (startDate && endDate) {
            periodText = `Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
        } else {
            periodText = `Period: ${periodText}`;
        }
        periodCell.value = periodText;
        periodCell.font = { name: 'Arial', size: 11 };
        periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add generation timestamp
        summarySheet.mergeCells('A4:F4');
        const timestampCell = summarySheet.getCell('A4');
        timestampCell.value = `Generated: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`;
        timestampCell.font = { name: 'Arial', size: 10, italic: true };
        timestampCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add empty row
        summarySheet.addRow([]);
        
        // Staff Information Section
        summarySheet.mergeCells('A6:F6');
        const staffInfoTitle = summarySheet.getCell('A6');
        staffInfoTitle.value = 'STAFF INFORMATION';
        staffInfoTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        staffInfoTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
        staffInfoTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        
        const staffInfoData = [
            ['Staff ID:', staff.id],
            ['Staff Name:', staffName],
            ['Email:', staff.email],
            ['Phone:', staff.phone_number || 'N/A']
        ];
        
        staffInfoData.forEach((row, index) => {
            const dataRow = summarySheet.addRow([row[0], row[1]]);
            dataRow.getCell(1).font = { bold: true };
            dataRow.getCell(1).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            dataRow.getCell(2).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        // Add empty row
        summarySheet.addRow([]);
        
        // Performance Metrics Section
        summarySheet.mergeCells(`A${summarySheet.lastRow.number + 1}:F${summarySheet.lastRow.number + 1}`);
        const metricsTitle = summarySheet.getCell(`A${summarySheet.lastRow.number}`);
        metricsTitle.value = 'KEY PERFORMANCE METRICS';
        metricsTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        metricsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
        metricsTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        
        const metricsData = [
            ['Total Sales:', `₱${parseFloat(analyticsData[0].totalSales || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`],
            ['Total Orders:', analyticsData[0].totalOrders],
            ['Average Order Value:', `₱${parseFloat(analyticsData[0].avgOrderValue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`],
            ['First Order Date:', analyticsData[0].firstOrder ? new Date(analyticsData[0].firstOrder).toLocaleDateString('en-PH') : 'N/A'],
            ['Last Order Date:', analyticsData[0].lastOrder ? new Date(analyticsData[0].lastOrder).toLocaleDateString('en-PH') : 'N/A']
        ];
        
        metricsData.forEach((row) => {
            const dataRow = summarySheet.addRow([row[0], row[1]]);
            dataRow.getCell(1).font = { bold: true };
            dataRow.getCell(1).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            dataRow.getCell(2).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        // Orders Details Sheet
        const ordersSheet = workbook.addWorksheet('Orders Details');
        
        // Set column widths
        ordersSheet.columns = [
            { width: 12 }, // Order ID
            { width: 20 }, // Customer Name
            { width: 25 }, // Customer Email
            { width: 15 }, // Amount
            { width: 15 }, // Status
            { width: 15 }, // Payment Method
            { width: 12 }, // Items Count
            { width: 18 }, // Order Date
            { width: 18 }  // Accepted Date
        ];
        
        // Add store header
        ordersSheet.mergeCells('A1:I1');
        const ordersTitle = ordersSheet.getCell('A1');
        ordersTitle.value = 'JM GARIS STORE';
        ordersTitle.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        ordersTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        ordersTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        
        // Add section title
        ordersSheet.mergeCells('A2:I2');
        const ordersSubTitle = ordersSheet.getCell('A2');
        ordersSubTitle.value = `ORDERS DETAILS - ${staffName}`;
        ordersSubTitle.font = { name: 'Arial', size: 14, bold: true };
        ordersSubTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add period info
        ordersSheet.mergeCells('A3:I3');
        const ordersPeriod = ordersSheet.getCell('A3');
        ordersPeriod.value = periodText;
        ordersPeriod.font = { name: 'Arial', size: 11 };
        ordersPeriod.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add empty row
        ordersSheet.addRow([]);
        
        // Headers
        const orderHeaders = ['Order ID', 'Customer Name', 'Customer Email', 'Amount (₱)', 'Status', 'Payment Method', 'Items Count', 'Order Date', 'Accepted Date'];
        const orderHeaderRow = ordersSheet.addRow(orderHeaders);
        
        // Style headers
        orderHeaderRow.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        // Data
        ordersData.forEach((order) => {
            const dataRow = ordersSheet.addRow([
                order.order_id,
                order.customer_name || 'N/A',
                order.customer_email || 'N/A',
                parseFloat(order.total_amount || 0),
                order.status,
                order.payment_method,
                order.items_count,
                new Date(order.created_at),
                new Date(order.accepted_at)
            ]);
            
            // Style data rows
            dataRow.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                // Format currency
                if (colNumber === 4) {
                    cell.numFmt = '₱#,##0.00';
                }
                
                // Format dates
                if (colNumber === 8 || colNumber === 9) {
                    cell.numFmt = 'mm/dd/yyyy hh:mm';
                }
            });
        });
        
        // Top Customers Sheet
        const customersSheet = workbook.addWorksheet('Top Customers');
        
        // Set column widths
        customersSheet.columns = [
            { width: 8 },  // Rank
            { width: 20 }, // Customer Name
            { width: 25 }, // Email
            { width: 12 }, // Total Orders
            { width: 15 }, // Total Spent
            { width: 15 }, // Avg Order Value
            { width: 18 }  // Last Order Date
        ];
        
        // Add store header
        customersSheet.mergeCells('A1:G1');
        const customersTitle = customersSheet.getCell('A1');
        customersTitle.value = 'JM GARIS STORE';
        customersTitle.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        customersTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        customersTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        
        // Add section title
        customersSheet.mergeCells('A2:G2');
        const customersSubTitle = customersSheet.getCell('A2');
        customersSubTitle.value = `TOP CUSTOMERS - ${staffName}`;
        customersSubTitle.font = { name: 'Arial', size: 14, bold: true };
        customersSubTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add period info
        customersSheet.mergeCells('A3:G3');
        const customersPeriod = customersSheet.getCell('A3');
        customersPeriod.value = periodText;
        customersPeriod.font = { name: 'Arial', size: 11 };
        customersPeriod.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add empty row
        customersSheet.addRow([]);
        
        const customerHeaders = ['Rank', 'Customer Name', 'Email', 'Total Orders', 'Total Spent (₱)', 'Avg Order Value (₱)', 'Last Order Date'];
        const customerHeaderRow = customersSheet.addRow(customerHeaders);
        
        // Style headers
        customerHeaderRow.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        customersData.forEach((customer, index) => {
            const dataRow = customersSheet.addRow([
                index + 1,
                customer.customer_name || 'N/A',
                customer.customer_email || 'N/A',
                customer.total_orders,
                parseFloat(customer.total_spent || 0),
                parseFloat(customer.avg_order_value || 0),
                new Date(customer.last_order_date)
            ]);
            
            // Style data rows
            dataRow.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                // Format currency columns
                if (colNumber === 5 || colNumber === 6) {
                    cell.numFmt = '₱#,##0.00';
                }
                
                // Format date column
                if (colNumber === 7) {
                    cell.numFmt = 'mm/dd/yyyy';
                }
            });
        });
        
        // Daily Sales Sheet
        const dailySheet = workbook.addWorksheet('Daily Sales');
        
        // Set column widths
        dailySheet.columns = [
            { width: 15 }, // Date
            { width: 12 }, // Orders Count
            { width: 15 }, // Daily Sales
            { width: 15 }  // Avg Order Value
        ];
        
        // Add store header
        dailySheet.mergeCells('A1:D1');
        const dailyTitle = dailySheet.getCell('A1');
        dailyTitle.value = 'JM GARIS STORE';
        dailyTitle.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        dailyTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        dailyTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        
        // Add section title
        dailySheet.mergeCells('A2:D2');
        const dailySubTitle = dailySheet.getCell('A2');
        dailySubTitle.value = `DAILY SALES BREAKDOWN - ${staffName}`;
        dailySubTitle.font = { name: 'Arial', size: 14, bold: true };
        dailySubTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add period info
        dailySheet.mergeCells('A3:D3');
        const dailyPeriod = dailySheet.getCell('A3');
        dailyPeriod.value = periodText;
        dailyPeriod.font = { name: 'Arial', size: 11 };
        dailyPeriod.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add empty row
        dailySheet.addRow([]);
        
        const dailyHeaders = ['Date', 'Orders Count', 'Daily Sales (₱)', 'Avg Order Value (₱)'];
        const dailyHeaderRow = dailySheet.addRow(dailyHeaders);
        
        // Style headers
        dailyHeaderRow.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        dailySalesData.forEach((day) => {
            const dataRow = dailySheet.addRow([
                new Date(day.sale_date),
                day.orders_count,
                parseFloat(day.daily_sales || 0),
                parseFloat(day.avg_order_value || 0)
            ]);
            
            // Style data rows
            dataRow.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                // Format date column
                if (colNumber === 1) {
                    cell.numFmt = 'mm/dd/yyyy';
                }
                
                // Format currency columns
                if (colNumber === 3 || colNumber === 4) {
                    cell.numFmt = '₱#,##0.00';
                }
            });
        });
        
        // Set response headers
        const fileName = `Staff_Analytics_${staffName.replace(/\s+/g, '_')}_${timeFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error generating staff analytics Excel:', error);
        res.status(500).json({ message: 'Error generating Excel report', error: error.message });
    }
};