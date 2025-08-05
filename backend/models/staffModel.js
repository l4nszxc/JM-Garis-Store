const db = require('../config/db');
const bcrypt = require('bcryptjs');

class Staff {
    static async create(fullname, email, position, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await db.execute(
                'INSERT INTO staff (fullname, email, position, password) VALUES (?, ?, ?, ?)',
                [fullname, email, position, hashedPassword]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await db.execute('SELECT * FROM staff WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    static async getAllOrders() {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    o.order_id,
                    u.username as customer_name,
                    o.status,
                    o.total_amount,
                    o.created_at,
                    o.cancel_reason,
                    o.accepted_by,
                    o.accepted_at,
                    o.payment_method,
                    s.username as staff_name
                FROM orders o
                JOIN users u ON o.user_id = u.id
                LEFT JOIN users s ON o.accepted_by = s.id
                ORDER BY o.created_at DESC
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    static async getOrderDetails(orderId) {
        try {
            const [orderDetails] = await db.query(
                `SELECT o.*, 
                    u.username as customer_name,
                    s.username as staff_name,
                    ad.amount as discount_amount,
                    o.payment_method,
                    (SELECT SUM(oi.price * oi.quantity) 
                     FROM order_items oi 
                     WHERE oi.order_id = o.order_id) as subtotal
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN users s ON o.accepted_by = s.id
                LEFT JOIN available_discounts ad ON o.order_id = ad.order_id AND ad.used = TRUE
                WHERE o.order_id = ?`,
                [orderId]
            );
    
            // Get order items
            const [orderItems] = await db.query(
                `SELECT oi.*, p.name, p.image, pc.name as choice_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.products_id
                LEFT JOIN product_choices pc ON oi.choice_id = pc.choice_id
                WHERE oi.order_id = ?`,
                [orderId]
            );
    
            if (!orderDetails[0]) {
                return null;
            }
    
            // Format items to include choice information
            const formattedItems = orderItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                name: item.choice_name ? `${item.name} (${item.choice_name})` : item.name,
                original_name: item.name,
                choice_name: item.choice_name,
                choice_id: item.choice_id,
                image: item.actual_image || item.image
            }));
    
            return {
                ...orderDetails[0],
                items: formattedItems
            };
        } catch (error) {
            throw error;
        }
    }
    

    static async updateOrderStatus(orderId, status) {
        try {
            const [result] = await db.execute(
                'UPDATE orders SET status = ? WHERE order_id = ?',
                [status, orderId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }
    static async acceptOrder(orderId, staffId) {
        try {
            await db.execute(`
                UPDATE orders 
                SET status = 'preparing', 
                    accepted_by = ?, 
                    accepted_at = CURRENT_TIMESTAMP 
                WHERE order_id = ?
            `, [staffId, orderId]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }
    static async getAcceptedOrders(staffId) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    o.order_id,
                    u.username as customer_name,
                    o.status,
                    o.total_amount,
                    o.created_at,
                    o.accepted_at,
                    o.accepted_by,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'product_id', oi.product_id,
                            'quantity', oi.quantity,
                            'price', oi.price,
                            'name', p.name,
                            'image', p.image
                        )
                    ) as items
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN products p ON oi.product_id = p.products_id
                WHERE o.accepted_by = ?
                GROUP BY o.order_id, o.status, o.total_amount, o.created_at, o.accepted_at, o.accepted_by, u.username
                ORDER BY o.accepted_at DESC
            `, [staffId]);
    
            return rows.map(order => {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                return {
                    ...order,
                    items: items
                };
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Staff;