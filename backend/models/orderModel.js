const db = require('../config/db');

class Order {
    static generateOrderId() {
        return Math.random().toString().slice(2, 9);
    }

    static async create(userId, items, totalAmount, packagingPreference = 'eco', paymentMethod = 'cash', status = 'pending') {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const orderId = this.generateOrderId();

            // Debug logs
            console.log('Order.create called with:');
            console.log('- userId:', userId);
            console.log('- totalAmount:', totalAmount);
            console.log('- packagingPreference:', packagingPreference);
            console.log('- paymentMethod:', paymentMethod);
            console.log('- status:', status);

            // Validate packaging preference
            const validPackaging = ['eco', 'plastic'].includes(packagingPreference) ? packagingPreference : 'eco';
            console.log('- validatedPackaging:', validPackaging);

            // Validate payment method
            const validPaymentMethod = ['cash', 'gcash', 'hatid'].includes(paymentMethod) ? paymentMethod : 'cash';
            console.log('- validatedPaymentMethod:', validPaymentMethod);

            // Validate status
            const validStatus = status || 'pending';
            console.log('- validatedStatus:', validStatus);

            // First verify if there's enough stock for all items
            for (const item of items) {
                if (item.choice_id) {
                    // Check choice stock
                    const [choiceRows] = await connection.execute(
                        'SELECT stock FROM product_choices WHERE choice_id = ? FOR UPDATE',
                        [item.choice_id]
                    );

                    if (!choiceRows[0] || choiceRows[0].stock < item.quantity) {
                        throw new Error(`Not enough stock for product variant with choice ID ${item.choice_id}`);
                    }
                } else {
                    // Check main product stock
                    const [productRows] = await connection.execute(
                        'SELECT stock_quantity FROM products WHERE products_id = ? FOR UPDATE',
                        [item.product_id]
                    );

                    if (!productRows[0] || productRows[0].stock_quantity < item.quantity) {
                        throw new Error(`Not enough stock for product ID ${item.product_id}`);
                    }
                }
            }
            
            // Create order with packaging preference, payment method, and status
            console.log('Inserting order with packaging preference:', validPackaging, 'payment method:', validPaymentMethod, 'and status:', validStatus);
            await connection.execute(
                'INSERT INTO orders (order_id, user_id, total_amount, packaging_preference, payment_method, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [orderId, userId, totalAmount, validPackaging, validPaymentMethod, validStatus]
            );

            // Verify the insertion worked
            const [verifyResult] = await connection.execute(
                'SELECT packaging_preference, payment_method, status FROM orders WHERE order_id = ?',
                [orderId]
            );
            console.log('Verified packaging preference in database:', verifyResult[0]?.packaging_preference);
            console.log('Verified payment method in database:', verifyResult[0]?.payment_method);
            console.log('Verified status in database:', verifyResult[0]?.status);

            // Process each item
            for (const item of items) {
                // Insert order item
                await connection.execute(
                    'INSERT INTO order_items (order_id, product_id, quantity, price, choice_id) VALUES (?, ?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.price, item.choice_id || null]
                );

                // Update stock
                if (item.choice_id) {
                    console.log(`Reducing choice stock: choice_id=${item.choice_id}, quantity=${item.quantity}`);
                    await connection.execute(
                        'UPDATE product_choices SET stock = stock - ? WHERE choice_id = ?',
                        [item.quantity, item.choice_id]
                    );
                } else {
                    console.log(`Reducing product stock: product_id=${item.product_id}, quantity=${item.quantity}`);
                    await connection.execute(
                        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE products_id = ?',
                        [item.quantity, item.product_id]
                    );
                }
            }

            // Clear cart items that were ordered
            const itemIds = items.map(item => item.id).filter(id => id);
            
            if (itemIds.length > 0) {
                for (const id of itemIds) {
                    await connection.execute(
                        'DELETE FROM cart WHERE id = ? AND user_id = ?',
                        [id, userId]
                    );
                }
            }

            await connection.commit();
            console.log('Order created successfully with packaging preference:', validPackaging);
            return orderId;
            
        } catch (error) {
            await connection.rollback();
            console.error('Error in Order.create:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async createWithPaymentIntent(userId, items, totalAmount, packagingPreference = 'eco', paymentMethod = 'cash', status = 'pending', paymentIntentId = null) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const orderId = this.generateOrderId();

            // Debug logs
            console.log('Order.createWithPaymentIntent called with:');
            console.log('- userId:', userId);
            console.log('- totalAmount:', totalAmount);
            console.log('- packagingPreference:', packagingPreference);
            console.log('- paymentMethod:', paymentMethod);
            console.log('- status:', status);
            console.log('- paymentIntentId:', paymentIntentId);

            // Validate packaging preference
            const validPackaging = ['eco', 'plastic'].includes(packagingPreference) ? packagingPreference : 'eco';
            console.log('- validatedPackaging:', validPackaging);

            // Validate payment method
            const validPaymentMethod = ['cash', 'gcash', 'hatid'].includes(paymentMethod) ? paymentMethod : 'cash';
            console.log('- validatedPaymentMethod:', validPaymentMethod);

            // Validate status
            const validStatus = status || 'pending';
            console.log('- validatedStatus:', validStatus);

            // First verify if there's enough stock for all items
            for (const item of items) {
                if (item.choice_id) {
                    // Check choice stock
                    const [choiceRows] = await connection.execute(
                        'SELECT stock FROM product_choices WHERE choice_id = ? FOR UPDATE',
                        [item.choice_id]
                    );

                    if (!choiceRows[0] || choiceRows[0].stock < item.quantity) {
                        throw new Error(`Not enough stock for product variant with choice ID ${item.choice_id}`);
                    }
                } else {
                    // Check main product stock
                    const [productRows] = await connection.execute(
                        'SELECT stock_quantity FROM products WHERE products_id = ? FOR UPDATE',
                        [item.product_id]
                    );

                    if (!productRows[0] || productRows[0].stock_quantity < item.quantity) {
                        throw new Error(`Not enough stock for product ID ${item.product_id}`);
                    }
                }
            }
            
            // Create order with packaging preference, payment method, status, and payment intent reference
            console.log('Inserting order with payment intent:', paymentIntentId);
            await connection.execute(
                'INSERT INTO orders (order_id, user_id, total_amount, packaging_preference, payment_method, status, payment_intent_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                [orderId, userId, totalAmount, validPackaging, validPaymentMethod, validStatus, paymentIntentId]
            );

            // Verify the insertion worked
            const [verifyResult] = await connection.execute(
                'SELECT packaging_preference, payment_method, status, payment_intent_id FROM orders WHERE order_id = ?',
                [orderId]
            );
            console.log('Verified payment intent in database:', verifyResult[0]?.payment_intent_id);

            // Process each item
            for (const item of items) {
                // Insert order item
                await connection.execute(
                    'INSERT INTO order_items (order_id, product_id, quantity, price, choice_id) VALUES (?, ?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.price, item.choice_id || null]
                );

                // Update stock
                if (item.choice_id) {
                    console.log(`Reducing choice stock: choice_id=${item.choice_id}, quantity=${item.quantity}`);
                    await connection.execute(
                        'UPDATE product_choices SET stock = stock - ? WHERE choice_id = ?',
                        [item.quantity, item.choice_id]
                    );
                } else {
                    console.log(`Reducing product stock: product_id=${item.product_id}, quantity=${item.quantity}`);
                    await connection.execute(
                        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE products_id = ?',
                        [item.quantity, item.product_id]
                    );
                }
            }

            // Clear cart items that were ordered
            const itemIds = items.map(item => item.id).filter(id => id);
            
            if (itemIds.length > 0) {
                for (const id of itemIds) {
                    console.log(`Clearing cart item: ${id} for user: ${userId}`);
                    await connection.execute(
                        'DELETE FROM cart WHERE id = ? AND user_id = ?',
                        [id, userId]
                    );
                }
            }

            await connection.commit();
            console.log('Order created successfully with payment intent:', paymentIntentId);
            return orderId;
            
        } catch (error) {
            await connection.rollback();
            console.error('Error in Order.createWithPaymentIntent:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static calculateEstimatedTime(items) {
        try {
            // 3 minutes per product (180 seconds)
            const timePerProduct = 180; // seconds per product
            
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
            const estimatedSeconds = totalQuantity * timePerProduct;
            
            // Create a date object with the estimated completion time
            const estimatedTime = new Date();
            estimatedTime.setSeconds(estimatedTime.getSeconds() + estimatedSeconds);
            
            // Return ISO string for consistent date formatting
            return estimatedTime.toISOString();
        } catch (error) {
            console.error('Error calculating estimated time:', error);
            return null;
        }
    }
    static async getUserOrders(userId) {
        try {
            const [orders] = await db.query(
                `SELECT o.*, 
                    ad.amount as discount_amount,
                    pi.gcash_reference,
                    pi.status as payment_status,
                    pi.verified_at,
                    (SELECT SUM(oi.price * oi.quantity) 
                     FROM order_items oi 
                     WHERE oi.order_id = o.order_id) as subtotal
                FROM orders o
                LEFT JOIN available_discounts ad ON o.order_id = ad.order_id AND ad.used = TRUE
                LEFT JOIN payment_intents pi ON o.payment_intent_id = pi.reference_number
                WHERE o.user_id = ?
                ORDER BY o.created_at DESC`,
                [userId]
            );
    
            // Fetch items for each order
            for (let order of orders) {
                const [items] = await db.query(
                    `SELECT oi.*, p.name, p.image, pc.name as choice_name
                    FROM order_items oi
                    JOIN products p ON oi.product_id = p.products_id
                    LEFT JOIN product_choices pc ON oi.choice_id = pc.choice_id
                    WHERE oi.order_id = ?`,
                    [order.order_id]
                );
                order.items = items;
            }
    
            return orders;
        } catch (error) {
            throw error;
        }
    }
    static async cancelOrder(orderId, reason) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
    
            // Get order items with choice information
            const [orderItems] = await connection.execute(
                `SELECT oi.product_id, oi.quantity, oi.choice_id 
                 FROM order_items oi 
                 WHERE oi.order_id = ?`,
                [orderId]
            );
    
            // Restore stock quantities
            for (const item of orderItems) {
                if (item.choice_id) {
                    // Restore stock to choice
                    await connection.execute(
                        'UPDATE product_choices SET stock = stock + ? WHERE choice_id = ?',
                        [item.quantity, item.choice_id]
                    );
                } else {
                    // Restore stock to main product
                    await connection.execute(
                        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE products_id = ?',
                        [item.quantity, item.product_id]
                    );
                }
            }
    
            // Update order status and reason
            await connection.execute(
                'UPDATE orders SET status = ?, cancel_reason = ? WHERE order_id = ?',
                ['cancelled', reason, orderId]
            );
    
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
   
}

module.exports = Order;