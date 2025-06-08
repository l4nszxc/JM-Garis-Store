const db = require('../config/db');

class Reward {
    static async getUserPoints(userId) {
        try {
            const [result] = await db.query(
                'SELECT COALESCE(SUM(points), 0) as total_points FROM user_rewards WHERE user_id = ?',
                [userId]
            );
            return result[0].total_points || 0;
        } catch (error) {
            throw error;
        }
    }

    static async getAvailableRewards() {
        try {
            const [rewards] = await db.query(
                'SELECT * FROM reward_tiers ORDER BY points_required ASC'
            );
            return rewards;
        } catch (error) {
            throw error;
        }
    }

    static async getRewardHistory(userId) {
        try {
            const [history] = await db.query(
                `SELECT * FROM user_rewards 
                WHERE user_id = ? 
                ORDER BY created_at DESC`,
                [userId]
            );
            return history;
        } catch (error) {
            throw error;
        }
    }

    static async getTotalPointsEarned(userId) {
        try {
            const [result] = await db.query(
                'SELECT COALESCE(SUM(points), 0) as total FROM user_rewards WHERE user_id = ? AND points > 0',
                [userId]
            );
            return result[0].total || 0;
        } catch (error) {
            throw error;
        }
    }
    static async addPoints(userId, orderId, amount) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Calculate points (1 point per 100 spent)
            const points = Math.floor(amount / 100);

            if (points > 0) {
                await connection.query(
                    `INSERT INTO user_rewards (user_id, order_id, points, description, created_at) 
                    VALUES (?, ?, ?, ?, NOW())`,
                    [userId, orderId, points, `Earned points from order #${orderId}`]
                );
            }

            await connection.commit();
            return points;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async redeemPoints(userId, points, rewardId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Check current points
            const [[currentPoints]] = await connection.query(
                'SELECT COALESCE(SUM(points), 0) as total FROM user_rewards WHERE user_id = ?',
                [userId]
            );

            if (currentPoints.total < points) {
                throw new Error('Insufficient points');
            }

            // Get reward details
            const [rewards] = await connection.query(
                'SELECT * FROM reward_tiers WHERE id = ?',
                [rewardId]
            );

            if (!rewards.length) {
                throw new Error('Invalid reward');
            }

            // Record redemption
            await connection.query(
                `INSERT INTO user_rewards (user_id, points, description) 
                VALUES (?, ?, ?)`,
                [userId, -points, `Redeemed for ${rewards[0].name}`]
            );

            // Create available discount
            await connection.query(
                `INSERT INTO available_discounts (user_id, amount) 
                VALUES (?, ?)`,
                [userId, rewards[0].discount_amount]
            );

            await connection.commit();
            return rewards[0];
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    static async getAvailableDiscounts(userId) {
        try {
            const [discounts] = await db.query(
                `SELECT * FROM available_discounts 
                WHERE user_id = ? 
                AND used = FALSE 
                AND expires_at > NOW()
                ORDER BY created_at DESC`,
                [userId]
            );
            return discounts;
        } catch (error) {
            throw error;
        }
    }

    static async applyDiscount(userId, orderId, discountId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Mark discount as used
            await connection.query(
                `UPDATE available_discounts 
                SET used = TRUE, order_id = ? 
                WHERE id = ? AND user_id = ? AND used = FALSE`,
                [orderId, discountId, userId]
            );

            // Get discount amount
            const [[discount]] = await connection.query(
                'SELECT amount FROM available_discounts WHERE id = ?',
                [discountId]
            );

            await connection.commit();
            return discount.amount;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Reward;