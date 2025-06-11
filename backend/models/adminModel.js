const db = require('../config/db');
const bcrypt = require('bcryptjs'); 
const path = require('path');
const fs = require('fs');

class Admin {
    static async getUserStats() {
        try {
            const [result] = await db.execute(`
                SELECT 
                    COUNT(*) as totalUsers,
                    SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verifiedUsers,
                    SUM(CASE WHEN email_verified = 0 THEN 1 ELSE 0 END) as unverifiedUsers
                FROM users
                WHERE role = 'user'
            `);
            return result[0];
        } catch (error) {
            throw error;
        }
    }
    static async createStaff(staffData) {
        try {
            const hashedPassword = await bcrypt.hash(staffData.password, 10);
            
            const [result] = await db.execute(`
                INSERT INTO users (
                    username,
                    firstname, 
                    middlename, 
                    lastname, 
                    gender, 
                    civil_status, 
                    phone_number, 
                    address, 
                    birthdate, 
                    email, 
                    role, 
                    password,
                    email_verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'staff', ?, 1)
            `, [
                staffData.username,
                staffData.firstname,
                staffData.middlename,
                staffData.lastname,
                staffData.gender,
                staffData.civilStatus,
                staffData.phoneNumber,
                staffData.address,
                staffData.birthdate,
                staffData.email,
                hashedPassword
            ]);
            return result;
        } catch (error) {
            throw error;               
        }
    }
    static async updateStaff(staffId, staffData) {
        try {
            const [result] = await db.execute(`
                UPDATE users 
                SET 
                    username = ?,
                    firstname = ?,
                    middlename = ?,
                    lastname = ?,
                    gender = ?,
                    civil_status = ?,
                    phone_number = ?,
                    address = ?,
                    email = ?
                WHERE id = ? AND role = 'staff'
            `, [
                staffData.username,
                staffData.firstname,
                staffData.middlename,
                staffData.lastname,
                staffData.gender,
                staffData.civilStatus,
                staffData.phoneNumber,
                staffData.address,
                staffData.email,
                staffId
            ]);
            return result;
        } catch (error) {
            throw error;
        }
    }
    
    static async deleteStaff(staffId) {
        try {
            const [result] = await db.execute(
                'DELETE FROM users WHERE id = ? AND role = "staff"',
                [staffId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }
    static async getAllUsers() {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    id, 
                    username, 
                    firstname,
                    middlename,
                    lastname,
                    gender,
                    phone_number,
                    address,
                    birthdate,
                    email, 
                    created_at, 
                    email_verified, 
                    role
                FROM users 
                WHERE role = 'user'
                ORDER BY created_at DESC
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    static async getAllStaff() {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    u.id as user_id,
                    u.username,
                    u.firstname,
                    u.middlename,
                    u.lastname,
                    CONCAT(u.firstname, ' ', COALESCE(u.middlename, ''), ' ', u.lastname) as fullname,
                    u.gender,
                    u.civil_status,
                    u.phone_number,
                    u.address,
                    u.email,
                    u.role as position,
                    CASE 
                        WHEN u.email_verified = 1 THEN 'active'
                        ELSE 'inactive'
                    END as status,
                    u.created_at
                FROM users u
                WHERE u.role = 'staff'
                ORDER BY u.created_at DESC
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async isAdmin(userId) {
        try {
            const [rows] = await db.execute(
                'SELECT role FROM users WHERE id = ?',
                [userId]
            );
            return rows[0]?.role === 'admin';
        } catch (error) {
            throw error;
        }
    }
    static async getDashboardStats() {
        try {
            // Keep existing base stats query
            const [salesStats] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT o.order_id) as totalOrders,
                    COALESCE(SUM(o.total_amount), 0) as totalSales,
                    (SELECT COUNT(*) FROM products) as totalProducts,
                    (SELECT SUM(stock_quantity) FROM products) as totalStock,
                    (SELECT COUNT(*) FROM users WHERE role = 'user') as totalUsers
                FROM orders o
                WHERE o.status = 'paid'
            `);
    
            // Keep existing top products query
            const [topProducts] = await db.execute(`
                SELECT 
                    p.name,
                    p.image,
                    SUM(CASE 
                        WHEN o.status = 'paid' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                        THEN oi.quantity 
                        ELSE 0 
                    END) as weekly_quantity,
                    SUM(CASE 
                        WHEN o.status = 'paid' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                        THEN (oi.price * oi.quantity) 
                        ELSE 0 
                    END) as weekly_revenue,
                    SUM(CASE WHEN o.status = 'paid' THEN oi.quantity ELSE 0 END) as total_quantity,
                    SUM(CASE WHEN o.status = 'paid' THEN (oi.price * oi.quantity) ELSE 0 END) as total_revenue,
                    COUNT(DISTINCT CASE 
                        WHEN o.status = 'paid' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                        THEN o.order_id 
                    END) as weekly_orders
                FROM products p
                LEFT JOIN order_items oi ON p.products_id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.order_id
                GROUP BY p.products_id, p.name
                HAVING weekly_quantity > 0 OR total_quantity > 0
                ORDER BY weekly_quantity DESC, weekly_revenue DESC
                LIMIT 5
            `);
    
            // Updated low stock query to include products with stock <= 30
            // Get products with stock <= 30
            const [lowStockProducts] = await db.execute(`
                SELECT 
                    products_id as id,
                    'product' as type,
                    name,
                    description,
                    stock_quantity as stock,
                    price,
                    category,
                    image,
                    NULL as choice_id,
                    NULL as product_name,
                    NULL as choice_name
                FROM products
                WHERE stock_quantity <= 30  /* Changed from stock_quantity <= 10 */
            `);
            
            // Get choices/variants with stock <= 30
            const [lowStockChoices] = await db.execute(`
                SELECT 
                    pc.product_id as id,
                    'choice' as type,
                    p.name as product_name,
                    p.description,
                    pc.stock as stock,
                    pc.price,
                    p.category,
                    COALESCE(pc.image, p.image) as image,
                    pc.choice_id,
                    p.name as product_name,
                    pc.name as choice_name
                FROM product_choices pc
                JOIN products p ON pc.product_id = p.products_id
                WHERE pc.stock <= 30  /* Changed from pc.stock <= 10 */
            `);
            
            // Combine both results
            const lowStock = [...lowStockProducts, ...lowStockChoices].sort((a, b) => a.stock - b.stock);
    
            // Rest of the code remains the same
            const [topStaff] = await db.execute(`
                SELECT 
                    u.username,
                    COUNT(DISTINCT o.order_id) as orders_handled,
                    COALESCE(SUM(o.total_amount), 0) as total_sales
                FROM users u
                LEFT JOIN orders o ON u.id = o.accepted_by
                WHERE u.role = 'staff'
                AND o.status IN ('ready for pickup', 'paid')
                GROUP BY u.id, u.username
                ORDER BY orders_handled DESC, total_sales DESC
                LIMIT 5
            `);
    
            return {
                ...salesStats[0],
                topProducts: topProducts || [],
                lowStock: lowStock || [],
                topStaff: topStaff || []
            };
        } catch (error) {
            console.error('Error in getDashboardStats:', error);
            throw error;
        }
    }
    static async getAllOrders() {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    o.order_id,
                    u.username as customer_name,
                    o.customer_name as physical_customer_name,
                    o.status,
                    o.total_amount,
                    o.created_at,
                    o.cancel_reason,
                    o.accepted_by,
                    o.accepted_at,
                    o.is_physical_order,
                    s.username as staff_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN users s ON o.accepted_by = s.id
                ORDER BY o.created_at DESC
            `);
            
            // Format customer names for physical orders
            return rows.map(order => ({
                ...order,
                customer_name: order.is_physical_order ? order.physical_customer_name : order.customer_name
            }));
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
    
            const [orderItems] = await db.execute(`
                SELECT 
                    oi.product_id,
                    oi.quantity,
                    oi.price,
                    oi.choice_id,
                    p.name,
                    p.image,
                    pc.name as choice_name,
                    COALESCE(pc.image, p.image) as actual_image
                FROM order_items oi
                JOIN products p ON oi.product_id = p.products_id
                LEFT JOIN product_choices pc ON oi.choice_id = pc.choice_id
                WHERE oi.order_id = ?
            `, [orderId]);
    
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
                items: formattedItems,
                subtotal: orderDetails[0].subtotal || orderDetails[0].total_amount,
                discount_amount: parseFloat(orderDetails[0].discount_amount) || 0
            };
        } catch (error) {
            throw error;
        }
    }
    static async deleteProduct(productId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
    
            // Get the product image name to delete the file
            const [product] = await connection.execute(
                'SELECT image FROM products WHERE products_id = ?',
                [productId]
            );
    
            // Get all choice_ids for this product
            const [choices] = await connection.execute(
                'SELECT choice_id FROM product_choices WHERE product_id = ?',
                [productId]
            );
            
            // Delete from cart table first (where either product_id matches or choice_id matches)
            await connection.execute(
                'DELETE FROM cart WHERE product_id = ? OR choice_id IN (SELECT choice_id FROM product_choices WHERE product_id = ?)',
                [productId, productId]
            );
    
            // Delete from order_items table
            await connection.execute(
                'DELETE FROM order_items WHERE product_id = ?',
                [productId]
            );
    
            // Now safe to delete product choices
            await connection.execute(
                'DELETE FROM product_choices WHERE product_id = ?',
                [productId]
            );
    
            // Finally delete the product
            await connection.execute(
                'DELETE FROM products WHERE products_id = ?',
                [productId]
            );
    
            // If product had an image, delete it from uploads folder
            if (product[0]?.image) {
                const imagePath = path.join(__dirname, '../uploads', product[0].image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
    
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    static async getLowStockItems() {
        try {
            // Get products with stock <= 30
            const [lowStockProducts] = await db.execute(`
                SELECT 
                    products_id as id,
                    'product' as type,
                    name,
                    description,
                    stock_quantity as stock,
                    price,
                    category,
                    image,
                    NULL as choice_id,
                    NULL as product_name,
                    NULL as choice_name
                FROM products
                WHERE stock_quantity <= 30
            `);
            
            // Get choices/variants with stock <= 30
            const [lowStockChoices] = await db.execute(`
                SELECT 
                    pc.product_id as id,
                    'choice' as type,
                    p.name as product_name,
                    p.description,
                    pc.stock as stock,
                    pc.price,
                    p.category,
                    COALESCE(pc.image, p.image) as image,
                    pc.choice_id,
                    p.name as product_name,
                    pc.name as choice_name
                FROM product_choices pc
                JOIN products p ON pc.product_id = p.products_id
                WHERE pc.stock <= 30
            `);
            
            // Combine both results and sort by stock level (lowest first)
            return [...lowStockProducts, ...lowStockChoices].sort((a, b) => a.stock - b.stock);
        } catch (error) {
            console.error('Error in getLowStockItems:', error);
            throw error;
        }
    }
}

module.exports = Admin;