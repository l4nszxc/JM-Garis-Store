const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'gcash-receipts');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for receipt uploads with disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: receipt_timestamp_userid_originalname
        const userId = req.user ? req.user.id : 'unknown';
        const timestamp = Date.now();
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `receipt_${timestamp}_${userId}_${sanitizedOriginalName}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit (increased from 5MB)
        fieldSize: 10 * 1024 * 1024 // 10MB field size limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: 'File too large',
                message: 'File size must be less than 10MB',
                code: 'FILE_TOO_LARGE'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Invalid file field',
                message: 'Unexpected file field',
                code: 'INVALID_FILE_FIELD'
            });
        }
        return res.status(400).json({
            error: 'File upload error',
            message: err.message,
            code: err.code
        });
    }
    if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({
            error: 'Invalid file type',
            message: 'Only image files (JPG, PNG, GIF, etc.) are allowed',
            code: 'INVALID_FILE_TYPE'
        });
    }
    next(err);
};

// User payment routes
router.post('/gcash/create-payment-only', authenticate, paymentController.createGCashPaymentOnly);
router.post('/gcash/create-payment-with-receipt', authenticate, upload.single('gcashReceipt'), handleMulterError, paymentController.createGCashPaymentWithReceipt);
router.post('/gcash/create', authenticate, paymentController.createGCashPayment);
router.post('/gcash/create-downpayment', authenticate, paymentController.createGCashDownpayment);
router.get('/status/:orderId', authenticate, paymentController.checkPaymentStatus);
router.get('/status-by-payment-id/:paymentId', authenticate, paymentController.checkPaymentStatusByPaymentId);
router.get('/downpayment-status/:paymentId', authenticate, paymentController.checkDownpaymentStatus);

// Admin payment verification routes
router.get('/admin/pending', authenticate, paymentController.getPendingPayments);
router.post('/admin/verify', authenticate, paymentController.verifyGCashPayment);

// Admin route to get all receipts with images (for verification dashboard)
router.get('/admin/receipts', authenticate, async (req, res) => {
    try {
        const [rows] = await require('../config/db').execute(
            `SELECT 
                pi.id,
                pi.order_id,
                pi.amount,
                pi.status,
                pi.receipt_filename,
                pi.receipt_mimetype,
                pi.receipt_filesize,
                ROUND(pi.receipt_filesize / 1024, 2) as size_kb,
                u.first_name,
                u.last_name,
                u.email,
                pi.created_at,
                CASE 
                    WHEN pi.receipt_image IS NOT NULL THEN true
                    ELSE false
                END as has_image
            FROM payment_intents pi
            LEFT JOIN users u ON pi.user_id = u.user_id
            WHERE pi.verification_method = 'receipt'
            ORDER BY pi.created_at DESC
            LIMIT 50`
        );
        
        res.json(rows);
        
    } catch (error) {
        console.error('Error fetching receipt data:', error);
        res.status(500).json({ message: 'Error fetching receipt data' });
    }
});

// Route to serve receipt images from file system (for admin verification)
router.get('/receipt/:filename', authenticate, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ message: 'Invalid filename' });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Receipt image not found' });
    }
    
    // Serve the image
    res.sendFile(filePath);
});

// Route to serve receipt images from database (for admin verification)
router.get('/receipt-db/:paymentId', authenticate, async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        console.log(`Attempting to serve receipt image for payment ID: ${paymentId}`);
        
        // Fetch the receipt image from database
        const [rows] = await require('../config/db').execute(
            'SELECT receipt_image, receipt_filename, receipt_mimetype, receipt_filesize FROM payment_intents WHERE id = ? OR reference_number = ?',
            [paymentId, paymentId]
        );
        
        console.log(`Found ${rows.length} rows for payment ID ${paymentId}`);
        
        if (rows.length === 0) {
            console.log(`No payment intent found for ID: ${paymentId}`);
            return res.status(404).json({ 
                message: 'Payment intent not found',
                paymentId: paymentId
            });
        }
        
        const { receipt_image, receipt_filename, receipt_mimetype, receipt_filesize } = rows[0];
        
        console.log(`Receipt data: filename=${receipt_filename}, mimetype=${receipt_mimetype}, size=${receipt_filesize}, has_image=${!!receipt_image}`);
        
        if (!receipt_image) {
            console.log(`No receipt image data for payment ID: ${paymentId}`);
            return res.status(404).json({ 
                message: 'Receipt image not found - no image data in database',
                paymentId: paymentId,
                hasFilename: !!receipt_filename
            });
        }
        
        // Set appropriate headers
        res.set({
            'Content-Type': receipt_mimetype || 'image/jpeg',
            'Content-Disposition': `inline; filename="${receipt_filename || 'receipt.jpg'}"`
        });
        
        // Send the image buffer
        res.send(receipt_image);
        
    } catch (error) {
        console.error('Error serving receipt image from database:', error);
        res.status(500).json({ message: 'Error retrieving receipt image', error: error.message });
    }
});

// Route to get receipt metadata (for admin verification listing)
router.get('/receipt-info/:paymentId', authenticate, async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        // Fetch the receipt metadata from database
        const [rows] = await require('../config/db').execute(
            `SELECT 
                id,
                order_id,
                amount,
                status,
                verification_method,
                receipt_filename,
                receipt_mimetype,
                receipt_filesize,
                gcash_reference,
                created_at,
                CASE 
                    WHEN receipt_image IS NOT NULL THEN true
                    ELSE false
                END as has_receipt_image
            FROM payment_intents 
            WHERE id = ? OR reference_number = ?`,
            [paymentId, paymentId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        res.json(rows[0]);
        
    } catch (error) {
        console.error('Error getting receipt info:', error);
        res.status(500).json({ message: 'Error retrieving receipt information' });
    }
});

// Admin route to get payment intent by order ID
router.get('/admin/payment-intent/:orderId', authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        console.log(`Fetching payment intent for order: ${orderId}`);
        
        // Fetch the payment intent for the specific order
        const [rows] = await require('../config/db').execute(
            `SELECT 
                pi.id,
                pi.order_id,
                pi.user_id,
                pi.amount,
                pi.status,
                pi.verification_method,
                pi.gcash_reference,
                pi.receipt_filename,
                pi.receipt_mimetype,
                pi.receipt_filesize,
                pi.created_at,
                pi.updated_at,
                CASE 
                    WHEN pi.receipt_image IS NOT NULL THEN 
                        CONCAT('http://localhost:7904/api/payment/receipt-db/', pi.id)
                    ELSE NULL
                END as receipt_image,
                CASE 
                    WHEN pi.receipt_image IS NOT NULL THEN true
                    ELSE false
                END as has_receipt_data
            FROM payment_intents pi
            WHERE pi.order_id = ? AND pi.status IN ('pending', 'pending_verification')
            ORDER BY pi.created_at DESC
            LIMIT 1`,
            [orderId]
        );
        
        console.log(`Found ${rows.length} payment intents for order ${orderId}`);
        
        if (rows.length > 0) {
            console.log(`Payment intent data:`, {
                id: rows[0].id,
                verification_method: rows[0].verification_method,
                has_receipt_data: rows[0].has_receipt_data,
                receipt_filename: rows[0].receipt_filename,
                receipt_image_url: rows[0].receipt_image
            });
        }
        
        if (rows.length === 0) {
            // Check if the order exists at all
            const [orderCheck] = await require('../config/db').execute(
                'SELECT order_id, status FROM orders WHERE order_id = ?',
                [orderId]
            );
            
            if (orderCheck.length === 0) {
                return res.status(404).json({ 
                    message: `Order ${orderId} not found`,
                    code: 'ORDER_NOT_FOUND'
                });
            } else {
                return res.status(404).json({ 
                    message: `No payment intent found for order ${orderId}. Order status: ${orderCheck[0].status}`,
                    code: 'PAYMENT_INTENT_NOT_FOUND',
                    orderStatus: orderCheck[0].status
                });
            }
        }
        
        res.json(rows[0]);
        
    } catch (error) {
        console.error('Error fetching payment intent:', error);
        res.status(500).json({ message: 'Error fetching payment intent' });
    }
});

// Admin route to verify payment and update order status
router.post('/admin/verify/:paymentId', authenticate, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { orderId, action } = req.body;
        
        console.log(`Verifying payment: paymentId=${paymentId}, orderId=${orderId}, action=${action}`);
        
        if (action !== 'verify') {
            return res.status(400).json({ message: 'Invalid action' });
        }
        
        const db = require('../config/db');
        
        // Check current payment intent status first
        const [currentPayment] = await db.execute(
            'SELECT id, status, order_id FROM payment_intents WHERE id = ?',
            [paymentId]
        );
        
        if (currentPayment.length === 0) {
            return res.status(404).json({ message: 'Payment intent not found' });
        }
        
        console.log(`Current payment intent:`, currentPayment[0]);
        
        // Check current order status
        const [currentOrder] = await db.execute(
            'SELECT order_id, status FROM orders WHERE order_id = ?',
            [orderId]
        );
        
        if (currentOrder.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        console.log(`Current order:`, currentOrder[0]);
        
        // Start transaction
        await db.query('START TRANSACTION');
        
        try {
            // Update payment intent status to verified
            const [updatePayment] = await db.execute(
                'UPDATE payment_intents SET status = ?, updated_at = NOW() WHERE id = ? AND status IN (?, ?)',
                ['verified', paymentId, 'pending', 'pending_verification']
            );
            
            console.log(`Payment update result: ${updatePayment.affectedRows} rows affected`);
            
            if (updatePayment.affectedRows === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ 
                    message: 'Payment intent not found or already verified',
                    currentStatus: currentPayment[0].status
                });
            }
            
            // Update order status from 'to verify' to 'pending'
            const [updateOrder] = await db.execute(
                'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ? AND status = ?',
                ['pending', orderId, 'to verify']
            );
            
            console.log(`Order update result: ${updateOrder.affectedRows} rows affected`);
            
            if (updateOrder.affectedRows === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ 
                    message: 'Order not found or status already changed',
                    currentStatus: currentOrder[0].status
                });
            }
            
            // Commit transaction
            await db.query('COMMIT');
            
            res.json({ 
                message: 'Payment verified successfully',
                paymentId: paymentId,
                orderId: orderId,
                newStatus: 'pending'
            });
            
        } catch (transactionError) {
            await db.query('ROLLBACK');
            throw transactionError;
        }
        
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ 
            message: 'Error verifying payment', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Test endpoint to update a payment intent with receipt image (for testing)
router.post('/admin/test-receipt/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const db = require('../config/db');
        
        console.log(`Adding test receipt to payment intent ${paymentId}`);
        
        // Read the existing receipt file
        const fs = require('fs');
        const receiptPath = path.join(__dirname, '..', 'uploads', 'gcash-receipts', 'receipt_1760563104840_1014_1.jpg');
        
        if (!fs.existsSync(receiptPath)) {
            console.log(`Test receipt file not found at: ${receiptPath}`);
            return res.status(404).json({ message: 'Test receipt file not found' });
        }
        
        const receiptBuffer = fs.readFileSync(receiptPath);
        console.log(`Read receipt file: ${receiptBuffer.length} bytes`);
        
        // Update the payment intent with receipt data
        const [updateResult] = await db.execute(
            `UPDATE payment_intents 
             SET verification_method = 'receipt',
                 receipt_image = ?,
                 receipt_filename = 'test_receipt.jpg',
                 receipt_mimetype = 'image/jpeg',
                 receipt_filesize = ?
             WHERE id = ?`,
            [receiptBuffer, receiptBuffer.length, paymentId]
        );
        
        console.log(`Update result: ${updateResult.affectedRows} rows affected`);
        
        res.json({ 
            message: 'Payment intent updated with test receipt',
            paymentId: paymentId,
            receiptSize: receiptBuffer.length,
            affectedRows: updateResult.affectedRows
        });
        
    } catch (error) {
        console.error('Error updating payment intent with test receipt:', error);
        res.status(500).json({ message: 'Error updating payment intent', error: error.message });
    }
});

module.exports = router;