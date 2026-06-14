const db = require('../config/db');

class Notification {
    static async create(userId, title, message, type = 'info', icon = 'fas fa-bell', relatedOrderId = null, actionUrl = null, customId = null) {
        try {
            if (customId) {
                // Use INSERT ... ON DUPLICATE KEY UPDATE to handle duplicates gracefully
                const [result] = await db.execute(
                    `INSERT INTO notifications (user_id, title, message, type, icon, related_order_id, action_url, custom_id, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE 
                        title = VALUES(title),
                        message = VALUES(message),
                        type = VALUES(type),
                        icon = VALUES(icon),
                        related_order_id = VALUES(related_order_id),
                        action_url = VALUES(action_url),
                        updated_at = NOW()`,
                    [userId, title, message, type, icon, relatedOrderId, actionUrl, customId]
                );
                return result.insertId || result.affectedRows; // Return insert ID or affected rows for updates
            } else {
                // Normal insert without custom_id
                const [result] = await db.execute(
                    'INSERT INTO notifications (user_id, title, message, type, icon, related_order_id, action_url, custom_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, title, message, type, icon, relatedOrderId, actionUrl, customId]
                );
                return result.insertId;
            }
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(userId, includeDeleted = false) {
        try {
            let query = 'SELECT * FROM notifications WHERE user_id = ?';
            let params = [userId];

            if (!includeDeleted) {
                query += ' AND is_deleted = 0';
            }

            query += ' ORDER BY created_at DESC';

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findByCustomId(customId, userId) {
        try {
            const [rows] = await db.execute('SELECT * FROM notifications WHERE custom_id = ? AND user_id = ?', [customId, userId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.execute('SELECT * FROM notifications WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async markAsRead(id) {
        try {
            const [result] = await db.execute(
                'UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async markAsUnread(id) {
        try {
            const [result] = await db.execute(
                'UPDATE notifications SET is_read = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async markAllAsRead(userId) {
        try {
            const [result] = await db.execute(
                'UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_deleted = 0',
                [userId]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.execute(
                'UPDATE notifications SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async deleteMultiple(ids) {
        try {
            const placeholders = ids.map(() => '?').join(',');
            const [result] = await db.execute(
                `UPDATE notifications SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
                ids
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    static async getUnreadCount(userId) {
        try {
            const [rows] = await db.execute(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0 AND is_deleted = 0',
                [userId]
            );
            return rows[0].count;
        } catch (error) {
            throw error;
        }
    }

    static async permanentlyDelete(id) {
        try {
            const [result] = await db.execute('DELETE FROM notifications WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async cleanOldDeleted(days = 30) {
        try {
            const [result] = await db.execute(
                'DELETE FROM notifications WHERE is_deleted = 1 AND updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
                [days]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Notification;
