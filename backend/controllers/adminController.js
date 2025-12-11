const db = require('../config/db');
const Admin = require('../models/adminModel');
const Staff = require('../models/staffModel');
const User = require('../models/userModel');
const Reward = require('../models/rewardModel');
const forecastService = require('../services/forecastService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs'); 

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
      LEFT JOIN orders o ON u.id = o.accepted_by AND (${timePeriod})
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
        const { cashAmount, changeAmount } = req.body;
        
        // Get order details before updating status
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
        const { type = 'demand', days = 30, method = 'auto', quarter } = req.query;
        
        // Enhanced validation
        if (!['sales', 'demand', 'inventory'].includes(type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid forecast type. Must be "sales", "demand", or "inventory"'
            });
        }
        
        const parsedDays = parseInt(days);
        if (isNaN(parsedDays) || parsedDays < 7 || parsedDays > 365) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid forecast period. Must be between 7 and 365 days'
            });
        }

        // Validate method
        if (!['auto', 'prophet', 'ml', 'simple'].includes(method)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid method. Must be "auto", "prophet", "ml", or "simple"'
            });
        }

        // Validate quarter if provided
        if (quarter && !['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid quarter. Must be Q1, Q2, Q3, or Q4'
            });
        }
        
        console.log(`Generating ${type} forecast for ${parsedDays} days using ${method} method`);
        
        // Always use the enhanced Python service for better accuracy
        const { spawn } = require('child_process');
        const path = require('path');
        const options = JSON.stringify({
            type,
            days: parsedDays,
            method,
            quarter
        });
        
        // Use Python from virtual environment if available, otherwise system Python
        const pythonPath = process.platform === 'win32' 
            ? path.join(__dirname, '..', 'forecast_env', 'Scripts', 'python.exe')
            : path.join(__dirname, '..', 'forecast_env', 'bin', 'python');
        
        const pythonCommand = require('fs').existsSync(pythonPath) ? pythonPath : 'python';
        
        // Use enhanced forecast service
        const pythonProcess = spawn(pythonCommand, [
            path.join(__dirname, '..', 'services', 'forecastService.py'),
            options
        ], {
            cwd: path.join(__dirname, '..')
        });
        
        let result = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error('Enhanced forecasting service error:', errorOutput);
                
                // Fallback to simple JavaScript method
                console.log('Falling back to simple forecasting method...');
                const fallbackForecast = await generateSimpleFallbackForecast(type, parsedDays);
                return res.json(fallbackForecast);
            }
            
            try {
                const forecasts = JSON.parse(result);
                
                // Log successful forecast generation
                console.log(`Successfully generated forecasts for ${Object.keys(forecasts.data || {}).length} products`);
                
                return res.json(forecasts);
            } catch (e) {
                console.error('Error parsing enhanced forecast results:', e);
                console.error('Raw result:', result.substring(0, 500));
                
                // Fallback to simple method
                const fallbackForecast = await generateSimpleFallbackForecast(type, parsedDays);
                return res.json(fallbackForecast);
            }
        });
        
    } catch (error) {
        console.error('Error in enhanced forecasting controller:', error);
        
        // Fallback to simple forecast
        const fallbackForecast = await generateSimpleFallbackForecast(req.query.type || 'demand', parseInt(req.query.days) || 30);
        res.json(fallbackForecast);
    }
};

// Fallback function for simple forecasting when enhanced service fails
async function generateSimpleFallbackForecast(type, days) {
    try {
        // Get actual sales data from database
        const [salesData] = await db.execute(`
            SELECT 
                DATE(o.created_at) as date,
                p.products_id,
                p.name as product_name,
                p.image,
                p.price,
                p.category,
                p.stock_quantity,
                SUM(oi.quantity) as daily_sales,
                SUM(oi.price * oi.quantity) as daily_revenue
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.products_id
            WHERE o.status = 'paid'
            AND o.created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
            GROUP BY DATE(o.created_at), p.products_id, p.name, p.image, p.price, p.category, p.stock_quantity
            HAVING SUM(oi.quantity) > 0
            ORDER BY date
        `);

        if (!salesData.length) {
            // No sales data available
            return {
                status: 'error',
                message: 'No sales data available for forecasting. Please ensure there are completed orders in the system.',
                data: {},
                summary: {
                    total_products_analyzed: 0,
                    forecasts_generated: 0,
                    forecast_period_days: days,
                    method_used: 'fallback',
                    data_period_days: 0
                }
            };
        }

        // Group by product
        const productSales = {};
        salesData.forEach(record => {
            if (!productSales[record.products_id]) {
                productSales[record.products_id] = {
                    id: record.products_id,
                    name: record.product_name,
                    image: record.image,
                    price: parseFloat(record.price),
                    category: record.category,
                    current_stock: record.stock_quantity,
                    dates: [],
                    sales: [],
                    revenue: [],
                    total_sales: 0,
                    total_revenue: 0
                };
            }
            
            productSales[record.products_id].dates.push(new Date(record.date));
            productSales[record.products_id].sales.push(Number(record.daily_sales));
            productSales[record.products_id].revenue.push(Number(record.daily_revenue));
            productSales[record.products_id].total_sales += Number(record.daily_sales);
            productSales[record.products_id].total_revenue += Number(record.daily_revenue);
        });

        // Get top 5 products by sales
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.total_sales - a.total_sales)
            .slice(0, 5);

        const forecasts = {};
        
        topProducts.forEach(product => {
            const avgDailySales = product.total_sales / product.dates.length;
            const currentDate = new Date();
            const forecastData = [];
            
            // Simple forecast: use average with weekend/weekday pattern
            for (let i = 1; i <= days; i++) {
                const futureDate = new Date(currentDate);
                futureDate.setDate(currentDate.getDate() + i);
                
                const isWeekend = futureDate.getDay() === 0 || futureDate.getDay() === 6;
                const weekendMultiplier = isWeekend ? 1.2 : 1.0;
                const forecast = avgDailySales * weekendMultiplier;
                
                forecastData.push({
                    ds: futureDate.toISOString().split('T')[0],
                    yhat: Math.round(forecast * 100) / 100,
                    yhat_lower: Math.round(forecast * 0.8 * 100) / 100,
                    yhat_upper: Math.round(forecast * 1.2 * 100) / 100
                });
            }

            const totalForecastDemand = forecastData.reduce((sum, f) => sum + f.yhat, 0);
            const peakDemand = Math.max(...forecastData.map(f => f.yhat));
            const daysRemaining = Math.floor(product.current_stock / avgDailySales);
            const recommendedOrderQty = Math.ceil(Math.max(0, totalForecastDemand - product.current_stock));

            forecasts[product.id] = {
                id: product.id,
                name: product.name,
                image: product.image,
                price: product.price,
                category: product.category,
                current_stock: product.current_stock,
                stock_status: daysRemaining < 7 ? 'low' : daysRemaining < 14 ? 'normal' : 'good',
                days_remaining: Math.max(0, daysRemaining),
                reorder_point: Math.ceil(avgDailySales * 7),
                recommended_order_qty: recommendedOrderQty,
                forecast_data: forecastData,
                model_accuracy: 65.0,
                model_type: 'Simple Moving Average',
                metrics: {
                    rmse: avgDailySales * 0.3,
                    mae: avgDailySales * 0.25,
                    mape: 25.0
                },
                seasonal_insights: {
                    weekly_peak: 'Weekend',
                    trend_direction: 'stable',
                    seasonality_impact: 'low'
                },
                training_size: product.dates.length,
                avg_daily_demand: Math.round(avgDailySales * 100) / 100,
                total_forecast_demand: Math.round(totalForecastDemand * 100) / 100,
                peak_demand: Math.round(peakDemand * 100) / 100,
                recommendations: [
                    '⚠️ Using simplified forecasting (Python service unavailable)',
                    daysRemaining < 7 ? '🔴 Stock critically low - reorder immediately' : 
                    daysRemaining < 14 ? '🟡 Stock running low - consider reordering' : 
                    '✅ Stock levels adequate',
                    recommendedOrderQty > 0 ? `📦 Recommended order: ${recommendedOrderQty} units` : '✅ No reorder needed for forecast period'
                ],
                historical_performance: {
                    avg_daily_sales: Math.round(avgDailySales * 100) / 100,
                    total_sales: product.total_sales,
                    sales_volatility: Math.round((avgDailySales * 0.3) * 100) / 100,
                    order_frequency: product.dates.length
                }
            };
        });

        return {
            status: 'success',
            message: 'Forecast generated using simplified method (Python service unavailable)',
            data: forecasts,
            summary: {
                total_products_analyzed: topProducts.length,
                forecasts_generated: topProducts.length,
                forecast_period_days: days,
                method_used: 'simple_moving_average',
                data_period_days: 60
            }
        };
    } catch (error) {
        console.error('Error in fallback forecast:', error);
        return {
            status: 'error',
            message: 'Failed to generate forecast: ' + error.message,
            data: {},
            summary: {
                total_products_analyzed: 0,
                forecasts_generated: 0,
                forecast_period_days: days,
                method_used: 'fallback',
                data_period_days: 0
            }
        };
    }
}

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
      case 'all':
        timeFilter = '1=1';
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
      WHERE o.status = 'paid' AND u.role = 'user' AND ${timeFilter}
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
      const salesHeaderRowNum = headerRow.number; // Capture actual row number
      
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
      const inventoryHeaderRowNum = headerRow.number; // Capture actual row number
      
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
      
      // Configure page setup for coupon bond (8.5" x 13")
      inventorySheet.pageSetup = {
        paperSize: 5, // Legal size (8.5" x 14", closest to coupon bond 8.5" x 13")
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, // Allow multiple pages vertically
        margins: {
          left: 0.5,
          right: 0.5,
          top: 1.0,
          bottom: 1.0,
          header: 0.3,
          footer: 0.3
        },
        printTitlesRow: `${inventoryHeaderRowNum}:${inventoryHeaderRowNum}`, // Repeat only the column header row
        horizontalCentered: true
      };
      
      // Configure header and footer for every page
      inventorySheet.headerFooter = {
        oddHeader: '&C&"Arial,Bold"&14JM GARIS STORE\n&"Arial"&11Inventory Report',
        oddFooter: '&L&"Arial"&9Generated: ' + new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) + '&C&"Arial,Bold"&9Page &P of &N&R&"Arial"&9JM Garis Store'
      };
    }
    
    // Apply page setup to sales sheet if it exists
    if (type === 'sales' || type === 'combined') {
      const salesSheet = workbook.getWorksheet('Sales Report');
      if (salesSheet) {
        // Configure page setup for coupon bond (8.5" x 13")
        salesSheet.pageSetup = {
          paperSize: 5, // Legal size (8.5" x 14", closest to coupon bond 8.5" x 13")
          orientation: 'portrait',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0, // Allow multiple pages vertically
          margins: {
            left: 0.5,
            right: 0.5,
            top: 1.0,
            bottom: 1.0,
            header: 0.3,
            footer: 0.3
          },
          printTitlesRow: `${salesHeaderRowNum}:${salesHeaderRowNum}`, // Repeat only the column header row
          horizontalCentered: true
        };
        
        // Configure header and footer for every page
        salesSheet.headerFooter = {
          oddHeader: '&C&"Arial,Bold"&14JM GARIS STORE\n&"Arial"&11Sales Report',
          oddFooter: '&L&"Arial"&9Generated: ' + new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) + '&C&"Arial,Bold"&9Page &P of &N&R&"Arial"&9JM Garis Store'
        };
      }
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
        
        // Format current date for filename
        const now = new Date();
        const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
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
        const actualHeaderRowNum = headerRow.number; // Get the actual row number
        
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
        
        // Configure page setup for coupon bond (8.5" x 13")
        lowStockSheet.pageSetup = {
            paperSize: 5, // Legal size (8.5" x 14", closest to coupon bond 8.5" x 13")
            orientation: 'portrait',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0, // Allow multiple pages vertically
            margins: {
                left: 0.5,
                right: 0.5,
                top: 1.0,
                bottom: 1.0,
                header: 0.3,
                footer: 0.3
            },
            printTitlesRow: `${actualHeaderRowNum}:${actualHeaderRowNum}`, // Repeat only the column header row
            horizontalCentered: true
        };
        
        // Configure header and footer for every page
        lowStockSheet.headerFooter = {
            oddHeader: '&C&"Arial,Bold"&14JM GARIS STORE\n&"Arial"&11Low Stock Alert Report',
            oddFooter: '&L&"Arial"&9Generated: ' + new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) + '&C&"Arial,Bold"&9Page &P of &N&R&"Arial"&9JM Garis Store'
        };
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=low-stock-report-${formattedDate}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error generating low stock report:', error);
        res.status(500).json({ message: 'Error generating low stock report' });
    }
};

exports.downloadTransactionReport = async (req, res) => {
    try {
        const { status, search, date } = req.query;
        
        // Format current date for filename
        const now = new Date();
        const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        
        // Set workbook properties
        workbook.creator = 'JM Garis Store';
        workbook.lastModifiedBy = 'Admin';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        // Create Transaction Report worksheet
        const transactionSheet = workbook.addWorksheet('Transaction Report');
        
        // Set column widths
        transactionSheet.columns = [
            { width: 15 }, // Order ID
            { width: 25 }, // Customer Name
            { width: 20 }, // Payment Method
            { width: 15 }, // Status
            { width: 15 }, // Total Amount
            { width: 20 }, // Order Date
            { width: 20 }, // Staff
            { width: 15 }  // Order Type
        ];
        
        // Add store header
        transactionSheet.mergeCells('A1:H1');
        const titleCell = transactionSheet.getCell('A1');
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
        transactionSheet.mergeCells('A2:H2');
        const reportTitleCell = transactionSheet.getCell('A2');
        reportTitleCell.value = 'TRANSACTION REPORT';
        reportTitleCell.font = { name: 'Arial', size: 14, bold: true };
        reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add generation timestamp
        transactionSheet.mergeCells('A3:H3');
        const timestampCell = transactionSheet.getCell('A3');
        timestampCell.value = `Generated on: ${new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
        timestampCell.font = { name: 'Arial', size: 10, italic: true };
        timestampCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        let currentRow = 4;
        
        // Add filter information if any
        if (status && status !== 'all') {
            transactionSheet.mergeCells(`A${currentRow}:H${currentRow}`);
            const filterCell = transactionSheet.getCell(`A${currentRow}`);
            let statusText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            filterCell.value = `Status Filter: ${statusText}`;
            filterCell.font = { name: 'Arial', size: 10, italic: true };
            filterCell.alignment = { horizontal: 'center', vertical: 'middle' };
            currentRow++;
        }
        
        // Add date filter information if any
        if (date) {
            transactionSheet.mergeCells(`A${currentRow}:H${currentRow}`);
            const dateCell = transactionSheet.getCell(`A${currentRow}`);
            dateCell.value = `Date Filter: ${new Date(date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            })}`;
            dateCell.font = { name: 'Arial', size: 10, italic: true };
            dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
            currentRow++;
        }
        
        // Add search information if any
        if (search) {
            transactionSheet.mergeCells(`A${currentRow}:H${currentRow}`);
            const searchCell = transactionSheet.getCell(`A${currentRow}`);
            searchCell.value = `Search: "${search}"`;
            searchCell.font = { name: 'Arial', size: 10, italic: true };
            searchCell.alignment = { horizontal: 'center', vertical: 'middle' };
            currentRow++;
        }
        
        // Add headers
        const headerRow = transactionSheet.addRow([
            'Order ID', 
            'Customer Name', 
            'Payment Method', 
            'Status', 
            'Total Amount (₱)', 
            'Order Date', 
            'Staff', 
            'Order Type'
        ]);
        const actualHeaderRowNum = headerRow.number; // Get the actual row number
        
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
        
        // Get all orders
        const orders = await Staff.getAllOrders();
        
        // Apply filters similar to frontend
        let filteredOrders = orders;
        
        // Filter by search query
        if (search) {
            filteredOrders = filteredOrders.filter(order => 
                order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                order.order_id?.toString().includes(search)
            );
        }
        
        // Filter by status
        if (status && status !== 'all') {
            filteredOrders = filteredOrders.filter(order => {
                if (status === 'to verify') {
                    return order.payment_status === 'pending' && order.payment_method === 'gcash';
                }
                return order.status === status;
            });
        }
        
        // Filter by date
        if (date) {
            const filterDate = new Date(date);
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate.toDateString() === filterDate.toDateString();
            });
        }
        
        // Add data rows
        let totalRevenue = 0;
        const statusCounts = {};
        
        filteredOrders.forEach((order, index) => {
            const orderDate = new Date(order.created_at);
            const formattedDate = orderDate.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const paymentMethod = order.payment_method === 'cod' 
                ? 'Cash on Delivery' 
                : order.payment_method === 'gcash' 
                ? 'GCash' 
                : order.payment_method === 'cash'
                ? 'Cash'
                : order.payment_method || 'N/A';
            
            const orderType = order.is_physical_order ? 'Walk-in' : 'Online';
            
            const dataRow = transactionSheet.addRow([
                order.order_id,
                order.customer_name || 'N/A',
                paymentMethod,
                order.status ? order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
                parseFloat(order.total_amount || 0),
                formattedDate,
                order.staff_name || 'N/A',
                orderType
            ]);
            
            // Format data cells
            dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
            dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
            dataRow.getCell(5).numFmt = '#,##0.00';
            dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
            
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
            const statusCell = dataRow.getCell(4);
            const orderStatus = order.status?.toLowerCase();
            
            switch(orderStatus) {
                case 'paid':
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD1E7DD' }
                    };
                    statusCell.font = { color: { argb: 'FF0F5132' }, bold: true };
                    totalRevenue += parseFloat(order.total_amount || 0);
                    break;
                case 'pending':
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFEF3C7' }
                    };
                    statusCell.font = { color: { argb: 'FF92400E' }, bold: true };
                    break;
                case 'preparing':
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFCCE5FF' }
                    };
                    statusCell.font = { color: { argb: 'FF004085' }, bold: true };
                    break;
                case 'ready for pickup':
                case 'ready_for_pickup':
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE3F5E9' }
                    };
                    statusCell.font = { color: { argb: 'FF0F7840' }, bold: true };
                    break;
                case 'cancelled':
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFEE2E2' }
                    };
                    statusCell.font = { color: { argb: 'FFB91C1C' }, bold: true };
                    break;
            }
            
            // Track status counts
            const statusKey = order.status || 'Unknown';
            statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
            
            // Alternate row colors
            if (index % 2 === 1) {
                dataRow.eachCell((cell, colNumber) => {
                    if (colNumber !== 4) { // Don't override status cell color
                        const currentFill = cell.fill;
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
        const summaryStartRow = transactionSheet.rowCount + 2;
        transactionSheet.mergeCells(`A${summaryStartRow}:H${summaryStartRow}`);
        const summaryHeaderCell = transactionSheet.getCell(`A${summaryStartRow}`);
        summaryHeaderCell.value = 'TRANSACTION SUMMARY';
        summaryHeaderCell.font = { name: 'Arial', size: 12, bold: true };
        summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        summaryHeaderCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE3F2FD' }
        };
        
        // Add summary statistics
        transactionSheet.addRow(['Total Transactions:', filteredOrders.length, '', '', '', '', '', '']);
        transactionSheet.addRow(['Total Revenue (Paid Orders):', '', '', '', totalRevenue, '', '', '']);
        
        // Add status breakdown
        transactionSheet.addRow(['', '', '', '', '', '', '', '']);
        transactionSheet.addRow(['Status Breakdown:', '', '', '', '', '', '', '']);
        
        Object.entries(statusCounts).forEach(([status, count]) => {
            const statusDisplay = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            transactionSheet.addRow([`  ${statusDisplay}:`, count, '', '', '', '', '', '']);
        });
        
        // Format summary rows
        for (let i = summaryStartRow + 1; i <= transactionSheet.rowCount; i++) {
            const row = transactionSheet.getRow(i);
            row.getCell(1).font = { bold: true };
            row.getCell(2).font = { bold: true };
            if (i === summaryStartRow + 2) { // Total revenue row
                row.getCell(5).numFmt = '#,##0.00';
                row.getCell(5).font = { bold: true, color: { argb: 'FF059669' } };
            }
        }
        
        // Add footer with signature
        const footerRow = transactionSheet.rowCount + 3;
        transactionSheet.mergeCells(`A${footerRow}:H${footerRow}`);
        transactionSheet.mergeCells(`A${footerRow + 2}:H${footerRow + 2}`);
        transactionSheet.mergeCells(`A${footerRow + 4}:H${footerRow + 4}`);
        transactionSheet.mergeCells(`A${footerRow + 5}:H${footerRow + 5}`);
        
        // Signature line
        const signatureCell = transactionSheet.getCell(`A${footerRow + 2}`);
        signatureCell.value = '________________________';
        signatureCell.font = { name: 'Arial', size: 10 };
        signatureCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Printed name
        const nameCell = transactionSheet.getCell(`A${footerRow + 4}`);
        nameCell.value = 'Signature Over Printed Name';
        nameCell.font = { name: 'Arial', size: 10, bold: true };
        nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Store name
        const storeNameCell = transactionSheet.getCell(`A${footerRow + 5}`);
        storeNameCell.value = 'JM Garis Store';
        storeNameCell.font = { name: 'Arial', size: 9, italic: true };
        storeNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Set row heights
        transactionSheet.getRow(1).height = 25;
        transactionSheet.getRow(2).height = 20;
        
        // Configure page setup for coupon bond (8.5" x 13")
        transactionSheet.pageSetup = {
            paperSize: 5, // Legal size (8.5" x 14", closest to coupon bond 8.5" x 13")
            orientation: 'landscape', // Landscape for more columns
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0, // Allow multiple pages vertically
            margins: {
                left: 0.5,
                right: 0.5,
                top: 1.0,
                bottom: 1.0,
                header: 0.3,
                footer: 0.3
            },
            printTitlesRow: `${actualHeaderRowNum}:${actualHeaderRowNum}`, // Repeat only the column header row
            horizontalCentered: true
        };
        
        // Configure header and footer for every page
        transactionSheet.headerFooter = {
            oddHeader: '&C&"Arial,Bold"&14JM GARIS STORE\n&"Arial"&11Transaction Report',
            oddFooter: '&L&"Arial"&9Generated: ' + new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) + '&C&"Arial,Bold"&9Page &P of &N&R&"Arial"&9JM Garis Store'
        };
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=transaction-report-${formattedDate}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error generating transaction report:', error);
        res.status(500).json({ message: 'Error generating transaction report' });
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

// Walk-in customer rewards endpoints
exports.lookupUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Validate userId
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        // Look up user with points information
        const [users] = await db.query(
            `SELECT id, username, firstname, lastname, email, points 
             FROM users 
             WHERE id = ? AND role = 'user'`,
            [parseInt(userId)]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Error looking up user:', error);
        res.status(500).json({ message: 'Error looking up user' });
    }
};

exports.processWalkInRewards = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { userId, orderId, totalAmount } = req.body;
        
        // Validate inputs
        if (!userId || !orderId || !totalAmount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Verify user exists
        const [users] = await connection.query(
            'SELECT id, firstname, lastname, email, points FROM users WHERE id = ? AND role = "user"',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        
        // Verify order exists and is a physical order
        const [orders] = await connection.query(
            'SELECT order_id, is_physical_order, status FROM orders WHERE order_id = ?',
            [orderId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (!orders[0].is_physical_order) {
            return res.status(400).json({ message: 'Order is not a walk-in order' });
        }
        
        if (orders[0].status !== 'paid') {
            return res.status(400).json({ message: 'Order must be paid before applying rewards' });
        }
        
        // Check if rewards have already been applied for this order
        const [existingRewards] = await connection.query(
            'SELECT id FROM user_rewards WHERE order_id = ? AND user_id = ?',
            [orderId, userId]
        );
        
        if (existingRewards.length > 0) {
            return res.status(400).json({ message: 'Rewards have already been applied for this order' });
        }
        
        // Add points using the Reward model
        const pointsAwarded = await Reward.addPoints(userId, orderId, parseFloat(totalAmount));
        
        // Get updated user points
        const newTotalPoints = await Reward.getUserPoints(userId);
        
        // Note: Notification system not implemented yet
        // Future enhancement: Create notification for the user
        // await connection.query(
        //     `INSERT INTO notifications (user_id, type, title, message, created_at) 
        //      VALUES (?, 'reward', 'Walk-in Purchase Rewards!', ?, NOW())`,
        //     [
        //         userId,
        //         `You've received ${pointsAwarded} points from your walk-in purchase (Order #${orderId}). Thank you for shopping with us!`
        //     ]
        // );
        
        await connection.commit();
        
        res.json({
            message: 'Rewards applied successfully',
            pointsAwarded,
            newTotalPoints,
            user: {
                id: user.id,
                name: `${user.firstname} ${user.lastname}`,
                email: user.email
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error processing walk-in rewards:', error);
        res.status(500).json({ message: 'Error processing walk-in rewards' });
    } finally {
        connection.release();
    }
};

// Admin order management methods

// Staff Performance Analytics
exports.getStaffPerformance = async (req, res) => {
    try {
        const { period = 'overall', fromDate, toDate, staffId } = req.query;
        
        let dateCondition = '';
        let params = [];
        
        // Build date condition based on period
        if (period === 'today') {
            dateCondition = 'AND DATE(o.created_at) = CURDATE()';
        } else if (period === 'week') {
            dateCondition = 'AND YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)';
        } else if (period === 'month') {
            dateCondition = 'AND YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE())';
        } else if (period === 'year') {
            dateCondition = 'AND YEAR(o.created_at) = YEAR(CURDATE())';
        } else if (period === 'custom' && fromDate && toDate) {
            dateCondition = 'AND DATE(o.created_at) BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // Staff filter
        let staffCondition = '';
        if (staffId) {
            staffCondition = 'AND u.id = ?';
            params.push(staffId);
        }
        
        const query = `
            SELECT 
                u.id as user_id,
                u.username,
                CONCAT(u.firstname, ' ', COALESCE(u.middlename, ''), ' ', u.lastname) as fullname,
                u.email,
                u.phone_number,
                
                -- Sales Metrics
                COUNT(DISTINCT o.order_id) as total_orders,
                COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.order_id END) as orders_accepted,
                COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash') THEN o.order_id END) as orders_completed,
                COALESCE(SUM(CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as total_sales,
                COALESCE(AVG(CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as avg_order_value,
                
                -- Performance Metrics
                ROUND(
                    (COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.order_id END) / 
                     NULLIF(COUNT(DISTINCT o.order_id), 0)) * 100, 2
                ) as acceptance_rate,
                
                ROUND(
                    (COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash') THEN o.order_id END) / 
                     NULLIF(COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.order_id END), 0)) * 100, 2
                ) as completion_rate,
                
                -- Time-based metrics
                COUNT(DISTINCT CASE WHEN DATE(o.created_at) = CURDATE() THEN o.order_id END) as today_orders,
                COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURDATE() AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as today_sales,
                
                COUNT(DISTINCT CASE WHEN YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1) THEN o.order_id END) as week_orders,
                COALESCE(SUM(CASE WHEN YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1) AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as week_sales,
                
                COUNT(DISTINCT CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE()) THEN o.order_id END) as month_orders,
                COALESCE(SUM(CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE()) AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as month_sales,
                
                COUNT(DISTINCT CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) THEN o.order_id END) as year_orders,
                COALESCE(SUM(CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as year_sales
                
            FROM users u
            LEFT JOIN orders o ON u.id = o.accepted_by
            WHERE u.role = 'staff' 
            ${dateCondition}
            ${staffCondition}
            GROUP BY u.id, u.username, u.firstname, u.middlename, u.lastname, u.email, u.phone_number
            ORDER BY total_sales DESC, orders_accepted DESC
        `;
        
        const [staffPerformance] = await db.execute(query, params);
        
        // Calculate performance scores and rankings
        const staffWithScores = staffPerformance.map((staff, index) => {
            // Performance score calculation (weighted)
            const salesWeight = 0.4;
            const ordersWeight = 0.3;
            const acceptanceWeight = 0.2;
            const completionWeight = 0.1;
            
            const maxSales = Math.max(...staffPerformance.map(s => parseFloat(s.total_sales)));
            const maxOrders = Math.max(...staffPerformance.map(s => parseInt(s.orders_accepted)));
            
            const salesScore = maxSales > 0 ? (parseFloat(staff.total_sales) / maxSales) * 100 : 0;
            const ordersScore = maxOrders > 0 ? (parseInt(staff.orders_accepted) / maxOrders) * 100 : 0;
            const acceptanceScore = parseFloat(staff.acceptance_rate) || 0;
            const completionScore = parseFloat(staff.completion_rate) || 0;
            
            const performanceScore = (
                salesScore * salesWeight +
                ordersScore * ordersWeight +
                acceptanceScore * acceptanceWeight +
                completionScore * completionWeight
            ).toFixed(2);
            
            return {
                ...staff,
                rank: index + 1,
                performance_score: parseFloat(performanceScore),
                sales_score: salesScore.toFixed(2),
                orders_score: ordersScore.toFixed(2)
            };
        });
        
        res.json({
            period,
            dateRange: { fromDate, toDate },
            staffPerformance: staffWithScores,
            summary: {
                totalStaff: staffWithScores.length,
                totalSales: staffWithScores.reduce((sum, staff) => sum + parseFloat(staff.total_sales), 0),
                totalOrders: staffWithScores.reduce((sum, staff) => sum + parseInt(staff.total_orders), 0),
                avgPerformanceScore: staffWithScores.reduce((sum, staff) => sum + staff.performance_score, 0) / staffWithScores.length || 0
            }
        });
        
    } catch (error) {
        console.error('Error fetching staff performance:', error);
        res.status(500).json({ message: 'Error fetching staff performance data' });
    }
};

exports.downloadStaffReports = async (req, res) => {
    try {
        const { period = 'overall', fromDate, toDate, staffId, type = 'all' } = req.query;
        
        // Get staff performance data using the same logic as getStaffPerformance
        let dateCondition = '';
        let params = [];
        
        // Build date condition based on period
        if (period === 'today') {
            dateCondition = 'AND DATE(o.created_at) = CURDATE()';
        } else if (period === 'week') {
            dateCondition = 'AND YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)';
        } else if (period === 'month') {
            dateCondition = 'AND YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE())';
        } else if (period === 'year') {
            dateCondition = 'AND YEAR(o.created_at) = YEAR(CURDATE())';
        } else if (period === 'custom' && fromDate && toDate) {
            dateCondition = 'AND DATE(o.created_at) BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // Staff filter
        let staffCondition = '';
        if (staffId) {
            staffCondition = 'AND u.id = ?';
            params.push(staffId);
        }
        
        const query = `
            SELECT 
                u.id as user_id,
                u.username,
                CONCAT(u.firstname, ' ', COALESCE(u.middlename, ''), ' ', u.lastname) as fullname,
                u.email,
                u.phone_number,
                
                -- Sales Metrics
                COUNT(DISTINCT o.order_id) as total_orders,
                COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.order_id END) as orders_accepted,
                COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash') THEN o.order_id END) as orders_completed,
                COALESCE(SUM(CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as total_sales,
                COALESCE(AVG(CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as avg_order_value,
                
                -- Performance Metrics
                ROUND(
                    (COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.order_id END) / 
                     NULLIF(COUNT(DISTINCT o.order_id), 0)) * 100, 2
                ) as acceptance_rate,
                
                ROUND(
                    (COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash') THEN o.order_id END) / 
                     NULLIF(COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.order_id END), 0)) * 100, 2
                ) as completion_rate,
                
                -- Time-based metrics
                COUNT(DISTINCT CASE WHEN DATE(o.created_at) = CURDATE() THEN o.order_id END) as today_orders,
                COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURDATE() AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as today_sales,
                
                COUNT(DISTINCT CASE WHEN YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1) THEN o.order_id END) as week_orders,
                COALESCE(SUM(CASE WHEN YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1) AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as week_sales,
                
                COUNT(DISTINCT CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE()) THEN o.order_id END) as month_orders,
                COALESCE(SUM(CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE()) AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as month_sales,
                
                COUNT(DISTINCT CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) THEN o.order_id END) as year_orders,
                COALESCE(SUM(CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup') THEN o.total_amount END), 0) as year_sales
                
            FROM users u
            LEFT JOIN orders o ON u.id = o.accepted_by
            WHERE u.role = 'staff' 
            ${dateCondition}
            ${staffCondition}
            GROUP BY u.id, u.username, u.firstname, u.middlename, u.lastname, u.email, u.phone_number
            ORDER BY total_sales DESC, orders_accepted DESC
        `;
        
        const [staffPerformanceData] = await db.execute(query, params);
        
        // Calculate performance scores and rankings
        const staffWithScores = staffPerformanceData.map((staff, index) => {
            // Performance score calculation (weighted)
            const salesWeight = 0.4;
            const ordersWeight = 0.3;
            const acceptanceWeight = 0.2;
            const completionWeight = 0.1;
            
            const maxSales = Math.max(...staffPerformanceData.map(s => parseFloat(s.total_sales)));
            const maxOrders = Math.max(...staffPerformanceData.map(s => parseInt(s.orders_accepted)));
            
            const salesScore = maxSales > 0 ? (parseFloat(staff.total_sales) / maxSales) * 100 : 0;
            const ordersScore = maxOrders > 0 ? (parseInt(staff.orders_accepted) / maxOrders) * 100 : 0;
            const acceptanceScore = parseFloat(staff.acceptance_rate) || 0;
            const completionScore = parseFloat(staff.completion_rate) || 0;
            
            const performanceScore = (
                salesScore * salesWeight +
                ordersScore * ordersWeight +
                acceptanceScore * acceptanceWeight +
                completionScore * completionWeight
            ).toFixed(2);
            
            return {
                ...staff,
                rank: index + 1,
                performance_score: parseFloat(performanceScore),
                sales_score: salesScore.toFixed(2),
                orders_score: ordersScore.toFixed(2)
            };
        });
        
        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'JM Garis Store';
        workbook.created = new Date();
        
        if (type === 'all' || type === 'rankings') {
            // Create Staff Rankings worksheet
            const rankingsSheet = workbook.addWorksheet('Staff Rankings');
            
            // Set column widths
            rankingsSheet.columns = [
                { width: 8 },   // Rank
                { width: 20 },  // Name
                { width: 25 },  // Email
                { width: 15 },  // Performance Score
                { width: 15 },  // Total Sales
                { width: 12 },  // Orders Accepted
                { width: 12 },  // Sales Count
                { width: 15 },  // Acceptance Rate
                { width: 15 },  // Completion Rate
                { width: 15 }   // Avg Order Value
            ];
            
            // Add store header
            rankingsSheet.mergeCells('A1:J1');
            const titleCell = rankingsSheet.getCell('A1');
            titleCell.value = 'JM GARIS STORE';
            titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
            
            // Add report title
            rankingsSheet.mergeCells('A2:J2');
            const reportTitleCell = rankingsSheet.getCell('A2');
            reportTitleCell.value = 'STAFF PERFORMANCE RANKINGS';
            reportTitleCell.font = { name: 'Arial', size: 14, bold: true };
            reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Add period info
            rankingsSheet.mergeCells('A3:J3');
            const periodCell = rankingsSheet.getCell('A3');
            let periodText = period.charAt(0).toUpperCase() + period.slice(1);
            if (period === 'custom' && fromDate && toDate) {
                periodText = `Custom Period: ${fromDate} to ${toDate}`;
            }
            periodCell.value = `Period: ${periodText}`;
            periodCell.font = { name: 'Arial', size: 11 };
            periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Add generation timestamp
            rankingsSheet.mergeCells('A4:J4');
            const timestampCell = rankingsSheet.getCell('A4');
            timestampCell.value = `Generated: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`;
            timestampCell.font = { name: 'Arial', size: 10, italic: true };
            timestampCell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Add empty row
            rankingsSheet.addRow([]);
            
            // Add headers
            const headerRow = rankingsSheet.addRow([
                'Rank',
                'Staff Name',
                'Email',
                'Performance Score',
                'Total Sales (₱)',
                'Orders Accepted',
                'Sales Count',
                'Acceptance Rate (%)',
                'Completion Rate (%)',
                'Avg Order Value (₱)'
            ]);
            const staffHeaderRowNum = headerRow.number; // Capture actual row number
            
            // Style headers
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            
            // Add data rows
            staffWithScores.forEach((staff, index) => {
                const dataRow = rankingsSheet.addRow([
                    staff.rank,
                    staff.fullname,
                    staff.email,
                    staff.performance_score,
                    parseFloat(staff.total_sales),
                    parseInt(staff.orders_accepted),
                    parseInt(staff.total_orders),
                    parseFloat(staff.acceptance_rate) || 0,
                    parseFloat(staff.completion_rate) || 0,
                    parseFloat(staff.avg_order_value)
                ]);
                
                // Style data rows
                dataRow.eachCell((cell, colNumber) => {
                    // Add borders
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    
                    // Alignment
                    if (colNumber === 1) { // Rank
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    } else if (colNumber === 2) { // Name
                        cell.alignment = { horizontal: 'left', vertical: 'middle' };
                    } else if (colNumber === 3) { // Email
                        cell.alignment = { horizontal: 'left', vertical: 'middle' };
                    } else {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    }
                    
                    // Format currency columns
                    if (colNumber === 5 || colNumber === 10) { // Total Sales and Avg Order Value
                        cell.numFmt = '#,##0.00';
                        cell.alignment = { horizontal: 'right', vertical: 'middle' };
                    }
                    
                    // Format percentage columns
                    if (colNumber === 8 || colNumber === 9) { // Acceptance Rate and Completion Rate
                        cell.numFmt = '0.00';
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    }
                    
                    // Format performance score
                    if (colNumber === 4) {
                        cell.numFmt = '0.00';
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    }
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
            const summaryStartRow = rankingsSheet.rowCount + 2;
            rankingsSheet.mergeCells(`A${summaryStartRow}:J${summaryStartRow}`);
            const summaryTitleCell = rankingsSheet.getCell(`A${summaryStartRow}`);
            summaryTitleCell.value = 'SUMMARY STATISTICS';
            summaryTitleCell.font = { name: 'Arial', size: 12, bold: true };
            summaryTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            summaryTitleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE3F2FD' }
            };
            
            // Calculate summary data
            const totalStaff = staffWithScores.length;
            const totalSales = staffWithScores.reduce((sum, staff) => sum + parseFloat(staff.total_sales), 0);
            const totalOrders = staffWithScores.reduce((sum, staff) => sum + parseInt(staff.total_orders), 0);
            const avgPerformance = totalStaff > 0 ? staffWithScores.reduce((sum, staff) => sum + staff.performance_score, 0) / totalStaff : 0;
            
            rankingsSheet.addRow(['Total Staff Members:', totalStaff, '', '', '', '', '', '', '', '']);
            rankingsSheet.addRow(['Total Combined Sales:', '', '', '', totalSales, '', '', '', '', '']);
            rankingsSheet.addRow(['Total Orders Processed:', totalOrders, '', '', '', '', '', '', '', '']);
            rankingsSheet.addRow(['Average Performance Score:', avgPerformance.toFixed(2), '', '', '', '', '', '', '', '']);
            
            // Format summary rows
            for (let i = summaryStartRow + 1; i <= summaryStartRow + 4; i++) {
                const row = rankingsSheet.getRow(i);
                row.getCell(1).font = { bold: true };
                row.getCell(2).font = { bold: true };
                if (i === summaryStartRow + 2) { // Total sales row
                    row.getCell(5).numFmt = '#,##0.00';
                    row.getCell(5).font = { bold: true, color: { argb: 'FF059669' } };
                }
            }
            
            // Add footer with signature
            const footerRow = rankingsSheet.rowCount + 3;
            rankingsSheet.mergeCells(`A${footerRow}:J${footerRow}`);
            rankingsSheet.mergeCells(`A${footerRow + 2}:J${footerRow + 2}`);
            rankingsSheet.mergeCells(`A${footerRow + 4}:J${footerRow + 4}`);
            rankingsSheet.mergeCells(`A${footerRow + 5}:J${footerRow + 5}`);
            
            // Signature line
            const signatureCell = rankingsSheet.getCell(`A${footerRow + 2}`);
            signatureCell.value = '________________________';
            signatureCell.font = { name: 'Arial', size: 10 };
            signatureCell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Printed name
            const nameCell = rankingsSheet.getCell(`A${footerRow + 4}`);
            nameCell.value = 'Signature Over Printed Name';
            nameCell.font = { name: 'Arial', size: 10, bold: true };
            nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Store name
            const storeNameCell = rankingsSheet.getCell(`A${footerRow + 5}`);
            storeNameCell.value = 'JM Garis Store';
            storeNameCell.font = { name: 'Arial', size: 9, italic: true };
            storeNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Set row heights
            rankingsSheet.getRow(1).height = 25;
            rankingsSheet.getRow(2).height = 20;
            
            // Configure page setup for coupon bond (8.5" x 13")
            rankingsSheet.pageSetup = {
                paperSize: 5, // Legal size (8.5" x 14", closest to coupon bond 8.5" x 13")
                orientation: 'landscape', // Landscape for more columns
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0, // Allow multiple pages vertically
                margins: {
                    left: 0.5,
                    right: 0.5,
                    top: 1.0,
                    bottom: 1.0,
                    header: 0.3,
                    footer: 0.3
                },
                printTitlesRow: `${staffHeaderRowNum}:${staffHeaderRowNum}`, // Repeat only the column header row
                horizontalCentered: true
            };
            
            // Configure header and footer for every page
            rankingsSheet.headerFooter = {
                oddHeader: '&C&"Arial,Bold"&14JM GARIS STORE\n&"Arial"&11Staff Performance Rankings',
                oddFooter: '&L&"Arial"&9Generated: ' + new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) + '&C&"Arial,Bold"&9Page &P of &N&R&"Arial"&9JM Garis Store'
            };
        }
        
        // Set response headers for download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=staff_performance_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error generating staff report:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating staff performance report' });
        }
    }
};

// Get staff transaction count for deletion preview
exports.getStaffTransactionCount = async (req, res) => {
    try {
        const { staffId, period, fromDate, toDate } = req.query;
        
        if (!staffId || !period) {
            return res.status(400).json({ message: 'Staff ID and period are required' });
        }
        
        let dateCondition = '';
        let params = [staffId];
        
        // Build date condition based on period
        switch (period) {
            case 'today':
                dateCondition = 'AND DATE(o.created_at) = CURDATE()';
                break;
            case 'week':
                dateCondition = 'AND YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)';
                break;
            case 'month':
                dateCondition = 'AND MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())';
                break;
            case 'year':
                dateCondition = 'AND YEAR(o.created_at) = YEAR(CURDATE())';
                break;
            case 'custom':
                if (fromDate && toDate) {
                    dateCondition = 'AND DATE(o.created_at) BETWEEN ? AND ?';
                    params.push(fromDate, toDate);
                }
                break;
            case 'overall':
            default:
                // No date condition for overall
                break;
        }
        
        const query = `
            SELECT COUNT(*) as count
            FROM orders o
            WHERE o.accepted_by = ? 
            AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup')
            ${dateCondition}
        `;
        
        const [rows] = await db.execute(query, params);
        const count = rows[0].count;
        
        res.json({ count });
        
    } catch (error) {
        console.error('Error getting staff transaction count:', error);
        res.status(500).json({ message: 'Error getting transaction count' });
    }
};

// Delete staff transactions
exports.deleteStaffTransactions = async (req, res) => {
    try {
        const { staffId, period, fromDate, toDate } = req.body;
        
        if (!staffId || !period) {
            return res.status(400).json({ message: 'Staff ID and period are required' });
        }
        
        let dateCondition = '';
        let params = [staffId];
        
        // Build date condition based on period
        switch (period) {
            case 'today':
                dateCondition = 'AND DATE(created_at) = CURDATE()';
                break;
            case 'week':
                dateCondition = 'AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
                break;
            case 'month':
                dateCondition = 'AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
                break;
            case 'year':
                dateCondition = 'AND YEAR(created_at) = YEAR(CURDATE())';
                break;
            case 'custom':
                if (fromDate && toDate) {
                    dateCondition = 'AND DATE(created_at) BETWEEN ? AND ?';
                    params.push(fromDate, toDate);
                }
                break;
            case 'overall':
            default:
                // No date condition for overall
                break;
        }
        
        // First, get the orders to be deleted to also clean up related data
        const selectQuery = `
            SELECT order_id FROM orders 
            WHERE accepted_by = ? 
            AND status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup')
            ${dateCondition}
        `;
        
        const [ordersToDelete] = await db.execute(selectQuery, params);
        const orderIds = ordersToDelete.map(order => order.order_id);
        
        if (orderIds.length === 0) {
            return res.json({ message: 'No transactions found to delete', deletedCount: 0 });
        }
        
        // Use a connection from the pool for transaction
        const connection = await db.getConnection();
        
        try {
            // Start transaction
            await connection.beginTransaction();
            
            // Delete related order items first
            if (orderIds.length > 0) {
                const deleteOrderItemsQuery = `
                    DELETE FROM order_items 
                    WHERE order_id IN (${orderIds.map(() => '?').join(',')})
                `;
                await connection.execute(deleteOrderItemsQuery, orderIds);
            }
            
            // Delete the orders
            const deleteOrdersQuery = `
                DELETE FROM orders 
                WHERE accepted_by = ? 
                AND status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup', 'pending_pickup')
                ${dateCondition}
            `;
            
            const [result] = await connection.execute(deleteOrdersQuery, params);
            
            // Commit transaction
            await connection.commit();
            
            res.json({ 
                message: 'Staff transactions deleted successfully', 
                deletedCount: result.affectedRows 
            });
            
        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            // Release connection back to pool
            connection.release();
        }
        
    } catch (error) {
        console.error('Error deleting staff transactions:', error);
        res.status(500).json({ message: 'Error deleting transactions' });
    }
};

// GCash Payment Management Functions
exports.getPendingGCashPayments = async (req, res) => {
    try {
        const query = `
            SELECT 
                pi.id,
                pi.order_id,
                pi.amount,
                pi.gcash_reference,
                pi.status,
                pi.created_at,
                pi.payment_type,
                pi.total_amount,
                pi.user_id,
                CONCAT(u.firstname, ' ', u.lastname) as customer_name,
                u.email as customer_email
            FROM payment_intents pi
            LEFT JOIN users u ON pi.user_id = u.id
            WHERE pi.status = 'pending_verification'
            AND pi.gcash_reference IS NOT NULL
            ORDER BY pi.created_at DESC
        `;
        
        const [payments] = await db.execute(query);
        
        res.json(payments);
    } catch (error) {
        console.error('Error fetching pending GCash payments:', error);
        res.status(500).json({ message: 'Error fetching pending GCash payments' });
    }
};

exports.getOrderGCashDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // First check if order exists and has GCash payment method
        const orderQuery = `
            SELECT 
                o.order_id,
                o.payment_method,
                o.payment_intent_id,
                o.status,
                o.total_amount
            FROM orders o
            WHERE o.order_id = ?
        `;
        
        const [orders] = await db.execute(orderQuery, [orderId]);
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const order = orders[0];
        
        if (order.payment_method !== 'gcash') {
            return res.status(400).json({ message: 'Order does not use GCash payment method' });
        }
        
        // Get GCash payment details from payment_intents table
        let gcashQuery, gcashParams;
        
        if (order.payment_intent_id) {
            // If there's a payment_intent_id, use it
            gcashQuery = `
                SELECT 
                    pi.id,
                    pi.gcash_reference,
                    pi.amount,
                    pi.status,
                    pi.payment_type,
                    pi.total_amount,
                    pi.created_at,
                    pi.verified_at,
                    NULL as receipt_url
                FROM payment_intents pi
                WHERE pi.reference_number = ?
                ORDER BY pi.created_at DESC
                LIMIT 1
            `;
            gcashParams = [order.payment_intent_id];
        } else {
            // If no payment_intent_id, try to find by order_id
            gcashQuery = `
                SELECT 
                    pi.id,
                    pi.gcash_reference,
                    pi.amount,
                    pi.status,
                    pi.payment_type,
                    pi.total_amount,
                    pi.created_at,
                    pi.verified_at,
                    NULL as receipt_url
                FROM payment_intents pi
                WHERE pi.order_id = ?
                ORDER BY pi.created_at DESC
                LIMIT 1
            `;
            gcashParams = [orderId];
        }
        
        const [gcashDetails] = await db.execute(gcashQuery, gcashParams);
        
        if (gcashDetails.length === 0) {
            return res.status(404).json({ message: 'GCash payment details not found' });
        }
        
        res.json(gcashDetails[0]);
        
    } catch (error) {
        console.error('Error fetching GCash details:', error);
        res.status(500).json({ message: 'Error fetching GCash payment details' });
    }
};

exports.verifyGCashPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { isValid, gcash_reference } = req.body;
        
        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // First, get the order details
            const orderQuery = `
                SELECT 
                    o.order_id,
                    o.status,
                    o.payment_method,
                    o.payment_intent_id,
                    o.total_amount
                FROM orders o
                WHERE o.order_id = ?
            `;
            
            const [orders] = await connection.execute(orderQuery, [orderId]);
            
            if (orders.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ message: 'Order not found' });
            }
            
            const order = orders[0];
            
            if (order.payment_method !== 'gcash') {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: 'Order does not use GCash payment method' });
            }
            
            if (order.status !== 'to verify') {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: 'Order is not in verification status' });
            }
            
            if (isValid) {
                // Approve the payment - update order status to pending
                const updateOrderQuery = `
                    UPDATE orders 
                    SET status = 'pending', 
                        payment_status = 'paid',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE order_id = ?
                `;
                
                await connection.execute(updateOrderQuery, [orderId]);
                
                // Update payment intent status if exists
                if (gcash_reference) {
                    const updatePaymentQuery = `
                        UPDATE payment_intents 
                        SET status = 'verified', 
                            verified_at = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE gcash_reference = ?
                    `;
                    
                    await connection.execute(updatePaymentQuery, [gcash_reference]);
                }
                
                // *** ADD REWARD POINTS FOR VERIFIED GCASH PAYMENT ***
                try {
                    const Reward = require('../models/rewardModel');
                    
                    // Check if points were already added for this order
                    const [existingPoints] = await connection.execute(
                        'SELECT COUNT(*) as count FROM user_rewards WHERE order_id = ? AND points > 0',
                        [orderId]
                    );
                    
                    console.log(`🔍 Checking existing points for order ${orderId}: ${existingPoints[0].count}`);
                    
                    if (existingPoints[0].count === 0) {
                        // Get user_id from order
                        const [orderUser] = await connection.execute(
                            'SELECT user_id FROM orders WHERE order_id = ?',
                            [orderId]
                        );
                        
                        if (orderUser.length > 0) {
                            const userId = orderUser[0].user_id;
                            const orderAmount = parseFloat(order.total_amount);
                            
                            console.log(`🎯 Adding reward points for verified GCash payment - Order #${orderId}, User: ${userId}, Amount: ₱${orderAmount}`);
                            const pointsEarned = await Reward.addPoints(userId, orderId, orderAmount);
                            console.log(`✅ SUCCESS! Points earned for verified GCash payment: ${pointsEarned} points`);
                        }
                    } else {
                        console.log(`⚠️ Points already added for order #${orderId}, skipping duplicate addition`);
                    }
                } catch (pointsError) {
                    console.error('❌ ERROR adding reward points:', pointsError);
                    // Don't fail the verification if points addition fails
                }
                
                await connection.commit();
                
                res.json({ 
                    message: 'GCash payment verified successfully', 
                    orderId: orderId,
                    newStatus: 'pending'
                });
                
            } else {
                // Reject the payment - update order status to cancelled
                const updateOrderQuery = `
                    UPDATE orders 
                    SET status = 'cancelled', 
                        payment_status = 'failed',
                        cancel_reason = 'GCash payment verification failed',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE order_id = ?
                `;
                
                await connection.execute(updateOrderQuery, [orderId]);
                
                // Update payment intent status if exists
                if (gcash_reference) {
                    const updatePaymentQuery = `
                        UPDATE payment_intents 
                        SET status = 'rejected', 
                            updated_at = CURRENT_TIMESTAMP
                        WHERE gcash_reference = ?
                    `;
                    
                    await connection.execute(updatePaymentQuery, [gcash_reference]);
                }
                
                await connection.commit();
                
                res.json({ 
                    message: 'GCash payment rejected', 
                    orderId: orderId,
                    newStatus: 'cancelled'
                });
            }
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error verifying GCash payment:', error);
        res.status(500).json({ message: 'Error verifying GCash payment' });
    }
};

