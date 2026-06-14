const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class SharedCart {
    static async createShareLink(ownerId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const shareId = uuidv4();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // Link expires in 24 hours

            await connection.execute(
                'INSERT INTO shared_carts (share_id, owner_id, expires_at, status) VALUES (?, ?, ?, ?)',
                [shareId, ownerId, expiresAt, 'active']
            );

            // Get owner's cart items
            const [cartItems] = await connection.execute(
                `SELECT c.*, p.name, p.image, pc.name as choice_name, pc.image as choice_image
                 FROM cart c
                 JOIN products p ON c.product_id = p.products_id
                 LEFT JOIN product_choices pc ON c.choice_id = pc.choice_id
                 WHERE c.user_id = ?`,
                [ownerId]
            );

            await connection.commit();
            return { shareId, cartItems, expiresAt };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getSharedCart(shareId) {
        const [share] = await db.execute(
            `SELECT sc.*, u.username as owner_name 
             FROM shared_carts sc
             JOIN users u ON sc.owner_id = u.id
             WHERE sc.share_id = ? AND sc.status = 'active' AND sc.expires_at > NOW()`,
            [shareId]
        );

        if (!share[0]) {
            throw new Error('Shared cart not found or expired');
        }        const [cartItems] = await db.execute(
            `SELECT 
                c.*, 
                p.name, 
                p.image, 
                CAST(p.price AS DECIMAL(10,2)) as price, 
                pc.name as choice_name, 
                pc.image as choice_image,
                CAST(COALESCE(pc.price, p.price) AS DECIMAL(10,2)) as actual_price
             FROM cart c
             JOIN products p ON c.product_id = p.products_id
             LEFT JOIN product_choices pc ON c.choice_id = pc.choice_id
             WHERE c.user_id = ?`,
            [share[0].owner_id]
        );

        return {
            share: share[0],
            items: cartItems.map(item => ({
                ...item,
                price: parseFloat(item.actual_price || item.price)
            }))
        };
    }

    static async acceptSharedCart(shareId, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get shared cart details
            const [share] = await connection.execute(
                'SELECT * FROM shared_carts WHERE share_id = ? AND status = "active"',
                [shareId]
            );

            if (!share[0]) {
                throw new Error('Invalid or expired share link');
            }

            // Update share status to indicate it's been accepted
            await connection.execute(
                'UPDATE shared_carts SET shared_with = ? WHERE share_id = ?',
                [userId, shareId]
            );

            await connection.commit();
            return { ownerId: share[0].owner_id };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async syncSharedCart(shareId) {
        const [share] = await db.execute(
            'SELECT * FROM shared_carts WHERE share_id = ?',
            [shareId]
        );
        
        if (!share[0]) {
            throw new Error('Shared cart not found');
        }
        
        return share[0];
    }

    static async getActiveSharedCart(userId) {
        // Find carts where user is owner AND someone has accepted (shared_with is not NULL)
        const [ownerCarts] = await db.execute(
            'SELECT * FROM shared_carts WHERE owner_id = ? AND status = "active" AND expires_at > NOW() AND shared_with IS NOT NULL',
            [userId]
        );
        
        // Find carts where user is receiver
        const [receiverCarts] = await db.execute(
            'SELECT * FROM shared_carts WHERE shared_with = ? AND status = "active" AND expires_at > NOW()',
            [userId]
        );
        
        if (ownerCarts.length > 0) {
            return { 
                role: 'owner', 
                shareId: ownerCarts[0].share_id,
                partnerId: ownerCarts[0].shared_with,
                accepted: true
            };
        }
        
        if (receiverCarts.length > 0) {
            return { 
                role: 'receiver', 
                shareId: receiverCarts[0].share_id,
                partnerId: receiverCarts[0].owner_id,
                accepted: true
            };
        }
        
        return null;
    }
    static async terminateSharing(shareId) {
        try {
            // Set status to "expired" to terminate sharing
            const [result] = await db.execute(
                'UPDATE shared_carts SET status = "expired" WHERE share_id = ? AND status = "active"',
                [shareId]
            );
            return result;
        } catch (error) {
            console.error('Error terminating shared cart:', error);
            throw error;
        }
    }
}

module.exports = SharedCart;