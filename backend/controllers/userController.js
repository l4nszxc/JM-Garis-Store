const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const otpGenerator = require('otp-generator');
const emailService = require('../services/emailService.js');
const { uploadToImgBB } = require('../services/imgbbService');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});


exports.register = async (req, res) => {
    try {
        const { 
            username, 
            firstname, 
            middlename, 
            lastname, 
            gender, 
            civilStatus, 
            phoneNumber, 
            address, 
            birthdate,
            email, 
            password 
        } = req.body;

        // Validation - only check required fields
        if (!username || !firstname || !lastname || 
            !phoneNumber || !address || !email || !password) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create user
        await User.create(
            username, 
            firstname, 
            middlename || null, 
            lastname, 
            gender || null,     // Use null if gender is not provided
            civilStatus || null, // Use null if civilStatus is not provided
            phoneNumber, 
            address, 
            birthdate || null,  // Use null if birthdate is not provided
            email, 
            password
        );
  
        // Generate OTP
        const otp = otpGenerator.generate(6, { 
            digits: true, 
            alphabets: false, 
            upperCase: false, 
            specialChars: false 
        });
  
        // Save OTP
        await User.updateOTP(email, otp);
  
        // Send OTP email
        await emailService.sendOTP(email, otp);
  
        res.status(201).json({ 
            message: 'Registration successful. Please check your email for OTP verification.',
            email
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
  };
exports.verifyOTP = async (req, res) => {
  try {
      const { email, otp } = req.body;

      // Check if the OTP is valid
      const user = await User.verifyOTP(email, otp);
      if (!user) {
          return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      // Mark email as verified
      await User.markEmailAsVerified(email);

      res.status(200).json({ 
          message: 'Email verified successfully',
          success: true
      });
  } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ 
          message: 'Error verifying OTP',
          success: false
      });
  }
};
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email); // Changed from findOne to findByEmail

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is verified
        if (!user.email_verified) { // Changed from isVerified to email_verified to match DB column
            return res.status(401).json({
                needsVerification: true,
                validCredentials: true,
                email: user.email,
                message: 'Account not verified'
            });
        }

        // If user is verified and password is correct, create token and proceed with login
        const token = jwt.sign(
            { 
                userId: user.id,
                role: user.role,
                username: user.username 
            },
            'your-secret-key', // Consider moving this to environment variables
            { expiresIn: '24h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
};
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Generate new OTP
        const otp = otpGenerator.generate(6, { 
            digits: true, 
            alphabets: false, 
            upperCase: false, 
            specialChars: false 
        });

        // Save new OTP
        await User.updateOTP(email, otp);

        // Send OTP email
        await emailService.sendOTP(email, otp);

        res.status(200).json({ 
            message: 'OTP resent successfully',
            email
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Error resending OTP' });
    }
};

exports.logout = async (req, res) => {
    try {
        // Clear session
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
        });

        // Clear cookie
        res.clearCookie('connect.sid');
        
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Error logging out' });
    }
};
exports.getUsername = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, 'your-secret-key');
        
        // Return the username directly from the token since we store it there
        res.json({
            username: decoded.username
        });

    } catch (error) {
        console.error(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, { 
            digits: true, 
            alphabets: false, 
            upperCase: false, 
            specialChars: false 
        });

        // Save OTP
        await User.updatePasswordResetOTP(email, otp);

        // Send OTP email
        await emailService.sendPasswordResetOTP(email, otp);

        res.status(200).json({ 
            message: 'Password reset OTP sent successfully',
            email
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error processing request' });
    }
};

exports.verifyPasswordReset = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Check if the OTP is valid
        const user = await User.verifyPasswordResetOTP(email, otp);
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.status(200).json({ 
            message: 'OTP verified successfully',
            email
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Error verifying OTP' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Reset password
        await User.resetPassword(email, password);

        res.status(200).json({ 
            message: 'Password reset successfully' 
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
};
exports.getProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, 'your-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove sensitive information
        delete user.password;
        delete user.otp;
        delete user.otp_expires;
        delete user.password_reset_otp;
        delete user.password_reset_otp_expires;

        res.json(user);
    } catch (error) {
        console.error(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, 'your-secret-key');
        const userId = decoded.userId;

        const {
            username,
            firstname,
            middlename,
            lastname,
            gender,
            civil_status,
            phone_number,
            address,
            birthdate
        } = req.body;

        await User.updateProfile(userId, {
            username,
            firstname,
            middlename,
            lastname,
            gender,
            civil_status,
            phone_number,
            address,
            birthdate
        });

        // Generate new token with updated username
        const newToken = jwt.sign(
            { 
                userId: userId,
                role: decoded.role,
                username: username
            },
            'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(200).json({ 
            message: 'Profile updated successfully',
            token: newToken
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};
exports.uploadMiddleware = upload.single('profilePicture');

exports.uploadProfilePicture = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, 'your-secret-key');
        const userId = decoded.userId;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload to ImgBB
        const imageUrl = await uploadToImgBB(req.file.buffer);
        
        // Update user profile with ImgBB URL
        await User.updateProfilePicture(userId, imageUrl);

        res.status(200).json({ 
            message: 'Profile picture updated successfully',
            imageUrl
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ message: 'Error uploading profile picture' });
    }
};
exports.removeProfilePicture = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, 'your-secret-key');
        const userId = decoded.userId;

        // Update the user's profile to remove the profile picture
        await User.updateProfilePicture(userId, null);

        res.status(200).json({ 
            message: 'Profile picture removed successfully'
        });
    } catch (error) {
        console.error('Profile picture removal error:', error);
        res.status(500).json({ message: 'Error removing profile picture' });
    }
};
exports.getUsernameById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate id
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        // Find user by ID
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return just the username
        res.json({
            username: user.username
        });
    } catch (error) {
        console.error('Error getting username by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
};