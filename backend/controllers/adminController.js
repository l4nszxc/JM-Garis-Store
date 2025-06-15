const db = require('../config/db');
const Admin = require('../models/adminModel');
const Staff = require('../models/staffModel');
const User = require('../models/userModel');
const Reward = require('../models/rewardModel');
const emailService = require('../services/emailService');
const forecastService = require('../services/forecastService');
const jwt = require('jsonwebtoken');

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
        const { cashAmount, changeAmount } = req.body;
        
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

        // Update order status
        await db.execute(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            ['paid', orderId]
        );

        // Email sending is removed

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