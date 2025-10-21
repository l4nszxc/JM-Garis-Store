const db = require('../config/db');

// Initialize payment settings table if it doesn't exist
const initializePaymentSettingsTable = async () => {
    try {
        // Create table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS payment_settings (
                id int NOT NULL AUTO_INCREMENT,
                gcash_enabled tinyint(1) DEFAULT 1,
                downpayment_enabled tinyint(1) DEFAULT 1,
                downpayment_percentage decimal(5,2) DEFAULT 25.00,
                min_order_amount decimal(10,2) DEFAULT 500.00,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);
        
        // Insert default settings if none exist
        await db.execute(`
            INSERT IGNORE INTO payment_settings (id, gcash_enabled, downpayment_enabled, downpayment_percentage, min_order_amount) 
            VALUES (1, 1, 1, 25.00, 500.00)
        `);
    } catch (error) {
        console.error('Error initializing payment settings table:', error);
    }
};

// Get payment settings
exports.getPaymentSettings = async (req, res) => {
    try {
        // Ensure table exists
        await initializePaymentSettingsTable();
        
        const [rows] = await db.execute('SELECT * FROM payment_settings WHERE id = 1');
        
        if (rows.length === 0) {
            // This shouldn't happen after initialization, but just in case
            await db.execute(`
                INSERT INTO payment_settings (gcash_enabled, downpayment_enabled, downpayment_percentage, min_order_amount) 
                VALUES (1, 1, 25.00, 500.00)
            `);
            
            const [newRows] = await db.execute('SELECT * FROM payment_settings WHERE id = 1');
            return res.json({
                success: true,
                settings: newRows[0]
            });
        }
        
        // Don't send sensitive keys to frontend
        const settings = {
            id: rows[0].id,
            gcash_enabled: rows[0].gcash_enabled,
            gcash_environment: rows[0].gcash_environment,
            downpayment_enabled: rows[0].downpayment_enabled,
            downpayment_percentage: rows[0].downpayment_percentage,
            min_order_amount: rows[0].min_order_amount,
            created_at: rows[0].created_at,
            updated_at: rows[0].updated_at
        };
        
        res.json({
            success: true,
            settings: settings
        });
    } catch (error) {
        console.error('Error fetching payment settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment settings'
        });
    }
};

// Update all payment settings
exports.updatePaymentSettings = async (req, res) => {
    try {
        // Ensure table exists
        await initializePaymentSettingsTable();
        
        const { gcash_enabled, downpayment_enabled, downpayment_percentage, min_order_amount } = req.body;
        
        // Validate inputs
        if (downpayment_percentage && (downpayment_percentage < 1 || downpayment_percentage > 99)) {
            return res.status(400).json({
                success: false,
                message: 'Downpayment percentage must be between 1 and 99'
            });
        }
        
        if (min_order_amount && min_order_amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Minimum order amount must be positive'
            });
        }
        
        const [result] = await db.execute(`
            UPDATE payment_settings 
            SET gcash_enabled = ?, 
                downpayment_enabled = ?, 
                downpayment_percentage = ?, 
                min_order_amount = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `, [
            gcash_enabled ? 1 : 0,
            downpayment_enabled ? 1 : 0,
            parseFloat(downpayment_percentage) || 25.00,
            parseFloat(min_order_amount) || 500.00
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment settings not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Payment settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating payment settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment settings'
        });
    }
};

// Update GCash settings only
exports.updateGCashSettings = async (req, res) => {
    try {
        // Ensure table exists
        await initializePaymentSettingsTable();
        
        const { gcash_enabled } = req.body;
        
        const [result] = await db.execute(`
            UPDATE payment_settings 
            SET gcash_enabled = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `, [gcash_enabled ? 1 : 0]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment settings not found'
            });
        }
        
        res.json({
            success: true,
            message: 'GCash settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating GCash settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update GCash settings'
        });
    }
};

// Update downpayment settings only
exports.updateDownpaymentSettings = async (req, res) => {
    try {
        // Ensure table exists
        await initializePaymentSettingsTable();
        
        const { downpayment_enabled, downpayment_percentage, min_order_amount } = req.body;
        
        // Validate inputs
        if (downpayment_percentage && (downpayment_percentage < 1 || downpayment_percentage > 99)) {
            return res.status(400).json({
                success: false,
                message: 'Downpayment percentage must be between 1 and 99'
            });
        }
        
        if (min_order_amount && min_order_amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Minimum order amount must be positive'
            });
        }
        
        const [result] = await db.execute(`
            UPDATE payment_settings 
            SET downpayment_enabled = ?, 
                downpayment_percentage = ?, 
                min_order_amount = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `, [
            downpayment_enabled ? 1 : 0,
            parseFloat(downpayment_percentage) || 25.00,
            parseFloat(min_order_amount) || 500.00
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment settings not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Downpayment settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating downpayment settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update downpayment settings'
        });
    }
};

// Update GCash configuration (API keys)
exports.updateGCashConfig = async (req, res) => {
    try {
        // Ensure table exists
        await initializePaymentSettingsTable();
        
        const { public_key, secret_key, environment } = req.body;
        
        // Validate environment
        if (environment && !['test', 'live'].includes(environment)) {
            return res.status(400).json({
                success: false,
                message: 'Environment must be either "test" or "live"'
            });
        }
        
        const [result] = await db.execute(`
            UPDATE payment_settings 
            SET gcash_public_key = ?, 
                gcash_secret_key = ?, 
                gcash_environment = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `, [
            public_key,
            secret_key,
            environment || 'test'
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment settings not found'
            });
        }
        
        res.json({
            success: true,
            message: 'GCash configuration updated successfully'
        });
    } catch (error) {
        console.error('Error updating GCash configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update GCash configuration'
        });
    }
};

// Get GCash configuration (for admin use only)
exports.getGCashConfig = async (req, res) => {
    try {
        // Ensure table exists
        await initializePaymentSettingsTable();
        
        const [rows] = await db.execute(`
            SELECT gcash_public_key, gcash_secret_key, gcash_environment 
            FROM payment_settings 
            WHERE id = 1
        `);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment settings not found'
            });
        }
        
        res.json({
            success: true,
            config: {
                public_key: rows[0].gcash_public_key || '',
                secret_key: rows[0].gcash_secret_key || '',
                environment: rows[0].gcash_environment || 'test'
            }
        });
    } catch (error) {
        console.error('Error fetching GCash configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GCash configuration'
        });
    }
};

// Get payment settings for order processing (public endpoint for frontend)
exports.getPublicPaymentSettings = async (req, res) => {
    try {
        // Ensure table exists
        await initializePaymentSettingsTable();
        
        const [rows] = await db.execute(`
            SELECT gcash_enabled, downpayment_enabled, downpayment_percentage, min_order_amount 
            FROM payment_settings 
            WHERE id = 1
        `);
        
        if (rows.length === 0) {
            // Return default settings if none exist (shouldn't happen after initialization)
            return res.json({
                success: true,
                settings: {
                    gcash_enabled: true,
                    downpayment_enabled: true,
                    downpayment_percentage: 25.00,
                    min_order_amount: 500.00
                }
            });
        }
        
        res.json({
            success: true,
            settings: {
                gcash_enabled: Boolean(rows[0].gcash_enabled),
                downpayment_enabled: Boolean(rows[0].downpayment_enabled),
                downpayment_percentage: parseFloat(rows[0].downpayment_percentage),
                min_order_amount: parseFloat(rows[0].min_order_amount)
            }
        });
    } catch (error) {
        console.error('Error fetching public payment settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment settings'
        });
    }
};
