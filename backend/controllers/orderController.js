const db = require('../config/db');
const Order = require('../models/orderModel.js');
const Reward = require('../models/rewardModel.js');
const SharedCart = require('../models/sharedCartModel'); 

exports.createOrder = async (req, res) => {
    try {
        const { items, discountId, plasticPackaging } = req.body;
        const userId = req.user.id;
        
        // Determine packaging preference
        const packagingPreference = plasticPackaging ? 'plastic' : 'eco';
        
        // Generate unique order ID
        const orderId = Math.floor(1000000 + Math.random() * 9000000).toString();
        
        // Calculate total amount
        let totalAmount = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);
        
        // Apply discount if provided
        let appliedDiscount = 0;
        if (discountId) {
            const [discount] = await db.execute(
                'SELECT amount FROM available_discounts WHERE id = ? AND user_id = ? AND used = 0 AND expires_at > NOW()',
                [discountId, userId]
            );
            
            if (discount.length > 0) {
                appliedDiscount = discount[0].amount;
                totalAmount = Math.max(0, totalAmount - appliedDiscount);
                
                // Mark discount as used
                await db.execute(
                    'UPDATE available_discounts SET used = 1, order_id = ? WHERE id = ?',
                    [orderId, discountId]
                );
            }
        }
        
        // Create the order with packaging preference
        await db.execute(
            `INSERT INTO orders (order_id, user_id, total_amount, status, packaging_preference, created_at, updated_at) 
             VALUES (?, ?, ?, 'pending', ?, NOW(), NOW())`,
            [orderId, userId, totalAmount, packagingPreference]
        );
        
        // Insert order items
        for (const item of items) {
            await db.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price, choice_id) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price, item.choice_id || null]
            );
            
            // Remove from cart
            await db.execute(
                'DELETE FROM cart WHERE id = ? AND user_id = ?',
                [item.id, userId]
            );
        }
        
        // Award points based on total amount
        const pointsEarned = Math.floor(totalAmount / 100);
        if (pointsEarned > 0) {
            await db.execute(
                'INSERT INTO user_points (user_id, order_id, points, description, created_at) VALUES (?, ?, ?, ?, NOW())',
                [userId, orderId, pointsEarned, `Earned points from order #${orderId} (₱${totalAmount})`]
            );
        }
        
        res.status(201).json({
            success: true,
            orderId,
            finalAmount: totalAmount,
            appliedDiscount,
            pointsEarned,
            packagingPreference
        });
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create order',
            error: error.message 
        });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const orders = await Order.getUserOrders(req.user.id);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Cancellation reason is required' });
        }

        // Verify order belongs to user
        const [order] = await db.execute(
            'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
            [orderId, req.user.id]
        );

        if (!order.length) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order[0].status !== 'pending') {
            return res.status(400).json({ 
                message: 'Only pending orders can be cancelled' 
            });
        }

        await Order.cancelOrder(orderId, reason);
        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ message: 'Error canceling order' });
    }
};
exports.submitOrderReport = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;
    const { issue_type, description } = req.body;
    
    // Validate input
    if (!issue_type || !description) {
      return res.status(400).json({ message: 'Issue type and description are required' });
    }
    
    // Check if order exists and belongs to the user
    const [orderExists] = await db.execute(
      'SELECT order_id FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );
    
    if (orderExists.length === 0) {
      return res.status(404).json({ message: 'Order not found or you don\'t have permission to report this order' });
    }
    
    // Insert the report
    const [result] = await db.execute(
      'INSERT INTO order_reports (order_id, user_id, issue_type, description) VALUES (?, ?, ?, ?)',
      [orderId, userId, issue_type, description]
    );
    
    res.status(201).json({ 
      message: 'Order report submitted successfully',
      reportId: result.insertId
    });
  } catch (error) {
    console.error('Error submitting order report:', error);
    res.status(500).json({ message: 'Error submitting order report' });
  }
};

exports.getOrderReports = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;
    
    // Check if the order belongs to the user or if the user is admin/staff
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      const [orderCheck] = await db.execute(
        'SELECT order_id FROM orders WHERE order_id = ? AND user_id = ?',
        [orderId, userId]
      );
      
      if (orderCheck.length === 0) {
        return res.status(403).json({ message: 'You don\'t have permission to view these reports' });
      }
    }
    
    // Get the reports
    const [reports] = await db.execute(
      `SELECT r.*, u.username 
       FROM order_reports r
       JOIN users u ON r.user_id = u.id
       WHERE r.order_id = ?
       ORDER BY r.created_at DESC`,
      [orderId]
    );
    
    res.json(reports);
  } catch (error) {
    console.error('Error getting order reports:', error);
    res.status(500).json({ message: 'Error getting order reports' });
  }
};

exports.submitOrderReview = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
    }
    
    // Check if the order exists, belongs to the user, and is in 'paid' status
    const [orderCheck] = await db.execute(
      'SELECT order_id FROM orders WHERE order_id = ? AND user_id = ? AND status = "paid"',
      [orderId, userId]
    );
    
    if (orderCheck.length === 0) {
      return res.status(400).json({ 
        message: 'Order not found, not owned by you, or not in paid status' 
      });
    }
    
    // Check if a review already exists
    const [existingReview] = await db.execute(
      'SELECT id FROM order_reviews WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );
    
    if (existingReview.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this order' });
    }
    
    // Insert the review
    const [result] = await db.execute(
      'INSERT INTO order_reviews (order_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [orderId, userId, rating, comment || null]
    );
    
    res.status(201).json({ 
      message: 'Order review submitted successfully',
      reviewId: result.insertId
    });
  } catch (error) {
    console.error('Error submitting order review:', error);
    res.status(500).json({ message: 'Error submitting order review' });
  }
};

exports.updateOrderReview = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
    }
    
    // Check if the review exists and belongs to the user
    const [reviewCheck] = await db.execute(
      'SELECT id FROM order_reviews WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );
    
    if (reviewCheck.length === 0) {
      return res.status(404).json({ message: 'Review not found or you don\'t have permission to update it' });
    }
    
    // Update the review
    await db.execute(
      'UPDATE order_reviews SET rating = ?, comment = ? WHERE order_id = ? AND user_id = ?',
      [rating, comment || null, orderId, userId]
    );
    
    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating order review:', error);
    res.status(500).json({ message: 'Error updating order review' });
  }
};

exports.getOrderReview = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;
    
    // Check if order belongs to the user
    const [orderCheck] = await db.execute(
      'SELECT order_id FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );
    
    if (orderCheck.length === 0) {
      return res.status(403).json({ message: 'You don\'t have permission to view this review' });
    }
    
    // Get the review
    const [reviews] = await db.execute(
      `SELECT * FROM order_reviews WHERE order_id = ? AND user_id = ?`,
      [orderId, userId]
    );
    
    if (reviews.length === 0) {
      return res.json({ review: null });
    }
    
    res.json({ review: reviews[0] });
  } catch (error) {
    console.error('Error getting order review:', error);
    res.status(500).json({ message: 'Error getting order review' });
  }
};
exports.repeatOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { replaceCart = false } = req.body;
    const userId = req.user.id;

    // Get the order details and items
    const [orderResult] = await db.execute(
      `SELECT o.*, u.username 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.order_id = ? AND o.user_id = ? AND o.status = 'paid'`,
      [orderId, userId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ message: 'Order not found or not eligible for repeat' });
    }

    // Get order items
    const [items] = await db.execute(
      `SELECT oi.product_id, oi.quantity, oi.choice_id, p.name, p.stock_quantity,
              pc.stock as choice_stock, pc.name as choice_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.products_id
       LEFT JOIN product_choices pc ON oi.choice_id = pc.choice_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    if (items.length === 0) {
      return res.status(404).json({ message: 'No items found for this order' });
    }

    // Check stock availability for all items
    const unavailableItems = [];
    for (const item of items) {
      const availableStock = item.choice_id ? item.choice_stock : item.stock_quantity;
      if (availableStock < item.quantity) {
        unavailableItems.push({
          name: item.name,
          choice_name: item.choice_name,
          requested: item.quantity,
          available: availableStock
        });
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({ 
        message: 'Some items are not available in requested quantities',
        unavailableItems 
      });
    }

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // If replace cart is true, clear existing cart
      if (replaceCart) {
        await connection.execute(
          'DELETE FROM cart WHERE user_id = ?',
          [userId]
        );
      }

      // Add items to cart
      for (const item of items) {
        // Check if item already exists in cart
        const [existing] = await connection.execute(
          'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND (choice_id = ? OR (choice_id IS NULL AND ? IS NULL))',
          [userId, item.product_id, item.choice_id, item.choice_id]
        );

        if (existing.length > 0 && !replaceCart) {
          // Update existing cart item quantity
          await connection.execute(
            'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
            [item.quantity, existing[0].id]
          );
        } else {
          // Insert new cart item
          await connection.execute(
            'INSERT INTO cart (user_id, product_id, quantity, choice_id) VALUES (?, ?, ?, ?)',
            [userId, item.product_id, item.quantity, item.choice_id]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.json({ 
        message: replaceCart ? 'Cart replaced with repeated order' : 'Items added to cart from repeated order',
        itemsAdded: items.length
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error repeating order:', error);
    res.status(500).json({ message: 'Error repeating order' });
  }
};