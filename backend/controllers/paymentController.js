const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Utility function to clean up uploaded file
function cleanupUploadedFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up uploaded file: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`Error cleaning up uploaded file ${filePath}:`, error);
            return false;
        }
    }
    return false;
}

// Create manual GCash downpayment with reference number
exports.createGCashDownpayment = async (req, res) => {
    try {
        const { downpaymentAmount, totalAmount, remainingAmount, items, discountId, packagingPreference, paymentMethod, gcashReference } = req.body;
        const userId = req.user.id;
        
        // Validate required fields
        if (!gcashReference || gcashReference.trim() === '') {
            return res.status(400).json({ message: 'GCash reference number is required' });
        }
        
        // Check if reference number already exists
        const [existingPayments] = await db.execute(
            'SELECT * FROM payment_intents WHERE gcash_reference = ?',
            [gcashReference.trim()]
        );
        
        if (existingPayments.length > 0) {
            return res.status(400).json({ message: 'This GCash reference number has already been used' });
        }
        
        // Generate a temporary payment reference for downpayment
        const tempReference = `downpay_${Date.now()}_${userId}`;
        
        // Store payment info in database with order data for later use
        const downpaymentData = {
            items, 
            discountId, 
            packagingPreference, 
            paymentMethod, 
            totalAmount, 
            remainingAmount, 
            downpaymentAmount,
            type: 'downpayment'
        };
        
        await db.execute(
            `INSERT INTO payment_intents (
                reference_number,
                gcash_reference,
                amount, 
                status,
                order_data,
                user_id,
                payment_type,
                total_amount,
                remaining_amount,
                created_at
            ) VALUES (?, ?, ?, 'pending_verification', ?, ?, 'downpayment', ?, ?, NOW())`,
            [
                tempReference,
                gcashReference.trim(),
                downpaymentAmount,
                JSON.stringify(downpaymentData),
                userId,
                totalAmount,
                remainingAmount
            ]
        );
        
        res.json({
            paymentId: tempReference,
            referenceNumber: tempReference,
            gcashReference: gcashReference.trim(),
            amount: downpaymentAmount,
            downpaymentAmount,
            remainingAmount,
            status: 'pending_verification',
            message: 'GCash payment submitted for verification. Please wait for admin confirmation.'
        });
        
    } catch (error) {
        console.error('Error creating downpayment:', error);
        res.status(500).json({ message: 'Failed to create downpayment' });
    }
};

exports.checkDownpaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        const [payments] = await db.execute(
            'SELECT * FROM payment_intents WHERE reference_number = ? AND payment_type = "downpayment" ORDER BY created_at DESC LIMIT 1',
            [paymentId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({ message: 'Downpayment not found' });
        }
        
        res.json(payments[0]);
        
    } catch (error) {
        console.error('Error checking downpayment status:', error);
        res.status(500).json({ message: 'Failed to check downpayment status' });
    }
};

exports.createGCashPaymentOnly = async (req, res) => {
    try {
        const { amount, items, discountId, packagingPreference, paymentMethod, gcashReference } = req.body;
        const userId = req.user.id;
        
        // Validate required fields
        if (!gcashReference || gcashReference.trim() === '') {
            return res.status(400).json({ message: 'GCash reference number is required' });
        }
        
        // Check if reference number already exists
        const [existingPayments] = await db.execute(
            'SELECT * FROM payment_intents WHERE gcash_reference = ?',
            [gcashReference.trim()]
        );
        
        if (existingPayments.length > 0) {
            return res.status(400).json({ message: 'This GCash reference number has already been used' });
        }
        
        // Generate a temporary payment reference
        const tempReference = `temp_${Date.now()}_${userId}`;
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // Apply discount if provided
            const Reward = require('../models/rewardModel');
            let finalAmount = amount;
            let appliedDiscount = 0;
            if (discountId) {
                try {
                    appliedDiscount = await Reward.applyDiscount(userId, null, discountId);
                    finalAmount = Math.max(0, finalAmount - appliedDiscount);
                } catch (error) {
                    console.error('Error applying discount:', error);
                }
            }
            
            // Create order immediately with "to verify" status for GCash payments
            const Order = require('../models/orderModel');
            
            // Use the same connection for order creation to avoid nested transactions
            const orderId = await createOrderWithConnection(
                connection,
                userId, 
                items, 
                finalAmount, 
                packagingPreference, 
                paymentMethod, 
                'to verify', // Set to 'to verify' for GCash payments
                tempReference
            );
            
            // Store payment info in database with order ID
            await connection.execute(
                `INSERT INTO payment_intents (
                    order_id,
                    reference_number,
                    gcash_reference,
                    amount, 
                    status,
                    order_data,
                    user_id,
                    payment_type,
                    total_amount,
                    verification_method,
                    created_at
                ) VALUES (?, ?, ?, ?, 'pending_verification', ?, ?, 'full_payment', ?, 'reference', NOW())`,
                [
                    orderId,
                    tempReference,
                    gcashReference.trim(),
                    finalAmount,
                    JSON.stringify({ 
                        items, 
                        discountId, 
                        packagingPreference, 
                        paymentMethod,
                        verificationMethod: 'reference'
                    }),
                    userId,
                    finalAmount
                ]
            );
            
            // Create notification for the user
            const Notification = require('../models/notificationModel');
            try {
                await Notification.create({
                    customId: `order-${orderId}-pending`,
                    userId: userId,
                    title: 'Order Update',
                    message: `Order #${orderId} has been placed and is pending.`,
                    type: 'order',
                    icon: 'fas fa-hourglass-half',
                    relatedOrderId: orderId,
                    actionUrl: `/order-details/${orderId}`
                });
            } catch (error) {
                console.error('Error creating notification:', error);
            }
            
            await connection.commit();
            
            res.json({
                orderId: orderId,
                paymentId: tempReference,
                referenceNumber: tempReference,
                gcashReference: gcashReference.trim(),
                amount: finalAmount,
                status: 'pending_verification',
                message: 'Order created and GCash payment submitted for verification. Your order is now visible in track orders.'
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error creating GCash payment:', error);
        res.status(500).json({ message: 'Failed to create GCash payment' });
    }
};

// Create GCash payment with receipt upload
exports.createGCashPaymentWithReceipt = async (req, res) => {
    try {
        console.log('📥 Received GCash payment with receipt request');
        console.log('📥 Request body:', req.body);
        console.log('📥 Request file:', req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'No file');
        console.log('📥 User:', req.user ? { id: req.user.id } : 'No user');
        
        const { amount, items, discountId, packagingPreference, paymentMethod, gcashVerificationMethod } = req.body;
        const userId = req.user.id;
        
        // Validate required fields
        if (!amount) {
            return res.status(400).json({ message: 'Amount is required' });
        }
        
        if (!items) {
            return res.status(400).json({ message: 'Items are required' });
        }
        
        if (!paymentMethod) {
            return res.status(400).json({ message: 'Payment method is required' });
        }
        
        if (!gcashVerificationMethod) {
            return res.status(400).json({ message: 'GCash verification method is required' });
        }
        
        // Parse items if it's a string (from FormData)
        let parsedItems;
        try {
            parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
        } catch (error) {
            console.error('📥 Error parsing items:', error);
            return res.status(400).json({ message: 'Invalid items format: ' + error.message });
        }
        
        // Validate parsed items
        if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
            return res.status(400).json({ message: 'Items must be a non-empty array' });
        }
        
        // Validate amount is a valid number
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Amount must be a valid positive number' });
        }
        
        // Validate receipt file
        if (!req.file) {
            return res.status(400).json({ message: 'GCash receipt screenshot is required' });
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Invalid file type. Please upload an image file (JPG, PNG, GIF)' });
        }
        
        // Validate file size (10MB limit to match multer config)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (req.file.size > maxSize) {
            return res.status(400).json({ message: 'File size too large. Maximum size is 10MB' });
        }
        
        // Generate a temporary payment reference
        const tempReference = `temp_${Date.now()}_${userId}`;
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // Apply discount if provided
            let finalAmount = amount;
            let appliedDiscount = 0;
            
            if (discountId) {
                try {
                    const Reward = require('../models/rewardModel');
                    appliedDiscount = await Reward.applyDiscount(userId, null, discountId);
                    finalAmount = Math.max(0, amount - appliedDiscount);
                } catch (error) {
                    console.error('Error applying discount:', error);
                }
            }
            
            // Create order
            const Order = require('../models/orderModel');
            const orderId = await Order.create(
                userId, 
                parsedItems, 
                finalAmount, 
                packagingPreference, 
                paymentMethod, 
                'to verify' // Set to 'to verify' for GCash payments
            );
            
            // Store payment info in database with order ID and receipt info
            // Use the actual filename that multer generated and saved
            const receiptFileName = req.file.filename; // This is the actual saved filename
            const receiptPath = req.file.path; // This is the full path where the file was saved
            
            // Read the image file data to store in database
            let imageBuffer;
            try {
                imageBuffer = fs.readFileSync(receiptPath);
                console.log('📥 Successfully read receipt file:', receiptPath, imageBuffer.length, 'bytes');
            } catch (fileError) {
                console.error('📥 Error reading receipt file:', fileError);
                return res.status(400).json({ message: 'Error processing uploaded receipt file' });
            }
            
            await connection.execute(
                `INSERT INTO payment_intents (
                    order_id,
                    reference_number,
                    amount, 
                    status,
                    order_data,
                    user_id,
                    payment_type,
                    total_amount,
                    gcash_reference,
                    receipt_image,
                    receipt_filename,
                    receipt_mimetype,
                    receipt_filesize,
                    verification_method,
                    created_at
                ) VALUES (?, ?, ?, 'pending_verification', ?, ?, 'full_payment', ?, ?, ?, ?, ?, ?, 'receipt', NOW())`,
                [
                    orderId,
                    tempReference,
                    finalAmount,
                    JSON.stringify({ 
                        items: parsedItems, 
                        discountId, 
                        packagingPreference, 
                        paymentMethod,
                        verificationMethod: 'receipt',
                        receiptFileName: receiptFileName,
                        receiptPath: receiptPath,
                        originalFileName: req.file.originalname,
                        fileSize: req.file.size,
                        mimeType: req.file.mimetype
                    }),
                    userId,
                    finalAmount,
                    receiptFileName, // Store as gcash_reference for backward compatibility
                    imageBuffer, // Store the actual image data
                    req.file.originalname, // Store original filename
                    req.file.mimetype, // Store MIME type
                    req.file.size // Store file size
                ]
            );
            
            // Create notification for the user
            const Notification = require('../models/notificationModel');
            try {
                await Notification.create({
                    customId: `order-${orderId}-pending`,
                    userId: userId,
                    title: 'Order Update',
                    message: `Order #${orderId} has been placed and is pending.`,
                    type: 'order',
                    icon: 'fas fa-hourglass-half',
                    relatedOrderId: orderId,
                    actionUrl: `/order-details/${orderId}`
                });
            } catch (error) {
                console.error('Error creating notification:', error);
            }
            
            await connection.commit();
            
            res.json({
                orderId: orderId,
                paymentId: tempReference,
                referenceNumber: tempReference,
                amount: finalAmount,
                status: 'pending_verification',
                message: 'Order created and GCash receipt submitted for verification. Your order is now visible in track orders.'
            });
            
        } catch (error) {
            await connection.rollback();
            
            // Clean up uploaded file if transaction fails
            if (req.file && req.file.path) {
                cleanupUploadedFile(req.file.path);
            }
            
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error creating GCash payment with receipt:', error);
        res.status(500).json({ message: 'Failed to create GCash payment with receipt' });
    }
};

exports.createGCashPayment = async (req, res) => {
    try {
        const { orderId, amount, gcashReference } = req.body;
        const userId = req.user.id;
        
        // Validate required fields
        if (!gcashReference || gcashReference.trim() === '') {
            return res.status(400).json({ message: 'GCash reference number is required' });
        }
        
        // Check if reference number already exists
        const [existingPayments] = await db.execute(
            'SELECT * FROM payment_intents WHERE gcash_reference = ?',
            [gcashReference.trim()]
        );
        
        if (existingPayments.length > 0) {
            return res.status(400).json({ message: 'This GCash reference number has already been used' });
        }
        
        // Verify order belongs to user and is pending
        const [orders] = await db.execute(
            'SELECT * FROM orders WHERE order_id = ? AND user_id = ? AND status = "pending"',
            [orderId, userId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found or already processed' });
        }
        
        // Store comprehensive payment info in database
        await db.execute(
            `INSERT INTO payment_intents (
                order_id,
                reference_number,
                gcash_reference,
                amount, 
                status, 
                user_id,
                payment_type,
                created_at
            ) VALUES (?, ?, ?, ?, 'pending_verification', ?, 'full_payment', NOW())`,
            [
                orderId,
                orderId,
                gcashReference.trim(),
                amount,
                userId
            ]
        );
        
        res.json({
            orderId: orderId,
            referenceNumber: orderId,
            gcashReference: gcashReference.trim(),
            amount: amount,
            status: 'pending_verification',
            message: 'GCash payment submitted for verification. Please wait for admin confirmation.'
        });
        
    } catch (error) {
        console.error('Error creating GCash payment:', error);
        res.status(500).json({ message: 'Failed to create GCash payment' });
    }
};

// Check payment status by payment ID
exports.checkPaymentStatusByPaymentId = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        const [payments] = await db.execute(
            'SELECT * FROM payment_intents WHERE reference_number = ? ORDER BY created_at DESC LIMIT 1',
            [paymentId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        res.json(payments[0]);
        
    } catch (error) {
        console.error('Error checking payment status by payment ID:', error);
        res.status(500).json({ message: 'Failed to check payment status' });
    }
};

// Check payment status by order ID
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const [payments] = await db.execute(
            'SELECT * FROM payment_intents WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
            [orderId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        res.json(payments[0]);
        
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ message: 'Failed to check payment status' });
    }
};

// Admin function to verify GCash payment
exports.verifyGCashPayment = async (req, res) => {
    try {
        const { paymentId, isValid } = req.body;
        
        // Get payment details
        const [payments] = await db.execute(
            'SELECT * FROM payment_intents WHERE id = ? OR reference_number = ?',
            [paymentId, paymentId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        const payment = payments[0];
        const newStatus = isValid ? 'succeeded' : 'failed';
        
        // Update payment status
        await db.execute(
            'UPDATE payment_intents SET status = ?, verified_at = NOW() WHERE id = ?',
            [newStatus, payment.id]
        );
        
        if (isValid) {
            // If payment is valid, update the existing order to paid status
            if (payment.order_id) {
                // Update existing order status to paid
                await db.execute(
                    'UPDATE orders SET status = "paid", paid_at = NOW() WHERE order_id = ?',
                    [payment.order_id]
                );
                
                // Create notification for payment verification
                const Notification = require('../models/notificationModel');
                try {
                    await Notification.create({
                        customId: `order-${payment.order_id}-paid`,
                        userId: payment.user_id,
                        title: 'Order Update',
                        message: `Order #${payment.order_id} has been paid and completed.`,
                        type: 'order',
                        icon: 'fas fa-money-bill-wave',
                        relatedOrderId: payment.order_id,
                        actionUrl: `/order-details/${payment.order_id}`
                    });
                } catch (error) {
                    console.error('Error creating notification:', error);
                }
            } else {
                // Fallback: create new order from payment data if no order exists
                const orderId = await createOrderFromPayment(payment.user_id, JSON.parse(payment.order_data), payment.amount, payment.id, payment.reference_number);
                
                // Update payment with order ID
                await db.execute(
                    'UPDATE payment_intents SET order_id = ? WHERE id = ?',
                    [orderId, payment.id]
                );
            }
        } else {
            // If payment is invalid, update order status to cancelled
            if (payment.order_id) {
                await db.execute(
                    'UPDATE orders SET status = "cancelled", cancel_reason = "Payment verification failed" WHERE order_id = ?',
                    [payment.order_id]
                );
                
                // Create notification for failed verification
                const Notification = require('../models/notificationModel');
                try {
                    await Notification.create({
                        customId: `order-${payment.order_id}-cancelled`,
                        userId: payment.user_id,
                        title: 'Order Update',
                        message: `Order #${payment.order_id} has been cancelled due to payment verification failure.`,
                        type: 'order',
                        icon: 'fas fa-times-circle',
                        relatedOrderId: payment.order_id,
                        actionUrl: `/order-details/${payment.order_id}`
                    });
                } catch (error) {
                    console.error('Error creating notification:', error);
                }
            }
        }
        
        res.json({
            message: isValid ? 'Payment verified successfully' : 'Payment marked as invalid',
            status: newStatus
        });
        
    } catch (error) {
        console.error('Error verifying GCash payment:', error);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
};

// Get all pending payments for admin verification
exports.getPendingPayments = async (req, res) => {
    try {
        const [payments] = await db.execute(`
            SELECT pi.*, u.first_name, u.last_name, u.email 
            FROM payment_intents pi 
            JOIN users u ON pi.user_id = u.user_id 
            WHERE pi.status = 'pending_verification' 
            ORDER BY pi.created_at DESC
        `);
        
        res.json(payments);
        
    } catch (error) {
        console.error('Error getting pending payments:', error);
        res.status(500).json({ message: 'Failed to get pending payments' });
    }
};

// Helper function to create order from payment data
async function createOrderFromPayment(userId, orderData, amount, paymentId, paymentIntentId) {
    const Order = require('../models/orderModel');
    const Reward = require('../models/rewardModel');
    const Notification = require('../models/notificationModel');
    
    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        const { items, discountId, packagingPreference, paymentMethod } = orderData;
        
        let finalAmount = amount;
        let appliedDiscount = 0;

        // Apply discount if provided
        if (discountId) {
            try {
                appliedDiscount = await Reward.applyDiscount(userId, null, discountId);
                finalAmount = Math.max(0, finalAmount - appliedDiscount);
            } catch (error) {
                console.error('Error applying discount:', error);
            }
        }
        
        // Create order with "to verify" status for GCash payments requiring verification
        const orderId = await Order.createWithPaymentIntent(userId, items, finalAmount, packagingPreference, paymentMethod, 'to verify', paymentIntentId);
        
        // Add reward points
        try {
            await Reward.addPoints(userId, orderId, finalAmount);
        } catch (error) {
            console.error('Error adding reward points:', error);
        }
        
        // Create notification for the user
        try {
            await Notification.create({
                customId: `order-${orderId}-paid`,
                userId: userId,
                title: 'Order Update',
                message: `Order #${orderId} has been paid and completed.`,
                type: 'order',
                icon: 'fas fa-money-bill-wave',
                relatedOrderId: orderId,
                actionUrl: `/order-details/${orderId}`
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
        
        await connection.commit();
        connection.release();
        
        return orderId;
    } catch (error) {
        console.error('Error creating order from payment:', error);
        throw error;
    }
}

// Helper function to create order with existing connection
async function createOrderWithConnection(connection, userId, items, totalAmount, packagingPreference = 'eco', paymentMethod = 'cash', status = 'pending', paymentIntentId = null) {
    const orderId = Math.random().toString().slice(2, 9);

    // Validate inputs
    const validPackaging = ['eco', 'plastic'].includes(packagingPreference) ? packagingPreference : 'eco';
    const validPaymentMethod = ['cash', 'gcash', 'hatid'].includes(paymentMethod) ? paymentMethod : 'cash';
    const validStatus = status || 'pending';

    // Check stock for all items first
    for (const item of items) {
        if (item.choice_id) {
            const [choiceRows] = await connection.execute(
                'SELECT stock FROM product_choices WHERE choice_id = ? FOR UPDATE',
                [item.choice_id]
            );
            if (!choiceRows[0] || choiceRows[0].stock < item.quantity) {
                throw new Error(`Not enough stock for product variant with choice ID ${item.choice_id}`);
            }
        } else {
            const [productRows] = await connection.execute(
                'SELECT stock_quantity FROM products WHERE products_id = ? FOR UPDATE',
                [item.product_id]
            );
            if (!productRows[0] || productRows[0].stock_quantity < item.quantity) {
                throw new Error(`Not enough stock for product ID ${item.product_id}`);
            }
        }
    }
    
    // Create order
    await connection.execute(
        'INSERT INTO orders (order_id, user_id, total_amount, packaging_preference, payment_method, status, payment_intent_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [orderId, userId, totalAmount, validPackaging, validPaymentMethod, validStatus, paymentIntentId]
    );

    // Process each item
    for (const item of items) {
        // Insert order item
        await connection.execute(
            'INSERT INTO order_items (order_id, product_id, quantity, price, choice_id) VALUES (?, ?, ?, ?, ?)',
            [orderId, item.product_id, item.quantity, item.price, item.choice_id || null]
        );

        // Update stock
        if (item.choice_id) {
            await connection.execute(
                'UPDATE product_choices SET stock = stock - ? WHERE choice_id = ?',
                [item.quantity, item.choice_id]
            );
        } else {
            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE products_id = ?',
                [item.quantity, item.product_id]
            );
        }
    }

    // Clear cart items that were ordered
    const itemIds = items.map(item => item.id).filter(id => id);
    if (itemIds.length > 0) {
        for (const id of itemIds) {
            await connection.execute(
                'DELETE FROM cart WHERE id = ? AND user_id = ?',
                [id, userId]
            );
        }
    }

    return orderId;
}