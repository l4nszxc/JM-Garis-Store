const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticate);

// Create a new notification (admin/staff use)
router.post('/', notificationController.createNotification);

// Get user's notifications
router.get('/', notificationController.getUserNotifications);

// Get specific notification by ID
router.get('/:id', notificationController.getNotificationById);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark notification as unread
router.put('/:id/unread', notificationController.markAsUnread);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Delete a notification (soft delete)
router.delete('/:id', notificationController.deleteNotification);

// Delete multiple notifications
router.delete('/', notificationController.deleteMultipleNotifications);

// Get unread notification count
router.get('/unread/count', notificationController.getUnreadCount);

// Permanently delete a notification (hard delete - admin only)
router.delete('/:id/permanent', notificationController.permanentlyDeleteNotification);

// Clean up old deleted notifications (admin only)
router.delete('/cleanup/old', notificationController.cleanOldDeleted);

module.exports = router;
