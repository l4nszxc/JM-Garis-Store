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
    static async validateAmount(amount) {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0) {
            throw new Error(`Invalid amount: ${amount}`);
        }
        if (numAmount > 1000000) { // Set a reasonable maximum
            throw new Error(`Amount too large: ₱${numAmount}`);
        }
        return numAmount;
    }

    static async addPoints(userId, orderId, amount) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Ensure amount is properly converted to decimal
            const orderAmount = parseFloat(amount);
            console.log(`Processing order amount: ₱${orderAmount}`);

            // Get current rewards settings
            const rewardsSettings = await this.getRewardsSettings();
            
            // Calculate base points using dynamic settings
            const basePoints = Math.floor(orderAmount / rewardsSettings.amount_threshold) * rewardsSettings.points_per_amount;
            
            // Initialize bonusPoints outside the if block
            let bonusPoints = 0;
            
            if (basePoints > 0) {
                // Get user's loyalty status and bonus
                const loyaltyBonus = await this.getLoyaltyBonus(userId, connection);
                
                // Calculate bonus points based on loyalty tier
                bonusPoints = Math.floor(basePoints * loyaltyBonus / 100);
                const totalPoints = basePoints + bonusPoints;

                // Add base points
                await connection.query(
                    `INSERT INTO user_rewards (user_id, order_id, points, description, created_at) 
                    VALUES (?, ?, ?, ?, NOW())`,
                    [userId, orderId, basePoints, `Earned points from order #${orderId} (₱${orderAmount.toFixed(2)})`]
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
                await this.updateMonthlySpend(userId, orderAmount, connection);
            }

            await connection.commit();
            return basePoints + bonusPoints;
        } catch (error) {
            await connection.rollback();
            console.error('Error in addPoints:', error);
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
        // Ensure amount is properly converted to decimal
        const spendAmount = parseFloat(amount);
        console.log(`Updating monthly spend for user ${userId}: adding ₱${spendAmount.toFixed(2)}`);
        
        // Check if user exists in loyalty status
        const [existing] = await connection.query(
            'SELECT current_month_spend FROM user_loyalty_status WHERE user_id = ?',
            [userId]
        );

        if (existing.length === 0) {
            // Create new loyalty status record
            await connection.query(
                `INSERT INTO user_loyalty_status (user_id, current_month_spend) 
                VALUES (?, ?)`,
                [userId, spendAmount]
            );
            console.log(`Created new loyalty status for user ${userId} with spend ₱${spendAmount.toFixed(2)}`);
        } else {
            const currentSpend = parseFloat(existing[0].current_month_spend);
            const newSpend = currentSpend + spendAmount;
            
            await connection.query(
                `UPDATE user_loyalty_status 
                SET current_month_spend = ? 
                WHERE user_id = ?`,
                [newSpend, userId]
            );
            console.log(`Updated user ${userId} spend from ₱${currentSpend.toFixed(2)} to ₱${newSpend.toFixed(2)}`);
        }

        // Check and update loyalty tier after updating spend
        await this.checkAndUpdateLoyaltyTier(userId, connection);
    } catch (error) {
        console.error('Error in updateMonthlySpend:', error);
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

        const monthlySpend = parseFloat(spendData[0].current_month_spend);
        console.log(`Checking tier for user ${userId} with monthly spend: ${monthlySpend}`);

        // Get loyalty tiers ordered by minimum spend (ascending)
        const [tiers] = await connection.query(
            'SELECT * FROM loyalty_tiers ORDER BY min_spend ASC'
        );

        let appropriateTier = null;
        
        // Find the highest tier the user qualifies for
        for (const tier of tiers) {
            const minSpend = parseFloat(tier.min_spend);
            const maxSpend = tier.max_spend ? parseFloat(tier.max_spend) : null;
            
            console.log(`Checking tier ${tier.name}: min=${minSpend}, max=${maxSpend}, userSpend=${monthlySpend}`);
            
            if (monthlySpend >= minSpend) {
                if (!maxSpend || monthlySpend <= maxSpend) {
                    appropriateTier = tier;
                    console.log(`User qualifies for tier: ${tier.name}`);
                } else {
                    console.log(`User exceeds max spend for tier ${tier.name}`);
                }
            } else {
                console.log(`User doesn't meet min spend for tier ${tier.name}`);
            }
        }

        // Get current tier
        const [currentTierData] = await connection.query(
            'SELECT loyalty_tier_id FROM user_loyalty_status WHERE user_id = ?',
            [userId]
        );

        const currentTierId = currentTierData[0]?.loyalty_tier_id;
        console.log(`Current tier ID: ${currentTierId}, Appropriate tier: ${appropriateTier?.name || 'None'}`);

        // Only update if tier changed
        if (appropriateTier && appropriateTier.id !== currentTierId) {
            const tierEndDate = new Date();
            tierEndDate.setMonth(tierEndDate.getMonth() + 3);

            await connection.query(
                `UPDATE user_loyalty_status 
                SET loyalty_tier_id = ?, 
                    tier_start_date = CURDATE(), 
                    tier_end_date = ? 
                WHERE user_id = ?`,
                [appropriateTier.id, tierEndDate.toISOString().split('T')[0], userId]
            );
            console.log(`Updated user ${userId} to tier ${appropriateTier.name}`);
        } else if (!appropriateTier && currentTierId) {
            // Remove tier if user no longer qualifies
            await connection.query(
                `UPDATE user_loyalty_status 
                SET loyalty_tier_id = NULL, 
                    tier_start_date = NULL, 
                    tier_end_date = NULL 
                WHERE user_id = ?`,
                [userId]
            );
            console.log(`Removed tier for user ${userId} - no longer qualifies`);
        } else {
            console.log(`No tier change needed for user ${userId}`);
        }
    } catch (error) {
        console.error('Error in checkAndUpdateLoyaltyTier:', error);
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
    static async resetMonthlySpending() {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Move current month to last month, last month to two months ago
            await connection.query(`
                UPDATE user_loyalty_status 
                SET 
                    two_months_ago_spend = last_month_spend,
                    last_month_spend = current_month_spend,
                    current_month_spend = 0.00
            `);

            // Check if users still qualify for their tiers based on average spending
            await connection.query(`
                UPDATE user_loyalty_status uls
                LEFT JOIN loyalty_tiers lt ON uls.loyalty_tier_id = lt.id
                SET 
                    uls.loyalty_tier_id = NULL,
                    uls.tier_start_date = NULL,
                    uls.tier_end_date = NULL
                WHERE uls.loyalty_tier_id IS NOT NULL
                AND (uls.last_month_spend + uls.two_months_ago_spend) / 2 < lt.min_spend
            `);

            await connection.commit();
            console.log('Monthly spending reset completed');
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Reward;