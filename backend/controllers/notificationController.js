const Notification = require('../models/notificationModel');

exports.createNotification = async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from authenticated user
        const { title, message, type, icon, related_order_id, action_url, custom_id } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }

        const notificationId = await Notification.create(
            userId,
            title,
            message,
            type || 'info',
            icon || 'fas fa-bell',
            related_order_id,
            action_url,
            custom_id // Pass custom ID if provided
        );

        // Get the created notification
        const notification = await Notification.findById(notificationId);

        res.status(201).json({
            message: 'Notification created successfully',
            notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const includeDeleted = req.query.includeDeleted === 'true';

        const notifications = await Notification.findByUserId(userId, includeDeleted);

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.user_id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(notification);
    } catch (error) {
        console.error('Error fetching notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.user_id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const success = await Notification.markAsRead(id);

        if (success) {
            res.json({ message: 'Notification marked as read' });
        } else {
            res.status(500).json({ message: 'Failed to mark notification as read' });
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsUnread = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.user_id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const success = await Notification.markAsUnread(id);

        if (success) {
            res.json({ message: 'Notification marked as unread' });
        } else {
            res.status(500).json({ message: 'Failed to mark notification as unread' });
        }
    } catch (error) {
        console.error('Error marking notification as unread:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Notification.markAllAsRead(userId);

        res.json({
            message: `${count} notifications marked as read`,
            count
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.user_id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const success = await Notification.delete(id);

        if (success) {
            res.json({ message: 'Notification deleted successfully' });
        } else {
            res.status(500).json({ message: 'Failed to delete notification' });
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteMultipleNotifications = async (req, res) => {
    try {
        const { ids } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Notification IDs array is required' });
        }

        // Verify all notifications belong to the user
        for (const id of ids) {
            const notification = await Notification.findById(id);
            if (!notification || notification.user_id !== userId) {
                return res.status(403).json({ message: 'Access denied to one or more notifications' });
            }
        }

        const count = await Notification.deleteMultiple(ids);

        res.json({
            message: `${count} notifications deleted successfully`,
            count
        });
    } catch (error) {
        console.error('Error deleting multiple notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Notification.getUnreadCount(userId);

        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.permanentlyDeleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.user_id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const success = await Notification.permanentlyDelete(id);

        if (success) {
            res.json({ message: 'Notification permanently deleted' });
        } else {
            res.status(500).json({ message: 'Failed to permanently delete notification' });
        }
    } catch (error) {
        console.error('Error permanently deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.cleanOldDeleted = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        const count = await Notification.cleanOldDeleted(days);

        res.json({
            message: `${count} old deleted notifications cleaned up`,
            count
        });
    } catch (error) {
        console.error('Error cleaning old deleted notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
