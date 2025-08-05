const db = require('../config/db');
const Admin = require('../models/adminModel');
const Staff = require('../models/staffModel');
const User = require('../models/userModel');
const Reward = require('../models/rewardModel');
const emailService = require('../services/emailService');
const forecastService = require('../services/forecastService');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs'); 

async function sendEmailReceipt(order, settings) {
    try {
        // Create transporter (configure with your email service)
        const transporter = nodemailer.createTransport({ // Changed from createTransporter to createTransport
            service: 'gmail',  // Replace with your email service
            auth: {
                user: process.env.EMAIL_USER || 'lanslorence@gmail.com', // Use default if env not set
                pass: process.env.EMAIL_PASS || 'dwha kvpo ogpk txmg' // Use default if env not set
            }
        });
        
        // Generate receipt HTML
        const receiptHtml = generateEmailReceiptHTML(order, settings);
        
        // Define email options
        const mailOptions = {
            from: `"${settings.storeName}" <${process.env.EMAIL_USER || 'lanslorence@gmail.com'}>`,
            to: order.email,
            subject: `Receipt for Order #${order.order_id}`,
            html: receiptHtml
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        console.log(`Receipt email sent to ${order.email} for order ${order.order_id}`);
    } catch (error) {
        console.error('Error sending email receipt:', error);
        // Continue execution even if email fails
    }
}

function generateEmailReceiptHTML(order, settings) {
    const date = new Date().toLocaleString();
    
    // Format items
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <div style="font-weight: 500;">${item.name}</div>
                <div style="font-size: 14px; color: #666;">
                    ${item.quantity} × ₱${parseFloat(item.price).toFixed(2)} = ₱${(item.price * item.quantity).toFixed(2)}
                </div>
            </td>
        </tr>
    `).join('');
    
    // Format the thank you message with line breaks
    const thankyouMessage = settings.thankyouMessage
        ? settings.thankyouMessage.replace(/\n/g, '<br>')
        : 'Thank you for your purchase!<br>Please come again!';
    
    // Ensure numerical values are parsed correctly
    const subtotal = parseFloat(order.subtotal) || 0;
    const discountAmount = parseFloat(order.discount_amount) || 0;
    const totalAmount = parseFloat(order.total_amount) || 0;
    const cashAmount = parseFloat(order.cash_amount) || 0;
    const changeAmount = parseFloat(order.change_amount) || 0;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt for Order #${order.order_id}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .receipt-container {
                    max-width: 600px;
                    margin: 0 auto;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .receipt-header {
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                .receipt-header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .receipt-header p {
                    margin: 5px 0 0;
                    opacity: 0.9;
                }
                .receipt-body {
                    padding: 20px;
                    background-color: white;
                }
                .receipt-info {
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }
                .receipt-info p {
                    margin: 8px 0;
                }
                .receipt-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .receipt-totals {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    text-align: right;
                }
                .receipt-totals p {
                    margin: 8px 0;
                }
                .subtotal {
                    color: #666;
                }
                .discount {
                    color: #4CAF50;
                }
                .total {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                }
                .payment {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #eee;
                }
                .receipt-footer {
                    background-color: #f9f9f9;
                    padding: 20px;
                    text-align: center;
                }
                .receipt-footer p {
                    margin: 5px 0;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="receipt-header">
                    <h1>${settings.storeName}</h1>
                    <p>${settings.storeTagline}</p>
                </div>
                
                <div class="receipt-body">
                    <div class="receipt-info">
                        <p><strong>Order ID:</strong> ${order.order_id}</p>
                        <p><strong>Date:</strong> ${date}</p>
                        <p><strong>Customer:</strong> ${order.customer_name}</p>
                        ${settings.storeAddress ? `<p><strong>Store Address:</strong> ${settings.storeAddress}</p>` : ''}
                        ${settings.contactNumber ? `<p><strong>Contact:</strong> ${settings.contactNumber}</p>` : ''}
                    </div>
                    
                    <table class="receipt-table">
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    
                    <div class="receipt-totals">
                        <p class="subtotal">Subtotal: ₱${subtotal.toFixed(2)}</p>
                        ${discountAmount > 0 ? `<p class="discount">Discount: -₱${discountAmount.toFixed(2)}</p>` : ''}
                        <p class="total">Total: ₱${totalAmount.toFixed(2)}</p>
                        
                        <div class="payment">
                            <p>Cash: ₱${cashAmount.toFixed(2)}</p>
                            <p>Change: ₱${changeAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="receipt-footer">
                    <p>${thankyouMessage}</p>
                    ${settings.footerText ? `<p style="font-size: 12px; margin-top: 10px;">${settings.footerText}</p>` : ''}
                </div>
            </div>
        </body>
        </html>
    `;
}

exports.getStats = async (req, res) => {
    try {
        const stats = await Admin.getUserStats();
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await Admin.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Admin.getAllStaff();
        res.json(staff);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ message: 'Error fetching staff' });
    }
};

exports.recruitStaff = async (req, res) => {
    try {
        const staffData = req.body;

        // Check if user exists
        const existingUser = await User.findByEmail(staffData.email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create staff user
        await Admin.createStaff(staffData);

        res.status(201).json({ 
            message: 'Staff member registered successfully'
        });
    } catch (error) {
        console.error('Staff registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const timeFilter = req.query.timeFilter || 'week';

    // Get base stats with different time filters
    let timePeriod, previousPeriod;
    switch(timeFilter) {
      case 'today':
        timePeriod = 'DATE(o.created_at) = CURRENT_DATE()';
        previousPeriod = 'DATE(o.created_at) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)';
        break;
      case 'week':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        previousPeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) AND o.created_at < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        break;
      case 'month':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)';
        previousPeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) AND o.created_at < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)';
        break;
      case 'year':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)';
        previousPeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 730 DAY) AND o.created_at < DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)';
        break;
      case 'all':
        timePeriod = '1=1'; // This means no time restriction
        previousPeriod = '1=0'; // There's no meaningful "previous" period for all time
        break;
      default:
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        previousPeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) AND o.created_at < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
    }

    // Get current period sales
    const [currentSales] = await db.execute(`
      SELECT 
        SUM(o.total_amount) as totalSales
      FROM orders o
      WHERE o.status = 'paid' AND ${timePeriod}
    `);

    // Get previous period sales for growth calculation
    const [previousSales] = await db.execute(`
      SELECT 
        SUM(o.total_amount) as totalSales
      FROM orders o
      WHERE o.status = 'paid' AND ${previousPeriod}
    `);

    // Get daily income (today)
    const [dailyIncome] = await db.execute(`
      SELECT 
        SUM(o.total_amount) as dailyIncome
      FROM orders o
      WHERE o.status = 'paid' AND DATE(o.created_at) = CURRENT_DATE()
    `);

    // Get yesterday's income for growth calculation
    const [yesterdayIncome] = await db.execute(`
      SELECT 
        SUM(o.total_amount) as dailyIncome
      FROM orders o
      WHERE o.status = 'paid' AND DATE(o.created_at) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
    `);

    // Calculate growth rates
    const currentSalesTotal = currentSales[0].totalSales || 0;
    const previousSalesTotal = previousSales[0].totalSales || 0;
    const salesGrowth = previousSalesTotal > 0 
      ? ((currentSalesTotal - previousSalesTotal) / previousSalesTotal) * 100 
      : 0;

    const dailyIncomeValue = dailyIncome[0].dailyIncome || 0;
    const yesterdayIncomeValue = yesterdayIncome[0].dailyIncome || 0;
    const dailyGrowth = yesterdayIncomeValue > 0 
      ? ((dailyIncomeValue - yesterdayIncomeValue) / yesterdayIncomeValue) * 100 
      : 0;

    // Calculate potential growth based on 3-month data
    const [quarterlyData] = await db.execute(`
      SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as month,
        SUM(o.total_amount) as monthlySales
      FROM orders o
      WHERE o.status = 'paid' AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY month
    `);

    let potentialGrowth = 5.8; // Default value
    if (quarterlyData.length > 1) {
      const growthRates = [];
      for (let i = 1; i < quarterlyData.length; i++) {
        const currentMonth = quarterlyData[i].monthlySales || 0;
        const prevMonth = quarterlyData[i-1].monthlySales || 0;
        if (prevMonth > 0) {
          growthRates.push(((currentMonth - prevMonth) / prevMonth) * 100);
        }
      }
      
      if (growthRates.length > 0) {
        // Calculate average monthly growth and project to next month
        potentialGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
        potentialGrowth = Math.round(potentialGrowth * 10) / 10; // Round to 1 decimal
      }
    }

    // Get user stats
    const [userStats] = await db.execute(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE 
          WHEN created_at >= CASE 
            WHEN '${timeFilter}' = 'today' THEN DATE_SUB(NOW(), INTERVAL 1 DAY)
            WHEN '${timeFilter}' = 'week' THEN DATE_SUB(NOW(), INTERVAL 7 DAY)
            WHEN '${timeFilter}' = 'month' THEN DATE_SUB(NOW(), INTERVAL 30 DAY)
            WHEN '${timeFilter}' = 'year' THEN DATE_SUB(NOW(), INTERVAL 365 DAY)
          END
          THEN 1 ELSE 0 END) as newUsers
      FROM users
      WHERE role = 'user'
    `);

    // Get staff stats
    const [staffStats] = await db.execute(`
      SELECT 
        COUNT(*) as totalStaff,
        COUNT(*) as activeStaff
      FROM users
      WHERE role = 'staff'
    `);

    // Get top staff
    const [topStaff] = await db.execute(`
      SELECT 
        u.username,
        COUNT(DISTINCT o.order_id) as orders_handled,
        COALESCE(SUM(o.total_amount), 0) as total_sales
      FROM users u
      LEFT JOIN orders o ON u.id = o.accepted_by
      WHERE u.role = 'staff'
      AND (o.status = 'paid' OR o.status = 'ready for pickup' OR o.status IS NULL)
      GROUP BY u.id, u.username
      ORDER BY orders_handled DESC, total_sales DESC
      LIMIT 5
    `);

    res.json({
      totalSales: currentSalesTotal || 0,
      dailyIncome: dailyIncomeValue || 0,
      dailyGrowth: dailyGrowth,
      salesGrowth: salesGrowth,
      potentialGrowth: potentialGrowth,
      totalUsers: userStats[0].totalUsers || 0,
      newUsers: userStats[0].newUsers || 0,
      totalStaff: staffStats[0].totalStaff || 0,
      activeStaff: staffStats[0].activeStaff || 0,
      topStaff: topStaff || []
    });

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error getting dashboard stats' });
  }
};

exports.updateStaff = async (req, res) => {
    try {
        const staffId = req.params.id;
        const staffData = req.body;
        await Admin.updateStaff(staffId, staffData);
        res.json({ message: 'Staff updated successfully' });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ message: 'Error updating staff' });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const staffId = req.params.id;
        await Admin.deleteStaff(staffId);
        res.json({ message: 'Staff deleted successfully' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ message: 'Error deleting staff' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Staff.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderDetails = await Staff.getOrderDetails(orderId);
        
        if (!orderDetails) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(orderDetails);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Error fetching order details' });
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { cashAmount, changeAmount, sendEmailReceipt: shouldSendEmail } = req.body;
        
        // Get order details with user email before updating status
        const [orderDetails] = await db.execute(
            `SELECT o.*, u.email, 
                    CASE 
                        WHEN o.is_physical_order = 1 THEN o.customer_name
                        ELSE u.username
                    END as customer_name,
                    s.username as staff_name,
                    ad.amount as discount_amount,
                    (SELECT SUM(oi.price * oi.quantity) 
                     FROM order_items oi 
                     WHERE oi.order_id = o.order_id) as subtotal
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             LEFT JOIN users s ON o.accepted_by = s.id
             LEFT JOIN available_discounts ad ON o.order_id = ad.order_id AND ad.used = TRUE
             WHERE o.order_id = ?`,
            [orderId]
        );

        if (!orderDetails[0]) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Get order items
        const [items] = await db.execute(
            `SELECT oi.*, p.name, pc.name as choice_name,
                    p.image, COALESCE(pc.image, p.image) as actual_image
             FROM order_items oi 
             LEFT JOIN products p ON oi.product_id = p.products_id
             LEFT JOIN product_choices pc ON oi.choice_id = pc.choice_id 
             WHERE oi.order_id = ?`,
            [orderId]
        );

        // Add cash_amount and change_amount columns if they don't exist
        try {
            // First check if the columns exist
            const [columns] = await db.query(`SHOW COLUMNS FROM orders LIKE 'cash_amount'`);
            
            if (columns.length === 0) {
                // Columns don't exist, add them
                await db.query(`ALTER TABLE orders 
                    ADD COLUMN cash_amount DECIMAL(10,2) NULL,
                    ADD COLUMN change_amount DECIMAL(10,2) NULL`);
                console.log('Added cash_amount and change_amount columns to orders table');
            }
        } catch (error) {
            console.error('Error checking/adding columns:', error);
            // Continue with the update - we'll handle any errors below
        }

        // Update order status and payment details
        try {
            await db.execute(
                'UPDATE orders SET status = ?, cash_amount = ?, change_amount = ? WHERE order_id = ?',
                ['paid', parseFloat(cashAmount), parseFloat(changeAmount), orderId]
            );
        } catch (error) {
            console.error('Error updating order payment:', error);
            
            // Fall back to just updating the status if columns don't exist
            await db.execute(
                'UPDATE orders SET status = ? WHERE order_id = ?',
                ['paid', orderId]
            );
        }
        
        // If sendEmailReceipt is true and user has an email, send digital receipt
        if (shouldSendEmail && orderDetails[0].email) {
            // Get receipt settings
            const [receiptSettings] = await db.query('SELECT * FROM receipt_settings LIMIT 1');
            const settings = receiptSettings[0] || {
                storeName: 'JM Garis Store',
                storeTagline: 'Official Receipt',
                storeAddress: '',
                contactNumber: '',
                thankyouMessage: 'Thank you for your purchase!\nPlease come again!',
                footerText: ''
            };
            
            // Format items for email
            const formattedItems = items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                name: item.choice_name ? `${item.name} (${item.choice_name})` : item.name,
                choice_name: item.choice_name,
                image: item.actual_image || item.image
            }));
            
            // Prepare order details for email
            const orderData = {
                ...orderDetails[0],
                items: formattedItems,
                subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                order_id: orderId,
                total_amount: orderDetails[0].total_amount,
                discount_amount: parseFloat(orderDetails[0].discount_amount) || 0,
                cash_amount: parseFloat(cashAmount),
                change_amount: parseFloat(changeAmount),
            };
            
            // Send email receipt
            await sendEmailReceipt(orderData, settings);
        }

        res.json({ message: 'Payment processed successfully' });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ message: 'Error processing payment' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        await Admin.deleteProduct(productId);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
};

exports.getAllRewardTiers = async (req, res) => {
    try {
        const [tiers] = await db.query('SELECT * FROM reward_tiers ORDER BY points_required ASC');
        res.json(tiers);
    } catch (error) {
        console.error('Error getting reward tiers:', error);
        res.status(500).json({ message: 'Error getting reward tiers' });
    }
};

exports.createRewardTier = async (req, res) => {
    try {
        const { name, points_required, discount_amount, description } = req.body;
        
        if (!name || !points_required || !discount_amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const [result] = await db.query(
            'INSERT INTO reward_tiers (name, points_required, discount_amount, description) VALUES (?, ?, ?, ?)',
            [name, points_required, discount_amount, description]
        );
        
        res.status(201).json({ 
            message: 'Reward tier created successfully',
            tierId: result.insertId
        });
    } catch (error) {
        console.error('Error creating reward tier:', error);
        res.status(500).json({ message: 'Error creating reward tier' });
    }
};

exports.updateRewardTier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, points_required, discount_amount, description } = req.body;
        
        if (!name || !points_required || !discount_amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        await db.query(
            'UPDATE reward_tiers SET name = ?, points_required = ?, discount_amount = ?, description = ? WHERE id = ?',
            [name, points_required, discount_amount, description, id]
        );
        
        res.json({ message: 'Reward tier updated successfully' });
    } catch (error) {
        console.error('Error updating reward tier:', error);
        res.status(500).json({ message: 'Error updating reward tier' });
    }
};

exports.deleteRewardTier = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM reward_tiers WHERE id = ?', [id]);
        res.json({ message: 'Reward tier deleted successfully' });
    } catch (error) {
        console.error('Error deleting reward tier:', error);
        res.status(500).json({ message: 'Error deleting reward tier' });
    }
};

exports.getRewardsStatistics = async (req, res) => {
    try {
        // Get total points awarded
        const [totalPointsResult] = await db.query(
            'SELECT COALESCE(SUM(points), 0) as total FROM user_rewards WHERE points > 0'
        );
        
        // Get total points redeemed
        const [redeemedPointsResult] = await db.query(
            'SELECT COALESCE(SUM(ABS(points)), 0) as total FROM user_rewards WHERE points < 0'
        );
        
        // Get top users by points
        const [topUsers] = await db.query(`
            SELECT 
                u.id,
                u.username,
                COALESCE(SUM(r.points), 0) as total_points
            FROM 
                users u
            LEFT JOIN 
                user_rewards r ON u.id = r.user_id
            GROUP BY 
                u.id
            ORDER BY 
                total_points DESC
            LIMIT 10
        `);
        
        res.json({
            totalPointsAwarded: totalPointsResult[0].total,
            totalPointsRedeemed: redeemedPointsResult[0].total,
            topUsers
        });
    } catch (error) {
        console.error('Error getting rewards statistics:', error);
        res.status(500).json({ message: 'Error getting rewards statistics' });
    }
};

exports.getProductForecasts = async (req, res) => {
    try {
        const { type = 'sales', days = 30, method = 'prophet' } = req.query;
        
        // Additional validation
        if (!['sales', 'demand'].includes(type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid forecast type. Must be "sales" or "demand"'
            });
        }
        
        const parsedDays = parseInt(days);
        if (isNaN(parsedDays) || parsedDays < 7 || parsedDays > 180) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid forecast period. Must be between 7 and 180 days'
            });
        }
        
        // Check if we're using the Python service or JavaScript service
        if (['prophet', 'advanced'].includes(method)) {
            // Use Python service for advanced forecasting
            const { spawn } = require('child_process');
            const options = JSON.stringify({
                type,
                days: parsedDays,
                method: method === 'advanced' ? 'prophet' : method
            });
            
            const pythonProcess = spawn('python', [
                './services/forecastService.py',
                options
            ]);
            
            let result = '';
            let errorOutput = '';
            
            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python process error:', errorOutput);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Error in forecasting service',
                        error: errorOutput
                    });
                }
                
                try {
                    const forecasts = JSON.parse(result);
                    return res.json(forecasts);
                } catch (e) {
                    console.error('Error parsing Python output:', e);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Error parsing forecast results'
                    });
                }
            });
        } else {
            // Fall back to JavaScript service for simpler methods
            const forecastService = require('../services/forecastService');
            const forecastResult = await forecastService.updateForecastMetrics({
                type,
                days: parsedDays,
                method
            });
            
            if (forecastResult.status === 'error') {
                return res.status(500).json({ 
                    message: forecastResult.message || 'Error generating forecasts' 
                });
            }
            
            res.json(forecastResult);
        }
    } catch (error) {
        console.error('Error getting forecasts:', error);
        res.status(500).json({ message: 'Error generating forecasts' });
    }
};

exports.getLowStockItems = async (req, res) => {
    try {
        const lowStockItems = await Admin.getLowStockItems();
        res.json(lowStockItems);
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ message: 'Failed to fetch low stock items' });
    }
};

exports.getReceiptSettings = async (req, res) => {
    try {
        // Check if receipt settings exist in the database
        const [settings] = await db.query('SELECT * FROM receipt_settings LIMIT 1');
        
        if (settings && settings.length > 0) {
            res.json(settings[0]);
        } else {
            // Return default settings if none exist
            res.json({
                storeName: 'JM Garis Store',
                storeTagline: 'Official Receipt',
                storeAddress: '',
                contactNumber: '',
                thankyouMessage: 'Thank you for your purchase!\nPlease come again!',
                footerText: ''
            });
        }
    } catch (error) {
        console.error('Error getting receipt settings:', error);
        res.status(500).json({ message: 'Error getting receipt settings' });
    }
};

// Save receipt settings
exports.saveReceiptSettings = async (req, res) => {
    try {
        const { 
            storeName, 
            storeTagline, 
            storeAddress, 
            contactNumber, 
            thankyouMessage, 
            footerText 
        } = req.body;
        
        // Check if settings already exist
        const [existingSettings] = await db.query('SELECT id FROM receipt_settings LIMIT 1');
        
        if (existingSettings && existingSettings.length > 0) {
            // Update existing settings
            await db.execute(
                `UPDATE receipt_settings 
                SET storeName = ?, storeTagline = ?, storeAddress = ?, 
                    contactNumber = ?, thankyouMessage = ?, footerText = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [storeName, storeTagline, storeAddress, contactNumber, thankyouMessage, footerText, existingSettings[0].id]
            );
        } else {
            // Create new settings
            await db.execute(
                `INSERT INTO receipt_settings 
                (storeName, storeTagline, storeAddress, contactNumber, thankyouMessage, footerText)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [storeName, storeTagline, storeAddress, contactNumber, thankyouMessage, footerText]
            );
        }
        
        res.json({ message: 'Receipt settings saved successfully' });
    } catch (error) {
        console.error('Error saving receipt settings:', error);
        res.status(500).json({ message: 'Error saving receipt settings' });
    }
};

exports.getSalesChartData = async (req, res) => {
  try {
    const period = req.query.period || 'week';
    
    // Get chart data based on period
    const chartData = await Admin.getSalesChartData(period);
    
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching sales chart data:', error);
    res.status(500).json({ message: 'Failed to fetch sales chart data' });
  }
};

exports.getTopCustomers = async (req, res) => {
  try {
    const period = req.query.period || 'week';
    
    let timeFilter;
    switch(period) {
      case 'today':
        timeFilter = 'DATE(o.created_at) = CURRENT_DATE()';
        break;
      case 'week':
        timeFilter = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        break;
      case 'month':
        timeFilter = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)';
        break;
      case 'year':
        timeFilter = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)';
        break;
      default:
        timeFilter = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
    }
    
    const [customers] = await db.execute(`
      SELECT 
        o.user_id,
        u.username,
        COUNT(DISTINCT o.order_id) as order_count,
        SUM(o.total_amount) as total_amount
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status = 'paid' AND ${timeFilter}
      GROUP BY o.user_id, u.username
      ORDER BY total_amount DESC
      LIMIT 5
    `);
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ message: 'Failed to fetch top customers' });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    const quarter = req.query.quarter || 'Q1';
    
    let timeFilter;
    switch(period) {
      case 'weekly':
        timeFilter = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        break;
      case 'monthly':
        timeFilter = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)';
        break;
      case 'quarterly':
        // Format quarter filter
        const currentYear = new Date().getFullYear();
        let startMonth, endMonth;
        if (quarter === 'Q1') {
          startMonth = 1;
          endMonth = 3;
        } else if (quarter === 'Q2') {
          startMonth = 4;
          endMonth = 6;
        } else if (quarter === 'Q3') {
          startMonth = 7;
          endMonth = 9;
        } else if (quarter === 'Q4') {
          startMonth = 10;
          endMonth = 12;
        }

        timeFilter = `YEAR(o.created_at) = ${currentYear} 
                       AND MONTH(o.created_at) >= ${startMonth} 
                       AND MONTH(o.created_at) <= ${endMonth}`;
        break;
      case 'annually':
        timeFilter = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)';
        break;
      default:
        timeFilter = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
    }
    
    const [products] = await db.execute(`
      SELECT 
        p.products_id,
        p.name,
        p.image,
        SUM(oi.quantity) as quantity,
        SUM(oi.price * oi.quantity) as revenue
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.products_id
      WHERE o.status = 'paid' AND ${timeFilter}
      GROUP BY p.products_id, p.name, p.image
      ORDER BY quantity DESC
      LIMIT 5
    `);
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Failed to fetch top products' });
  }
};

exports.getOrderReports = async (req, res) => {
  try {
    const [reports] = await db.query(`
      SELECT r.*, u.username 
      FROM order_reports r
      JOIN users u ON r.user_id = u.id
      ORDER BY 
        CASE 
          WHEN r.status = 'pending' THEN 0
          WHEN r.status = 'in_progress' THEN 1
          ELSE 2
        END,
        r.created_at DESC
    `);
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching order reports:', error);
    res.status(500).json({ message: 'Error fetching order reports' });
  }
};

// Get all product reports
exports.getProductReports = async (req, res) => {
  try {
    const [reports] = await db.query(`
      SELECT r.*, u.username, p.name, p.image
      FROM product_reports r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.products_id
      ORDER BY 
        CASE 
          WHEN r.status = 'pending' THEN 0
          WHEN r.status = 'in_progress' THEN 1
          ELSE 2
        END,
        r.created_at DESC
    `);
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching product reports:', error);
    res.status(500).json({ message: 'Error fetching product reports' });
  }
};

// Update an order report
exports.updateOrderReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_response } = req.body;
    
    // Validate input
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Check if report exists
    const [reportCheck] = await db.query(
      'SELECT id FROM order_reports WHERE id = ?',
      [id]
    );
    
    if (reportCheck.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update report
    const now = new Date();
    const resolved_at = (status === 'resolved' || status === 'rejected') ? now : null;
    
    await db.query(
      `UPDATE order_reports 
       SET status = ?, admin_response = ?, updated_at = ?, resolved_at = ?
       WHERE id = ?`,
      [status, admin_response || null, now, resolved_at, id]
    );
    
    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    console.error('Error updating order report:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
};

// Update a product report
exports.updateProductReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_response } = req.body;
    
    // Validate input
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Check if report exists
    const [reportCheck] = await db.query(
      'SELECT id FROM product_reports WHERE id = ?',
      [id]
    );
    
    if (reportCheck.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update report
    const now = new Date();
    const resolved_at = (status === 'resolved' || status === 'rejected') ? now : null;
    
    await db.query(
      `UPDATE product_reports 
       SET status = ?, admin_response = ?, updated_at = ?, resolved_at = ?
       WHERE id = ?`,
      [status, admin_response || null, now, resolved_at, id]
    );
    
    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    console.error('Error updating product report:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
};

exports.getPublicReceiptSettings = async (req, res) => {
    try {
        // Check if receipt settings exist in the database
        const [settings] = await db.query('SELECT * FROM receipt_settings LIMIT 1');
        
        if (settings && settings.length > 0) {
            // Return only the necessary fields for public access
            const publicSettings = {
                storeName: settings[0].storeName,
                storeTagline: settings[0].storeTagline,
                storeAddress: settings[0].storeAddress,
                contactNumber: settings[0].contactNumber,
                thankyouMessage: settings[0].thankyouMessage,
                footerText: settings[0].footerText
            };
            res.json(publicSettings);
        } else {
            // Return default settings if none exist
            res.json({
                storeName: 'JM Garis Store',
                storeTagline: 'Official Receipt',
                storeAddress: '',
                contactNumber: '',
                thankyouMessage: 'Thank you for your purchase!\nPlease come again!',
                footerText: ''
            });
        }
    } catch (error) {
        console.error('Error getting public receipt settings:', error);
        // Return default settings on error
        res.json({
            storeName: 'JM Garis Store',
            storeTagline: 'Official Receipt',
            storeAddress: '',
            contactNumber: '',
            thankyouMessage: 'Thank you for your purchase!\nPlease come again!',
            footerText: ''
        });
    }
};
exports.getProductInsights = async (req, res) => {
  try {
    // Get highest rated product
    const [highestRated] = await db.execute(`
      SELECT 
        p.products_id,
        p.name,
        p.image,
        AVG(r.rating) as avg_rating,
        COUNT(r.id) as review_count
      FROM products p
      JOIN order_items oi ON p.products_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      JOIN order_reviews r ON o.order_id = r.order_id
      WHERE o.status = 'paid'
      GROUP BY p.products_id, p.name, p.image
      HAVING review_count > 0
      ORDER BY avg_rating DESC, review_count DESC
      LIMIT 1
    `);

    // Get lowest rated product
    const [lowestRated] = await db.execute(`
      SELECT 
        p.products_id,
        p.name,
        p.image,
        AVG(r.rating) as avg_rating,
        COUNT(r.id) as review_count
      FROM products p
      JOIN order_items oi ON p.products_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      JOIN order_reviews r ON o.order_id = r.order_id
      WHERE o.status = 'paid'
      GROUP BY p.products_id, p.name, p.image
      HAVING review_count > 0
      ORDER BY avg_rating ASC, review_count ASC
      LIMIT 1
    `);

    // Get most sold product
    const [mostSold] = await db.execute(`
      SELECT 
        p.products_id,
        p.name,
        p.image,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM products p
      JOIN order_items oi ON p.products_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status = 'paid'
      GROUP BY p.products_id, p.name, p.image
      ORDER BY total_sold DESC
      LIMIT 1
    `);

    // Get least sold product (but has at least 1 sale)
    const [leastSold] = await db.execute(`
      SELECT 
        p.products_id,
        p.name,
        p.image,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM products p
      JOIN order_items oi ON p.products_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status = 'paid'
      GROUP BY p.products_id, p.name, p.image
      HAVING total_sold > 0
      ORDER BY total_sold ASC
      LIMIT 1
    `);

    res.json({
      highestRated: highestRated[0] ? {
        name: highestRated[0].name,
        image: highestRated[0].image,
        rating: parseFloat(highestRated[0].avg_rating),
        reviewCount: parseInt(highestRated[0].review_count)
      } : null,
      lowestRated: lowestRated[0] ? {
        name: lowestRated[0].name,
        image: lowestRated[0].image,
        rating: parseFloat(lowestRated[0].avg_rating),
        reviewCount: parseInt(lowestRated[0].review_count)
      } : null,
      mostSold: mostSold[0] ? {
        name: mostSold[0].name,
        image: mostSold[0].image,
        totalSold: parseInt(mostSold[0].total_sold),
        revenue: parseFloat(mostSold[0].total_revenue)
      } : null,
      leastSold: leastSold[0] ? {
        name: leastSold[0].name,
        image: leastSold[0].image,
        totalSold: parseInt(leastSold[0].total_sold),
        revenue: parseFloat(leastSold[0].total_revenue)
      } : null
    });
  } catch (error) {
    console.error('Error fetching product insights:', error);
    res.status(500).json({ message: 'Error fetching product insights' });
  }
};

exports.getCustomerMetrics = async (req, res) => {
  try {
    // Calculate average order value
    const [avgOrderValue] = await db.execute(`
      SELECT AVG(total_amount) as avg_order_value
      FROM orders
      WHERE status = 'paid'
    `);

    // Calculate customer retention rate (customers who made more than one order)
    const [retentionRate] = await db.execute(`
      SELECT 
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) as returning_customers,
        COUNT(DISTINCT user_id) as total_customers,
        (COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) / COUNT(DISTINCT user_id)) * 100 as retention_rate
      FROM (
        SELECT user_id, COUNT(*) as order_count
        FROM orders
        WHERE status = 'paid'
        GROUP BY user_id
      ) as customer_orders
    `);

    // Calculate repeat purchase rate
    const [repeatPurchaseRate] = await db.execute(`
      SELECT 
        (COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) / COUNT(DISTINCT user_id)) * 100 as repeat_purchase_rate
      FROM (
        SELECT user_id, COUNT(*) as order_count
        FROM orders
        WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
        GROUP BY user_id
      ) as recent_customer_orders
    `);

    // Calculate customer lifetime value
    const [lifetimeValue] = await db.execute(`
      SELECT AVG(customer_total) as avg_lifetime_value
      FROM (
        SELECT user_id, SUM(total_amount) as customer_total
        FROM orders
        WHERE status = 'paid'
        GROUP BY user_id
      ) as customer_totals
    `);

    res.json({
      avgOrderValue: parseFloat(avgOrderValue[0]?.avg_order_value || 0),
      retentionRate: parseFloat(retentionRate[0]?.retention_rate || 0),
      repeatPurchaseRate: parseFloat(repeatPurchaseRate[0]?.repeat_purchase_rate || 0),
      lifetimeValue: parseFloat(lifetimeValue[0]?.avg_lifetime_value || 0)
    });
  } catch (error) {
    console.error('Error fetching customer metrics:', error);
    res.status(500).json({ message: 'Error fetching customer metrics' });
  }
};
exports.getLoyaltyTiers = async (req, res) => {
    try {
        const [tiers] = await db.query('SELECT * FROM loyalty_tiers ORDER BY min_spend ASC');
        res.json(tiers);
    } catch (error) {
        console.error('Error getting loyalty tiers:', error);
        res.status(500).json({ message: 'Error getting loyalty tiers' });
    }
};

exports.createLoyaltyTier = async (req, res) => {
    try {
        const { name, min_spend, max_spend, bonus_percentage, has_free_product } = req.body;
        
        if (!name || !min_spend || !bonus_percentage) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const [result] = await db.query(
            'INSERT INTO loyalty_tiers (name, min_spend, max_spend, bonus_percentage, has_free_product) VALUES (?, ?, ?, ?, ?)',
            [name, min_spend, max_spend, bonus_percentage, has_free_product || false]
        );
        
        res.status(201).json({ 
            message: 'Loyalty tier created successfully',
            tierId: result.insertId
        });
    } catch (error) {
        console.error('Error creating loyalty tier:', error);
        res.status(500).json({ message: 'Error creating loyalty tier' });
    }
};
exports.getAllLoyaltyTiers = async (req, res) => {
    try {
        const [tiers] = await db.query('SELECT * FROM loyalty_tiers ORDER BY min_spend ASC');
        res.json(tiers);
    } catch (error) {
        console.error('Error getting loyalty tiers:', error);
        res.status(500).json({ message: 'Error getting loyalty tiers' });
    }
};
exports.updateLoyaltyTier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, min_spend, max_spend, bonus_percentage, has_free_product } = req.body;
        
        if (!name || !min_spend || !bonus_percentage) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        await db.query(
            'UPDATE loyalty_tiers SET name = ?, min_spend = ?, max_spend = ?, bonus_percentage = ?, has_free_product = ? WHERE id = ?',
            [name, min_spend, max_spend, bonus_percentage, has_free_product || false, id]
        );
        
        res.json({ message: 'Loyalty tier updated successfully' });
    } catch (error) {
        console.error('Error updating loyalty tier:', error);
        res.status(500).json({ message: 'Error updating loyalty tier' });
    }
};

exports.deleteLoyaltyTier = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM loyalty_tiers WHERE id = ?', [id]);
        res.json({ message: 'Loyalty tier deleted successfully' });
    } catch (error) {
        console.error('Error deleting loyalty tier:', error);
        res.status(500).json({ message: 'Error deleting loyalty tier' });
    }
};

exports.getLoyaltyStatistics = async (req, res) => {
    try {
        // Get active loyalty members
        const [activeMembers] = await db.query(
            'SELECT COUNT(*) as count FROM user_loyalty_status WHERE loyalty_tier_id IS NOT NULL AND tier_end_date >= CURDATE()'
        );
        
        // Get monthly loyalty points awarded
        const [monthlyPoints] = await db.query(
            `SELECT COALESCE(SUM(points), 0) as total 
             FROM user_rewards 
             WHERE description LIKE '%loyalty bonus%' 
             AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`
        );
        
        // Get tier distribution
        const [tierDistribution] = await db.query(
            `SELECT lt.name as tier_name, COUNT(uls.user_id) as user_count
             FROM loyalty_tiers lt
             LEFT JOIN user_loyalty_status uls ON lt.id = uls.loyalty_tier_id 
             AND uls.tier_end_date >= CURDATE()
             GROUP BY lt.id, lt.name
             ORDER BY lt.min_spend ASC`
        );
        
        res.json({
            activeMembers: activeMembers[0].count,
            monthlyLoyaltyPoints: monthlyPoints[0].total,
            tierDistribution
        });
    } catch (error) {
        console.error('Error getting loyalty statistics:', error);
        res.status(500).json({ message: 'Error getting loyalty statistics' });
    }
};
exports.getUserLoyaltyStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const loyaltyStatus = await Reward.getUserLoyaltyStatus(userId);
        res.json(loyaltyStatus);
    } catch (error) {
        console.error('Error getting user loyalty status:', error);
        res.status(500).json({ message: 'Error getting user loyalty status' });
    }
};
exports.getRewardsSettings = async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM rewards_settings ORDER BY id DESC LIMIT 1');
        
        if (settings.length === 0) {
            // Return default settings if none exist
            return res.json({
                id: null,
                points_per_amount: 1,
                amount_threshold: 100.00,
                point_value: 0.50,
                description: 'Customers earn 1 point per ₱100 spent • They can redeem points for discounts'
            });
        }
        
        res.json(settings[0]);
    } catch (error) {
        console.error('Error getting rewards settings:', error);
        res.status(500).json({ message: 'Error getting rewards settings' });
    }
};

// Update rewards settings
exports.updateRewardsSettings = async (req, res) => {
    try {
        const { points_per_amount, amount_threshold, point_value, description } = req.body;
        const adminId = req.user.id;
        
        if (!points_per_amount || !amount_threshold || !point_value) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Check if settings exist
        const [existingSettings] = await db.query('SELECT id FROM rewards_settings LIMIT 1');
        
        if (existingSettings.length === 0) {
            // Create new settings
            await db.query(
                'INSERT INTO rewards_settings (points_per_amount, amount_threshold, point_value, description, updated_by) VALUES (?, ?, ?, ?, ?)',
                [points_per_amount, amount_threshold, point_value, description, adminId]
            );
        } else {
            // Update existing settings
            await db.query(
                'UPDATE rewards_settings SET points_per_amount = ?, amount_threshold = ?, point_value = ?, description = ?, updated_by = ? WHERE id = ?',
                [points_per_amount, amount_threshold, point_value, description, adminId, existingSettings[0].id]
            );
        }
        
        res.json({ message: 'Rewards settings updated successfully' });
    } catch (error) {
        console.error('Error updating rewards settings:', error);
        res.status(500).json({ message: 'Error updating rewards settings' });
    }
};
exports.addAdmin = async (req, res) => {
    try {
        const { username, email, firstname, lastname, password } = req.body;

        // Validate required fields
        if (!username || !email || !firstname || !lastname || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check if username exists
        const [existingUsername] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const [result] = await db.query(
            'INSERT INTO users (username, firstname, lastname, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, firstname, lastname, email, hashedPassword, 'admin', true]
        );

        res.status(201).json({ 
            message: 'Admin account created successfully',
            adminId: result.insertId
        });

    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Error creating admin account' });
    }
};
exports.getDetailedReports = async (req, res) => {
  try {
    const { fromDate, toDate, category, type } = req.query;
    
    // Build date filter
    let dateFilter = '';
    if (fromDate && toDate) {
      dateFilter = `AND o.created_at BETWEEN '${fromDate} 00:00:00' AND '${toDate} 23:59:59'`;
    }
    
    // Build category filter
    let categoryFilter = '';
    if (category) {
      categoryFilter = `AND p.category = '${category}'`;
    }
    
    if (type === 'sales') {
      // Sales Summary
      const [salesSummary] = await db.execute(`
        SELECT 
          COUNT(DISTINCT o.order_id) as totalOrders,
          COALESCE(SUM(o.total_amount), 0) as totalSales,
          COALESCE(AVG(o.total_amount), 0) as avgOrderValue
        FROM orders o
        WHERE o.status = 'paid' ${dateFilter}
      `);
      
      // Sales by Product
      const [salesByProduct] = await db.execute(`
        SELECT 
          p.products_id as product_id,
          p.name as product_name,
          p.category,
          SUM(oi.quantity) as units_sold,
          SUM(oi.price * oi.quantity) as revenue,
          AVG(oi.price) as avg_price
        FROM products p
        JOIN order_items oi ON p.products_id = oi.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status = 'paid' ${dateFilter} ${categoryFilter}
        GROUP BY p.products_id, p.name, p.category
        ORDER BY revenue DESC
      `);
      
      // Daily Sales
      const [dailySales] = await db.execute(`
        SELECT 
          DATE(o.created_at) as date,
          COUNT(o.order_id) as orders,
          SUM(o.total_amount) as revenue,
          AVG(o.total_amount) as avg_order_value
        FROM orders o
        WHERE o.status = 'paid' ${dateFilter}
        GROUP BY DATE(o.created_at)
        ORDER BY date DESC
      `);
      
      res.json({
        summary: salesSummary[0],
        details: {
          byProduct: salesByProduct,
          daily: dailySales
        }
      });
      
    } else if (type === 'inventory') {
      // Inventory Summary
      const [inventorySummary] = await db.execute(`
        SELECT 
          COUNT(*) as totalProducts,
          SUM(stock_quantity * price) as totalValue,
          SUM(CASE WHEN stock_quantity <= 30 THEN 1 ELSE 0 END) as lowStockCount
        FROM products
        WHERE 1=1 ${categoryFilter}
      `);
      
      // Current Inventory
      const [currentInventory] = await db.execute(`
        SELECT 
          products_id as product_id,
          name as product_name,
          category,
          stock_quantity as stock,
          price,
          (stock_quantity * price) as total_value
        FROM products
        WHERE 1=1 ${categoryFilter}
        ORDER BY stock_quantity ASC
      `);
      
      // Stock Movement (simplified - you might want to track actual stock movements)
      const [stockMovement] = await db.execute(`
        SELECT 
          p.products_id as product_id,
          p.name as product_name,
          p.stock_quantity as current_stock,
          (p.stock_quantity + COALESCE(sold.total_sold, 0)) as opening_stock,
          COALESCE(sold.total_sold, 0) as units_sold,
          CASE 
            WHEN (p.stock_quantity + COALESCE(sold.total_sold, 0)) > 0 
            THEN ROUND((COALESCE(sold.total_sold, 0) / (p.stock_quantity + COALESCE(sold.total_sold, 0))) * 100, 2)
            ELSE 0 
          END as turnover_rate
        FROM products p
        LEFT JOIN (
          SELECT 
            oi.product_id,
            SUM(oi.quantity) as total_sold
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.order_id
          WHERE o.status = 'paid' ${dateFilter}
          GROUP BY oi.product_id
        ) sold ON p.products_id = sold.product_id
        WHERE 1=1 ${categoryFilter}
        ORDER BY turnover_rate DESC
      `);
      
      res.json({
        summary: inventorySummary[0],
        details: {
          current: currentInventory,
          movement: stockMovement
        }
      });
      
    } else if (type === 'combined') {
      // Combined Analysis
      const [combinedData] = await db.execute(`
        SELECT 
          p.products_id as product_id,
          p.name as product_name,
          p.category,
          COALESCE(sales.units_sold, 0) as units_sold,
          COALESCE(sales.revenue, 0) as revenue,
          p.stock_quantity as current_stock,
          (p.stock_quantity * p.price) as stock_value,
          CASE 
            WHEN (p.stock_quantity + COALESCE(sales.units_sold, 0)) > 0 
            THEN ROUND((COALESCE(sales.units_sold, 0) / (p.stock_quantity + COALESCE(sales.units_sold, 0))) * 100, 2)
            ELSE 0 
          END as turnover_rate,
          CASE 
            WHEN COALESCE(sales.units_sold, 0) >= 100 AND p.stock_quantity > 50 THEN 90
            WHEN COALESCE(sales.units_sold, 0) >= 50 AND p.stock_quantity > 20 THEN 75
            WHEN COALESCE(sales.units_sold, 0) >= 20 AND p.stock_quantity > 10 THEN 60
            WHEN COALESCE(sales.units_sold, 0) >= 10 THEN 45
            ELSE 30
          END as performance_score
        FROM products p
        LEFT JOIN (
          SELECT 
            oi.product_id,
            SUM(oi.quantity) as units_sold,
            SUM(oi.price * oi.quantity) as revenue
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.order_id
          WHERE o.status = 'paid' ${dateFilter}
          GROUP BY oi.product_id
        ) sales ON p.products_id = sales.product_id
        WHERE 1=1 ${categoryFilter}
        ORDER BY performance_score DESC, revenue DESC
      `);
      
      // Calculate summary metrics
      const totalRevenue = combinedData.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);
      const totalItems = combinedData.length;
      const revenuePerItem = totalItems > 0 ? totalRevenue / totalItems : 0;
      
      const totalUnits = combinedData.reduce((sum, item) => sum + parseInt(item.units_sold || 0), 0);
      const totalStock = combinedData.reduce((sum, item) => sum + parseInt(item.current_stock || 0), 0);
      const inventoryTurnover = totalStock > 0 ? (totalUnits / totalStock).toFixed(2) : 0;
      
      const avgPerformance = combinedData.reduce((sum, item) => sum + parseFloat(item.performance_score || 0), 0) / totalItems;
      
      res.json({
        summary: {
          revenuePerItem: revenuePerItem,
          inventoryTurnover: inventoryTurnover,
          profitMargin: Math.round(avgPerformance) // Simplified profit margin based on performance
        },
        details: {
          performance: combinedData
        }
      });
    }
    
  } catch (error) {
    console.error('Error fetching detailed reports:', error);
    res.status(500).json({ message: 'Error fetching detailed reports' });
  }
};
exports.getCategories = async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT DISTINCT category 
      FROM products 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `);
    
    res.json(categories.map(row => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Download reports as Excel
exports.downloadReports = async (req, res) => {
  try {
    const { fromDate, toDate, category, type } = req.query;
    
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'JM Garis Store';
    workbook.lastModifiedBy = 'Admin';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    if (type === 'sales' || type === 'combined') {
      // Create Sales worksheet
      const salesSheet = workbook.addWorksheet('Sales Report');
      
      // Set column widths
      salesSheet.columns = [
        { width: 25 }, // Product Name
        { width: 15 }, // Category
        { width: 12 }, // Units Sold
        { width: 15 }, // Revenue
        { width: 15 }  // Average Price
      ];
      
      // Add store header (merge cells for centered title)
      salesSheet.mergeCells('A1:E1');
      const titleCell = salesSheet.getCell('A1');
      titleCell.value = 'JM GARIS STORE';
      titleCell.font = { name: 'Arial', size: 18, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
      
      // Add report title
      salesSheet.mergeCells('A2:E2');
      const reportTitleCell = salesSheet.getCell('A2');
      reportTitleCell.value = 'SALES REPORT';
      reportTitleCell.font = { name: 'Arial', size: 14, bold: true };
      reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Add date range
      salesSheet.mergeCells('A3:E3');
      const dateRangeCell = salesSheet.getCell('A3');
      dateRangeCell.value = `Period: ${fromDate || 'All Time'} to ${toDate || new Date().toISOString().split('T')[0]}`;
      dateRangeCell.font = { name: 'Arial', size: 11 };
      dateRangeCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Add generation timestamp
      salesSheet.mergeCells('A4:E4');
      const timestampCell = salesSheet.getCell('A4');
      timestampCell.value = `Generated: ${new Date().toLocaleString('en-PH', { 
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      timestampCell.font = { name: 'Arial', size: 10, italic: true };
      timestampCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Add empty row
      salesSheet.addRow([]);
      
      // Add table headers
      const headerRow = salesSheet.addRow(['Product Name', 'Category', 'Units Sold', 'Revenue (₱)', 'Avg. Price (₱)']);
      headerRow.font = { name: 'Arial', size: 11, bold: true };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' }
      };
      
      // Add borders to header
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Get sales data
      let dateFilter = '';
      if (fromDate && toDate) {
        dateFilter = `AND DATE(o.created_at) BETWEEN '${fromDate}' AND '${toDate}'`;
      }
      
      const [salesData] = await db.execute(`
        SELECT 
          p.name as product_name,
          p.category,
          SUM(oi.quantity) as units_sold,
          SUM(oi.quantity * oi.price) as revenue,
          AVG(oi.price) as avg_price
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        JOIN products p ON oi.product_id = p.products_id
        WHERE o.status IN ('paid', 'paid using gcash') ${dateFilter}
        GROUP BY p.products_id, p.name, p.category
        ORDER BY revenue DESC
      `);
      
      // Add data rows
      salesData.forEach((row, index) => {
        const dataRow = salesSheet.addRow([
          row.product_name,
          row.category,
          parseInt(row.units_sold),
          parseFloat(row.revenue || 0),
          parseFloat(row.avg_price || 0)
        ]);
        
        // Format data cells
        dataRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        dataRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
        dataRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
        
        // Format currency cells
        dataRow.getCell(4).numFmt = '#,##0.00';
        dataRow.getCell(5).numFmt = '#,##0.00';
        
        // Add borders
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // Alternate row colors
        if (index % 2 === 1) {
          dataRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
            };
          });
        }
      });
      
      // Add summary section
      const currentRow = salesSheet.rowCount + 2;
      salesSheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const summaryHeaderCell = salesSheet.getCell(`A${currentRow}`);
      summaryHeaderCell.value = 'SUMMARY';
      summaryHeaderCell.font = { name: 'Arial', size: 12, bold: true };
      summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1E7DD' }
      };
      
      // Calculate totals
      const totalRevenue = salesData.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
      const totalUnits = salesData.reduce((sum, row) => sum + parseInt(row.units_sold || 0), 0);
      
      salesSheet.addRow(['Total Products:', salesData.length, '', '', '']);
      salesSheet.addRow(['Total Units Sold:', totalUnits, '', '', '']);
      salesSheet.addRow(['Total Revenue:', '', '', totalRevenue, '']);
      
      // Format summary rows
      for (let i = currentRow + 1; i <= currentRow + 3; i++) {
        const row = salesSheet.getRow(i);
        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { bold: true };
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(4).font = { bold: true };
      }
      
      // Add footer with signature
      const footerRow = salesSheet.rowCount + 3;
      salesSheet.mergeCells(`A${footerRow}:E${footerRow}`);
      salesSheet.mergeCells(`A${footerRow + 2}:E${footerRow + 2}`);
      salesSheet.mergeCells(`A${footerRow + 4}:E${footerRow + 4}`);
      salesSheet.mergeCells(`A${footerRow + 5}:E${footerRow + 5}`);
      
      // Prepared by
      const preparedByCell = salesSheet.getCell(`A${footerRow}`);
      preparedByCell.value = 'Prepared by:';
      preparedByCell.font = { name: 'Arial', size: 10 };
      preparedByCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Signature line
      const signatureCell = salesSheet.getCell(`A${footerRow + 2}`);
      signatureCell.value = '________________________';
      signatureCell.font = { name: 'Arial', size: 10 };
      signatureCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Printed name
      const nameCell = salesSheet.getCell(`A${footerRow + 4}`);
      nameCell.value = 'Admin Officer';
      nameCell.font = { name: 'Arial', size: 10, bold: true };
      nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Title
      const titleFooterCell = salesSheet.getCell(`A${footerRow + 5}`);
      titleFooterCell.value = 'JM Garis Store';
      titleFooterCell.font = { name: 'Arial', size: 9, italic: true };
      titleFooterCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Set row heights
      salesSheet.getRow(1).height = 25;
      salesSheet.getRow(2).height = 20;
    }
    
    if (type === 'inventory' || type === 'combined') {
      // Create Inventory worksheet
      const inventorySheet = workbook.addWorksheet('Inventory Report');
      
      // Set column widths
      inventorySheet.columns = [
        { width: 25 }, // Product Name
        { width: 15 }, // Category
        { width: 15 }, // Current Stock
        { width: 15 }, // Unit Price
        { width: 15 }, // Total Value
        { width: 12 }  // Status
      ];
      
      // Add store header
      inventorySheet.mergeCells('A1:F1');
      const titleCell = inventorySheet.getCell('A1');
      titleCell.value = 'JM GARIS STORE';
      titleCell.font = { name: 'Arial', size: 18, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
      
      // Add report title
      inventorySheet.mergeCells('A2:F2');
      const reportTitleCell = inventorySheet.getCell('A2');
      reportTitleCell.value = 'INVENTORY REPORT';
      reportTitleCell.font = { name: 'Arial', size: 14, bold: true };
      reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Add generation timestamp
      inventorySheet.mergeCells('A3:F3');
      const timestampCell = inventorySheet.getCell('A3');
      timestampCell.value = `Generated: ${new Date().toLocaleString('en-PH', { 
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      timestampCell.font = { name: 'Arial', size: 10, italic: true };
      timestampCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Add empty row
      inventorySheet.addRow([]);
      
      // Add table headers
      const headerRow = inventorySheet.addRow(['Product Name', 'Category', 'Current Stock', 'Unit Price (₱)', 'Total Value (₱)', 'Status']);
      headerRow.font = { name: 'Arial', size: 11, bold: true };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' }
      };
      
      // Add borders to header
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Get inventory data
      let categoryFilter = '';
      if (category) {
        categoryFilter = `WHERE category = '${category}'`;
      }
      
      const [inventoryData] = await db.execute(`
        SELECT 
          name as product_name,
          category,
          stock_quantity as stock,
          price,
          (stock_quantity * price) as total_value
        FROM products ${categoryFilter}
        ORDER BY stock_quantity ASC
      `);
      
      // Add data rows
      inventoryData.forEach((row, index) => {
        let status = 'Normal';
        if (row.stock <= 10) status = 'Critical';
        else if (row.stock <= 30) status = 'Low';
        
        const dataRow = inventorySheet.addRow([
          row.product_name,
          row.category,
          parseInt(row.stock),
          parseFloat(row.price || 0),
          parseFloat(row.total_value || 0),
          status
        ]);
        
        // Format data cells
        dataRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        dataRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
        dataRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
        dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Format currency cells
        dataRow.getCell(4).numFmt = '#,##0.00';
        dataRow.getCell(5).numFmt = '#,##0.00';
        
        // Color code status
        const statusCell = dataRow.getCell(6);
        if (status === 'Critical') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE6E6' }
          };
          statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
        } else if (status === 'Low') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF3E0' }
          };
          statusCell.font = { color: { argb: 'FFEA580C' }, bold: true };
        } else {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0FDF4' }
          };
          statusCell.font = { color: { argb: 'FF059669' }, bold: true };
        }
        
        // Add borders
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // Alternate row colors
        if (index % 2 === 1) {
          dataRow.eachCell((cell, colNumber) => {
            if (colNumber !== 6) { // Don't override status cell color
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8F9FA' }
              };
            }
          });
        }
      });
      
      // Add summary section
      const currentRow = inventorySheet.rowCount + 2;
      inventorySheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const summaryHeaderCell = inventorySheet.getCell(`A${currentRow}`);
      summaryHeaderCell.value = 'INVENTORY SUMMARY';
      summaryHeaderCell.font = { name: 'Arial', size: 12, bold: true };
      summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1E7DD' }
      };
      
      // Calculate totals
      const totalValue = inventoryData.reduce((sum, row) => sum + parseFloat(row.total_value || 0), 0);
      const lowStockCount = inventoryData.filter(row => row.stock <= 30).length;
      const criticalStockCount = inventoryData.filter(row => row.stock <= 10).length;
      
      inventorySheet.addRow(['Total Products:', inventoryData.length, '', '', '', '']);
      inventorySheet.addRow(['Total Inventory Value:', '', '', '', totalValue, '']);
      inventorySheet.addRow(['Low Stock Items (≤30):', lowStockCount, '', '', '', '']);
      inventorySheet.addRow(['Critical Stock Items (≤10):', criticalStockCount, '', '', '', '']);
      
      // Format summary rows
      for (let i = currentRow + 1; i <= currentRow + 4; i++) {
        const row = inventorySheet.getRow(i);
        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { bold: true };
        row.getCell(5).numFmt = '#,##0.00';
        row.getCell(5).font = { bold: true };
      }
      
      // Add footer with signature
      const footerRow = inventorySheet.rowCount + 3;
      inventorySheet.mergeCells(`A${footerRow}:F${footerRow}`);
      inventorySheet.mergeCells(`A${footerRow + 2}:F${footerRow + 2}`);
      inventorySheet.mergeCells(`A${footerRow + 4}:F${footerRow + 4}`);
      inventorySheet.mergeCells(`A${footerRow + 5}:F${footerRow + 5}`);
      
      // Prepared by
      const preparedByCell = inventorySheet.getCell(`A${footerRow}`);
      preparedByCell.value = 'Prepared by:';
      preparedByCell.font = { name: 'Arial', size: 10 };
      preparedByCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Signature line
      const signatureCell = inventorySheet.getCell(`A${footerRow + 2}`);
      signatureCell.value = '________________________';
      signatureCell.font = { name: 'Arial', size: 10 };
      signatureCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Printed name
      const nameCell = inventorySheet.getCell(`A${footerRow + 4}`);
      nameCell.value = 'Admin Officer';
      nameCell.font = { name: 'Arial', size: 10, bold: true };
      nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Title
      const titleFooterCell = inventorySheet.getCell(`A${footerRow + 5}`);
      titleFooterCell.value = 'JM Garis Store';
      titleFooterCell.font = { name: 'Arial', size: 9, italic: true };
      titleFooterCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Set row heights
      inventorySheet.getRow(1).height = 25;
      inventorySheet.getRow(2).height = 20;
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.xlsx"`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ message: 'Error generating Excel report' });
  }
};
exports.fixLoyaltyData = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get actual total spending from orders for this month
        const [orders] = await db.query(`
            SELECT COALESCE(SUM(total_amount), 0) as actual_total
            FROM orders 
            WHERE user_id = ? 
            AND status IN ('paid', 'paid using gcash')
            AND MONTH(created_at) = MONTH(NOW())
            AND YEAR(created_at) = YEAR(NOW())
        `, [userId]);

        const actualSpend = parseFloat(orders[0].actual_total);

        // Update user loyalty status with correct amount
        await db.query(`
            UPDATE user_loyalty_status 
            SET current_month_spend = ?
            WHERE user_id = ?
        `, [actualSpend, userId]);

        // Recalculate tier using the imported Reward model
        const Reward = require('../models/rewardModel');
        const connection = await db.getConnection();
        try {
            await Reward.checkAndUpdateLoyaltyTier(userId, connection);
        } finally {
            connection.release();
        }

        res.json({ 
            message: 'Loyalty data fixed successfully',
            actualSpend: actualSpend 
        });
    } catch (error) {
        console.error('Error fixing loyalty data:', error);
        res.status(500).json({ message: 'Error fixing loyalty data' });
    }
};
exports.debugLoyaltyData = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get actual orders for this month
        const [orders] = await db.query(`
            SELECT 
                order_id,
                total_amount,
                created_at,
                status
            FROM orders 
            WHERE user_id = ? 
            AND MONTH(created_at) = MONTH(NOW())
            AND YEAR(created_at) = YEAR(NOW())
            ORDER BY created_at DESC
        `, [userId]);

        // Get current loyalty status
        const [loyaltyStatus] = await db.query(`
            SELECT uls.*, lt.name as tier_name 
            FROM user_loyalty_status uls
            LEFT JOIN loyalty_tiers lt ON uls.loyalty_tier_id = lt.id
            WHERE uls.user_id = ?
        `, [userId]);

        // Calculate actual total
        const actualTotal = orders
            .filter(order => ['paid', 'paid using gcash'].includes(order.status))
            .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

        res.json({
            userId: userId,
            actualMonthlyTotal: actualTotal,
            currentLoyaltyData: loyaltyStatus[0] || null,
            ordersThisMonth: orders,
            loyaltyTiers: await db.query('SELECT * FROM loyalty_tiers ORDER BY min_spend ASC')
        });
    } catch (error) {
        console.error('Error debugging loyalty data:', error);
        res.status(500).json({ message: 'Error debugging loyalty data' });
    }
};
exports.downloadLowStockReport = async (req, res) => {
    try {
        const { filter, search } = req.query;
        
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        
        // Set workbook properties
        workbook.creator = 'JM Garis Store';
        workbook.lastModifiedBy = 'Admin';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        // Create Low Stock worksheet
        const lowStockSheet = workbook.addWorksheet('Low Stock Report');
        
        // Set column widths
        lowStockSheet.columns = [
            { width: 35 }, // Product Name
            { width: 15 }, // Type
            { width: 15 }, // Stock Left
            { width: 15 }, // Unit Price
            { width: 20 }, // Category
            { width: 15 }  // Status
        ];
        
        // Add store header
        lowStockSheet.mergeCells('A1:F1');
        const titleCell = lowStockSheet.getCell('A1');
        titleCell.value = 'JM GARIS STORE';
        titleCell.font = { name: 'Arial', size: 18, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
        
        // Add report title
        lowStockSheet.mergeCells('A2:F2');
        const reportTitleCell = lowStockSheet.getCell('A2');
        reportTitleCell.value = 'LOW STOCK ALERT REPORT';
        reportTitleCell.font = { name: 'Arial', size: 14, bold: true };
        reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add generation timestamp
        lowStockSheet.mergeCells('A3:F3');
        const timestampCell = lowStockSheet.getCell('A3');
        timestampCell.value = `Generated on: ${new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
        timestampCell.font = { name: 'Arial', size: 10, italic: true };
        timestampCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add filter information if any
        if (filter && filter !== 'all') {
            lowStockSheet.mergeCells('A4:F4');
            const filterCell = lowStockSheet.getCell('A4');
            let filterText = '';
            switch(filter) {
                case 'critical': filterText = 'Critical Stock (≤ 10 units)'; break;
                case 'warning': filterText = 'Warning Stock (≤ 20 units)'; break;
                case 'low': filterText = 'Low Stock (≤ 30 units)'; break;
            }
            filterCell.value = `Filter: ${filterText}`;
            filterCell.font = { name: 'Arial', size: 10, italic: true };
            filterCell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        // Add search information if any
        if (search) {
            const searchRowIndex = filter && filter !== 'all' ? 5 : 4;
            lowStockSheet.mergeCells(`A${searchRowIndex}:F${searchRowIndex}`);
            const searchCell = lowStockSheet.getCell(`A${searchRowIndex}`);
            searchCell.value = `Search: "${search}"`;
            searchCell.font = { name: 'Arial', size: 10, italic: true };
            searchCell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        // Add headers
        const headerRowIndex = 6 + (filter && filter !== 'all' ? 1 : 0) + (search ? 1 : 0);
        const headerRow = lowStockSheet.addRow(['Product Name', 'Type', 'Stock Left', 'Unit Price (₱)', 'Category', 'Status']);
        headerRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 11, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE7E6E6' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        // Get low stock data
        const lowStockItems = await Admin.getLowStockItems();
        
        // Apply filters similar to frontend
        let filteredItems = lowStockItems;
        
        if (search) {
            filteredItems = filteredItems.filter(item => {
                if (item.type === 'choice') {
                    return item.product_name.toLowerCase().includes(search.toLowerCase()) ||
                           item.choice_name.toLowerCase().includes(search.toLowerCase());
                } else {
                    return item.name.toLowerCase().includes(search.toLowerCase());
                }
            });
        }
        
        if (filter && filter !== 'all') {
            filteredItems = filteredItems.filter(item => {
                switch(filter) {
                    case 'critical': return item.stock <= 10;
                    case 'warning': return item.stock <= 20;
                    case 'low': return item.stock <= 30;
                    default: return true;
                }
            });
        }
        
        // Add data rows
        filteredItems.forEach((item, index) => {
            const productName = item.type === 'choice' 
                ? `${item.product_name} (${item.choice_name})` 
                : item.name;
            
            const productType = item.type === 'choice' ? 'Variant' : 'Product';
            
            let status = 'Normal';
            if (item.stock <= 10) status = 'Critical';
            else if (item.stock <= 20) status = 'Warning';
            else if (item.stock <= 30) status = 'Low';
            
            const dataRow = lowStockSheet.addRow([
                productName,
                productType,
                parseInt(item.stock),
                parseFloat(item.price || 0),
                item.category,
                status
            ]);
            
            // Format data cells
            dataRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
            dataRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
            dataRow.getCell(4).numFmt = '#,##0.00';
            dataRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Add borders
            dataRow.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            
            // Color code status column
            const statusCell = dataRow.getCell(6);
            switch(status) {
                case 'Critical':
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFE2E2' }
                    };
                    statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
                    break;
                case 'Warning':
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFEF3C7' }
                    };
                    statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
                    break;
                case 'Low':
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE3F5E9' }
                    };
                    statusCell.font = { color: { argb: 'FF0F7840' }, bold: true };
                    break;
            }
            
            // Alternate row colors
            if (index % 2 === 1) {
                dataRow.eachCell((cell, colNumber) => {
                    if (colNumber !== 6) { // Don't override status cell color
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF8F9FA' }
                        };
                    }
                });
            }
        });
        
        // Add summary section
        const currentRow = lowStockSheet.rowCount + 2;
        lowStockSheet.mergeCells(`A${currentRow}:F${currentRow}`);
        const summaryHeaderCell = lowStockSheet.getCell(`A${currentRow}`);
        summaryHeaderCell.value = 'LOW STOCK SUMMARY';
        summaryHeaderCell.font = { name: 'Arial', size: 12, bold: true };
        summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        summaryHeaderCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE2E2' }
        };
        
        // Calculate summary statistics
        const criticalCount = filteredItems.filter(item => item.stock <= 10).length;
        const warningCount = filteredItems.filter(item => item.stock <= 20).length;
        const lowCount = filteredItems.filter(item => item.stock <= 30).length;
        const totalValue = filteredItems.reduce((sum, item) => sum + (parseFloat(item.stock) * parseFloat(item.price || 0)), 0);
        
        lowStockSheet.addRow(['Total Low Stock Items:', filteredItems.length, '', '', '', '']);
        lowStockSheet.addRow(['Critical Stock (≤10):', criticalCount, '', '', '', '']);
        lowStockSheet.addRow(['Warning Stock (≤20):', warningCount, '', '', '', '']);
        lowStockSheet.addRow(['Low Stock (≤30):', lowCount, '', '', '', '']);
        lowStockSheet.addRow(['Total Stock Value:', '', '', totalValue, '', '']);
        
        // Format summary rows
        for (let i = currentRow + 1; i <= currentRow + 5; i++) {
            const row = lowStockSheet.getRow(i);
            row.getCell(1).font = { bold: true };
            row.getCell(2).font = { bold: true };
            if (i === currentRow + 5) { // Total value row
                row.getCell(4).numFmt = '#,##0.00';
                row.getCell(4).font = { bold: true };
            }
        }
        
        // Add footer with signature
        const footerRow = lowStockSheet.rowCount + 3;
        lowStockSheet.mergeCells(`A${footerRow}:F${footerRow}`);
        lowStockSheet.mergeCells(`A${footerRow + 2}:F${footerRow + 2}`);
        lowStockSheet.mergeCells(`A${footerRow + 4}:F${footerRow + 4}`);
        lowStockSheet.mergeCells(`A${footerRow + 5}:F${footerRow + 5}`);
        
        // Signature line
        const signatureCell = lowStockSheet.getCell(`A${footerRow + 2}`);
        signatureCell.value = '________________________';
        signatureCell.font = { name: 'Arial', size: 10 };
        signatureCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Printed name
        const nameCell = lowStockSheet.getCell(`A${footerRow + 4}`);
        nameCell.value = 'Signature Over Printed Name';
        nameCell.font = { name: 'Arial', size: 10, bold: true };
        nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Store name
        const storeNameCell = lowStockSheet.getCell(`A${footerRow + 5}`);
        storeNameCell.value = 'JM Garis Store';
        storeNameCell.font = { name: 'Arial', size: 9, italic: true };
        storeNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Set row heights
        lowStockSheet.getRow(1).height = 25;
        lowStockSheet.getRow(2).height = 20;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=low-stock-report-${formattedDate}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error generating low stock report:', error);
        res.status(500).json({ message: 'Error generating low stock report' });
    }
};

// Staff Analytics Functions
exports.getStaffAnalyticsSummary = async (req, res) => {
  try {
    const period = req.query.period || 'week';
    
    // Get time period condition
    let timePeriod;
    switch(period) {
      case 'day':
        timePeriod = 'DATE(o.created_at) = CURRENT_DATE()';
        break;
      case 'week':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        break;
      case 'month':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)';
        break;
      case 'quarter':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)';
        break;
      case 'year':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)';
        break;
      default:
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
    }

    // Get total staff count
    const [staffCount] = await db.execute(`
      SELECT 
        COUNT(*) as totalStaff,
        COUNT(*) as activeStaff
      FROM users
      WHERE role = 'staff'
    `);

    // Get total sales and orders from staff
    const [salesData] = await db.execute(`
      SELECT 
        COUNT(DISTINCT o.order_id) as totalOrdersAccepted,
        COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.order_id END) as totalSales,
        COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total_amount END), 0) as totalSalesAmount
      FROM orders o
      INNER JOIN users u ON o.accepted_by = u.id
      WHERE u.role = 'staff' AND ${timePeriod}
    `);

    // Calculate average performance
    const totalStaff = staffCount[0].totalStaff || 1;
    const totalOrdersAccepted = salesData[0].totalOrdersAccepted || 0;
    const avgPerformance = Math.round((totalOrdersAccepted / totalStaff) * 10) / 10;

    res.json({
      totalStaff: staffCount[0].totalStaff || 0,
      activeStaff: staffCount[0].activeStaff || 0,
      totalSales: salesData[0].totalSales || 0,
      totalOrdersAccepted: totalOrdersAccepted,
      avgPerformance: avgPerformance || 0
    });

  } catch (error) {
    console.error('Error getting staff analytics summary:', error);
    res.status(500).json({ message: 'Error getting staff analytics summary' });
  }
};

exports.getStaffPerformanceData = async (req, res) => {
  try {
    const period = req.query.period || 'week';
    
    // Get time period condition
    let timePeriod;
    switch(period) {
      case 'day':
        timePeriod = 'DATE(o.created_at) = CURRENT_DATE()';
        break;
      case 'week':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        break;
      case 'month':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)';
        break;
      case 'quarter':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)';
        break;
      case 'year':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)';
        break;
      default:
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
    }

    // Get staff performance data
    const [staffPerformance] = await db.execute(`
      SELECT 
        u.id as staff_id,
        u.username,
        u.created_at as last_active,
        COUNT(DISTINCT o.order_id) as orders_accepted,
        COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.order_id END) as sales_count,
        COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total_amount END), 0) as total_sales,
        ROUND(
          (COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.order_id END) * 100.0) / 
          NULLIF(COUNT(DISTINCT o.order_id), 0), 1
        ) as performance_score
      FROM users u
      LEFT JOIN orders o ON u.id = o.accepted_by AND ${timePeriod}
      WHERE u.role = 'staff'
      GROUP BY u.id, u.username, u.created_at
      ORDER BY performance_score DESC, total_sales DESC
    `);

    res.json(staffPerformance);

  } catch (error) {
    console.error('Error getting staff performance data:', error);
    res.status(500).json({ message: 'Error getting staff performance data' });
  }
};

exports.getStaffSalesChart = async (req, res) => {
  try {
    const period = req.query.period || 'week';
    
    // Get time period and grouping
    let timePeriod, dateFormat, labelFormat;
    switch(period) {
      case 'day':
        timePeriod = 'DATE(o.created_at) = CURRENT_DATE()';
        dateFormat = '%H:00';
        labelFormat = 'hour';
        break;
      case 'week':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        dateFormat = '%Y-%m-%d';
        labelFormat = 'day';
        break;
      case 'month':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)';
        dateFormat = '%Y-%m-%d';
        labelFormat = 'day';
        break;
      case 'quarter':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)';
        dateFormat = '%Y-%u';
        labelFormat = 'week';
        break;
      case 'year':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)';
        dateFormat = '%Y-%m';
        labelFormat = 'month';
        break;
      default:
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        dateFormat = '%Y-%m-%d';
        labelFormat = 'day';
    }

    // Get top 5 staff for the chart
    const [topStaff] = await db.execute(`
      SELECT 
        u.id,
        u.username,
        COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total_amount END), 0) as total_sales
      FROM users u
      LEFT JOIN orders o ON u.id = o.accepted_by AND ${timePeriod}
      WHERE u.role = 'staff'
      GROUP BY u.id, u.username
      ORDER BY total_sales DESC
      LIMIT 5
    `);

    // Get sales data by staff and time period
    const staffIds = topStaff.map(staff => staff.id).join(',');
    if (staffIds) {
      const [salesData] = await db.execute(`
        SELECT 
          u.username,
          DATE_FORMAT(o.created_at, '${dateFormat}') as time_period,
          COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total_amount END), 0) as sales
        FROM users u
        LEFT JOIN orders o ON u.id = o.accepted_by AND ${timePeriod}
        WHERE u.id IN (${staffIds})
        GROUP BY u.username, time_period
        ORDER BY time_period, u.username
      `);

      // Format data for Chart.js
      const labels = [...new Set(salesData.map(item => item.time_period))].sort();
      const datasets = topStaff.map((staff, index) => {
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
        const staffData = labels.map(label => {
          const dataPoint = salesData.find(item => 
            item.username === staff.username && item.time_period === label
          );
          return dataPoint ? parseFloat(dataPoint.sales) : 0;
        });

        return {
          label: staff.username,
          data: staffData,
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length],
          borderWidth: 2
        };
      });

      res.json({ labels, datasets });
    } else {
      res.json({ labels: [], datasets: [] });
    }

  } catch (error) {
    console.error('Error getting staff sales chart data:', error);
    res.status(500).json({ message: 'Error getting staff sales chart data' });
  }
};

exports.getStaffOrdersChart = async (req, res) => {
  try {
    const period = req.query.period || 'week';
    
    // Get time period condition
    let timePeriod;
    switch(period) {
      case 'day':
        timePeriod = 'DATE(o.created_at) = CURRENT_DATE()';
        break;
      case 'week':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
        break;
      case 'month':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)';
        break;
      case 'quarter':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)';
        break;
      case 'year':
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)';
        break;
      default:
        timePeriod = 'o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)';
    }

    // Get orders accepted by staff
    const [ordersData] = await db.execute(`
      SELECT 
        u.username,
        COUNT(DISTINCT o.order_id) as orders_accepted
      FROM users u
      LEFT JOIN orders o ON u.id = o.accepted_by AND ${timePeriod}
      WHERE u.role = 'staff'
      GROUP BY u.id, u.username
      HAVING orders_accepted > 0
      ORDER BY orders_accepted DESC
      LIMIT 8
    `);

    // Format data for Chart.js doughnut chart
    const labels = ordersData.map(item => item.username);
    const data = ordersData.map(item => item.orders_accepted);
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316'
    ];

    const datasets = [{
      data: data,
      backgroundColor: colors.slice(0, data.length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }];

    res.json({ labels, datasets });

  } catch (error) {
    console.error('Error getting staff orders chart data:', error);
    res.status(500).json({ message: 'Error getting staff orders chart data' });
  }
};