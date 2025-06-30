const db = require('../config/db');
const Admin = require('../models/adminModel');
const Staff = require('../models/staffModel');
const User = require('../models/userModel');
const Reward = require('../models/rewardModel');
const emailService = require('../services/emailService');
const forecastService = require('../services/forecastService');
const nodemailer = require('nodemailer'); 
const jwt = require('jsonwebtoken');

async function sendEmailReceipt(order, settings) {
    try {
        // Create transporter (configure with your email service)
        const transporter = nodemailer.createTransport({
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
        const orders = await Admin.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderDetails = await Admin.getOrderDetails(orderId);
        
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
            `SELECT o.*, u.email, u.username as customer_name,
                    s.username as staff_name,
                    ad.amount as discount_amount,
                    (SELECT SUM(oi.price * oi.quantity) 
                     FROM order_items oi 
                     WHERE oi.order_id = o.order_id) as subtotal
             FROM orders o
             JOIN users u ON o.user_id = u.id
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