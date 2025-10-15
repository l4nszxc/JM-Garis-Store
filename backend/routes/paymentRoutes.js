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
        
        // Fetch the receipt image from database
        const [rows] = await require('../config/db').execute(
            'SELECT receipt_image, receipt_filename, receipt_mimetype FROM payment_intents WHERE id = ? OR reference_number = ?',
            [paymentId, paymentId]
        );
        
        if (rows.length === 0 || !rows[0].receipt_image) {
            return res.status(404).json({ message: 'Receipt image not found' });
        }
        
        const { receipt_image, receipt_filename, receipt_mimetype } = rows[0];
        
        // Set appropriate headers
        res.set({
            'Content-Type': receipt_mimetype || 'image/jpeg',
            'Content-Disposition': `inline; filename="${receipt_filename || 'receipt.jpg'}"`
        });
        
        // Send the image buffer
        res.send(receipt_image);
        
    } catch (error) {
        console.error('Error serving receipt image from database:', error);
        res.status(500).json({ message: 'Error retrieving receipt image' });
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

module.exports = router;