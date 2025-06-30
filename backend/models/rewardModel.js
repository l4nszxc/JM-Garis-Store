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

            // Get current rewards settings
            const rewardsSettings = await this.getRewardsSettings();
            
            // Calculate base points using dynamic settings
            const basePoints = Math.floor(amount / rewardsSettings.amount_threshold) * rewardsSettings.points_per_amount;
            
            if (basePoints > 0) {
                // Get user's loyalty status and bonus
                const loyaltyBonus = await this.getLoyaltyBonus(userId, connection);
                
                // Calculate bonus points based on loyalty tier
                const bonusPoints = Math.floor(basePoints * loyaltyBonus / 100);
                const totalPoints = basePoints + bonusPoints;

                // Add base points
                await connection.query(
                    `INSERT INTO user_rewards (user_id, order_id, points, description, created_at) 
                    VALUES (?, ?, ?, ?, NOW())`,
                    [userId, orderId, basePoints, `Earned points from order #${orderId} (₱${amount})`]
                );

                // Add loyalty bonus points if any
                if (bonusPoints > 0) {
                    const [loyaltyTier] = await connection.query(
                        `SELECT lt.name FROM user_loyalty_status uls 
                         JOIN loyalty_tiers lt ON uls.loyalty_tier_id = lt.id 
                         WHERE uls.user_id = ?`,
                        [userId]
                    );
                    
                    const tierName = loyaltyTier[0]?.name || 'Unknown';
                    await connection.query(
                        `INSERT INTO user_rewards (user_id, order_id, points, description, created_at) 
                        VALUES (?, ?, ?, ?, NOW())`,
                        [userId, orderId, bonusPoints, `${tierName} loyalty bonus (+${loyaltyBonus}%)`]
                    );
                }

                // Update user's monthly spend for loyalty tracking
                await this.updateMonthlySpend(userId, amount, connection);
            }

            await connection.commit();
            return basePoints + (bonusPoints || 0);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    static async getRewardsSettings() {
        try {
            const [settings] = await db.query('SELECT * FROM rewards_settings ORDER BY id DESC LIMIT 1');
            
            if (settings.length === 0) {
                return {
                    points_per_amount: 1,
                    amount_threshold: 100.00,
                    point_value: 0.50
                };
            }
            
            return settings[0];
        } catch (error) {
            console.error('Error getting rewards settings:', error);
            return {
                points_per_amount: 1,
                amount_threshold: 100.00,
                point_value: 0.50
            };
        }
    }
    static async getLoyaltyBonus(userId, connection) {
        try {
            const [result] = await connection.query(
                `SELECT lt.bonus_percentage 
                 FROM user_loyalty_status uls 
                 JOIN loyalty_tiers lt ON uls.loyalty_tier_id = lt.id 
                 WHERE uls.user_id = ? AND uls.tier_end_date >= CURDATE()`,
                [userId]
            );
            
            return result[0]?.bonus_percentage || 0;
        } catch (error) {
            return 0;
        }
    }

    static async updateMonthlySpend(userId, amount, connection) {
        try {
            // Check if user exists in loyalty status
            const [existing] = await connection.query(
                'SELECT * FROM user_loyalty_status WHERE user_id = ?',
                [userId]
            );

            if (existing.length === 0) {
                // Create new loyalty status record
                await connection.query(
                    `INSERT INTO user_loyalty_status (user_id, current_month_spend) 
                     VALUES (?, ?)`,
                    [userId, amount]
                );
            } else {
                // Update existing record
                await connection.query(
                    `UPDATE user_loyalty_status 
                     SET current_month_spend = current_month_spend + ? 
                     WHERE user_id = ?`,
                    [amount, userId]
                );
            }

            // Check and update loyalty tier
            await this.checkAndUpdateLoyaltyTier(userId, connection);
        } catch (error) {
            throw error;
        }
    }

    static async checkAndUpdateLoyaltyTier(userId, connection) {
        try {
            // Get current monthly spend
            const [spendData] = await connection.query(
                'SELECT current_month_spend FROM user_loyalty_status WHERE user_id = ?',
                [userId]
            );

            if (spendData.length === 0) return;

            const monthlySpend = spendData[0].current_month_spend;

            // Determine appropriate tier based on new thresholds
            const [tiers] = await connection.query(
                'SELECT * FROM loyalty_tiers ORDER BY min_spend DESC'
            );

            let appropriateTier = null;
            for (const tier of tiers) {
                if (monthlySpend >= tier.min_spend) {
                    if (!tier.max_spend || monthlySpend <= tier.max_spend) {
                        appropriateTier = tier;
                        break;
                    }
                }
            }

            if (appropriateTier) {
                const tierEndDate = new Date();
                tierEndDate.setMonth(tierEndDate.getMonth() + 3); // 3 months validity

                await connection.query(
                    `UPDATE user_loyalty_status 
                     SET loyalty_tier_id = ?, 
                         tier_start_date = CURDATE(), 
                         tier_end_date = ? 
                     WHERE user_id = ?`,
                    [appropriateTier.id, tierEndDate.toISOString().split('T')[0], userId]
                );
            }
        } catch (error) {
            throw error;
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

            // Record redemption (deduct points)
            await connection.query(
                `INSERT INTO user_rewards (user_id, points, description) 
                VALUES (?, ?, ?)`,
                [userId, -points, `Redeemed for ${rewards[0].name} - ₱${rewards[0].discount_amount} discount`]
            );

            // Create available discount with 30-day expiry
            await connection.query(
                `INSERT INTO available_discounts (user_id, amount, expires_at) 
                VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
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

    static async getUserLoyaltyStatus(userId) {
        try {
            const [result] = await db.query(
                `SELECT uls.*, lt.name as tier_name, lt.bonus_percentage, lt.has_free_product
                 FROM user_loyalty_status uls 
                 LEFT JOIN loyalty_tiers lt ON uls.loyalty_tier_id = lt.id 
                 WHERE uls.user_id = ?`,
                [userId]
            );
            
            return result[0] || null;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Reward;