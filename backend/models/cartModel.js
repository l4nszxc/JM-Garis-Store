const db = require('../config/db');

class Cart {
    static async getCart(userId) {
        try {
            const [rows] = await db.execute(
                `SELECT 
                    c.id,
                    c.product_id, 
                    c.quantity, 
                    c.choice_id,
                    p.name, 
                    CAST(p.price AS DECIMAL(10,2)) as price, 
                    p.image,
                    pc.name as choice_name,
                    CAST(COALESCE(pc.price, p.price) AS DECIMAL(10,2)) as actual_price,
                    pc.image as choice_image
                FROM cart c
                JOIN products p ON c.product_id = p.products_id
                LEFT JOIN product_choices pc ON c.choice_id = pc.choice_id
                WHERE c.user_id = ?`,
                [userId]
            );
            
            return rows.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                choice_id: item.choice_id,
                name: item.name + (item.choice_name ? ` (${item.choice_name})` : ''),
                original_name: item.name,
                choice_name: item.choice_name || null,
                price: parseFloat(item.actual_price || item.price),
                image: item.choice_image || item.image || null
            }));
        } catch (error) {
            throw error;
        }
    }

    static async addToCart(userId, productId, quantity, choiceId = null) {
        if (!userId || !productId || !quantity) {
            throw new Error('User ID, product ID, and quantity are required');
        }

        try {
            // Check if the item (with the same choice if applicable) already exists in the cart
            const [existing] = await db.execute(
                'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND (choice_id = ? OR (choice_id IS NULL AND ? IS NULL))',
                [userId, productId, choiceId, choiceId]
            );

            if (existing.length > 0) {
                await db.execute(
                    'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND (choice_id = ? OR (choice_id IS NULL AND ? IS NULL))',
                    [quantity, userId, productId, choiceId, choiceId]
                );
            } else {
                await db.execute(
                    'INSERT INTO cart (user_id, product_id, quantity, choice_id) VALUES (?, ?, ?, ?)',
                    [userId, productId, quantity, choiceId]
                );
            }
        } catch (error) {
            throw error;
        }
    }

    static async updateQuantity(userId, cartId, quantity) {
        if (!userId || !cartId || !quantity) {
            throw new Error('User ID, cart ID, and quantity are required');
        }

        try {
            await db.execute(
                'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
                [quantity, cartId, userId]
            );
        } catch (error) {
            throw error;
        }
    }

    static async removeFromCart(userId, cartId) {
        if (!userId || !cartId) {
            throw new Error('User ID and cart ID are required');
        }

        try {
            await db.execute(
                'DELETE FROM cart WHERE id = ? AND user_id = ?',
                [cartId, userId]
            );
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Cart;