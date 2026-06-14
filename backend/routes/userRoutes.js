const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
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

// Public routes (no authentication required)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/verify-otp', userController.verifyOTP);
router.post('/resend-otp', userController.resendOTP);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-password-reset', userController.verifyPasswordReset);
router.post('/reset-password', userController.resetPassword);

// Protected routes (require authentication)
router.use(authenticate);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/getUsername', userController.getUsername);
router.get('/getUsernameById/:userId', userController.getUsernameById); 
router.put('/change-password', userController.changePassword);

// Profile picture routes
router.post('/upload-profile-picture', 
    upload.single('profilePicture'), 
    userController.uploadProfilePicture
);
router.delete('/remove-profile-picture', userController.removeProfilePicture);

// Logout route (requires authentication)
router.post('/logout', userController.logout);
router.get('/username/:userId', userController.getUsernameById);

module.exports = router;