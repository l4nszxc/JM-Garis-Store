const db = require('../config/db');
const Order = require('../models/orderModel.js');
const Reward = require('../models/rewardModel.js');
const SharedCart = require('../models/sharedCartModel'); 

exports.createOrder = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { items, totalAmount, discountId, packagingPreference, paymentMethod, paymentId, status } = req.body;
        const userId = req.user.id;

        // Debug logs
        console.log('=== ORDER CREATION DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Packaging preference from request:', packagingPreference);
        console.log('Payment method from request:', paymentMethod);
        console.log('Payment ID from request:', paymentId);
        console.log('Status from request:', status);
        console.log('Type of packagingPreference:', typeof packagingPreference);

        // Validate inputs
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'No items provided' });
        }

        // Validate and convert totalAmount to proper decimal
        const validatedTotalAmount = parseFloat(totalAmount);
        if (isNaN(validatedTotalAmount) || validatedTotalAmount <= 0) {
            return res.status(400).json({ message: 'Invalid total amount' });
        }

        // Validate packaging preference (default to 'eco' if not provided)
        const validPackagingPreference = ['eco', 'plastic'].includes(packagingPreference) ? packagingPreference : 'eco';

        // Validate payment method (default to 'cash' if not provided)
        const validPaymentMethod = ['cash', 'gcash', 'hatid'].includes(paymentMethod) ? paymentMethod : 'cash';

        // Validate status for GCash payments
        const orderStatus = status || (validPaymentMethod === 'gcash' ? 'paid using gcash' : 'pending');

        // Debug log
        console.log('Creating order with validated total amount:', validatedTotalAmount);
        console.log('Creating order with items:', items);
        console.log('Packaging preference received:', packagingPreference);
        console.log('Validated packaging preference:', validPackagingPreference);
        console.log('Payment method received:', paymentMethod);
        console.log('Validated payment method:', validPaymentMethod);
        console.log('Order status:', orderStatus);

        let finalAmount = validatedTotalAmount;
        let appliedDiscount = 0;

        // Apply discount if provided
        if (discountId) {
            try {
                appliedDiscount = await Reward.applyDiscount(userId, null, discountId);
                finalAmount = Math.max(0, validatedTotalAmount - appliedDiscount);
                console.log(`Applied discount: ₱${appliedDiscount}, Final amount: ₱${finalAmount}`);
            } catch (error) {
                console.error('Error applying discount:', error);
            }
        }
        
        // IMPORTANT: Pass packaging preference, payment method, and status as parameters
        console.log('Calling Order.create with packaging preference:', validPackagingPreference, 'payment method:', validPaymentMethod, 'and status:', orderStatus);
        const orderId = await Order.create(userId, items, finalAmount, validPackagingPreference, validPaymentMethod, orderStatus);

        // If this is a GCash payment with paymentId, link the payment to the order
        if (validPaymentMethod === 'gcash' && paymentId) {
            await connection.execute(
                'UPDATE payment_intents SET order_id = ? WHERE payment_link_id = ?',
                [orderId, paymentId]
            );
        }

        // Double-check: Update the order to ensure packaging preference, payment method, and status are set correctly
        console.log('Double-checking order details update for order:', orderId);
        await connection.execute(
            'UPDATE orders SET packaging_preference = ?, payment_method = ?, status = ? WHERE order_id = ?',
            [validPackagingPreference, validPaymentMethod, orderStatus, orderId]
        );

        // Verify the final state
        const [finalVerification] = await connection.execute(
            'SELECT order_id, packaging_preference, payment_method, status, total_amount FROM orders WHERE order_id = ?',
            [orderId]
        );
        console.log('=== FINAL VERIFICATION ===');
        console.log('Order in database:', finalVerification[0]);

        // If discount was applied, update the order_id in available_discounts
        if (discountId && appliedDiscount > 0) {
            await connection.execute(
                'UPDATE available_discounts SET order_id = ?, used = TRUE WHERE id = ?',
                [orderId, discountId]
            );
        }

        // Check if user has an active shared cart and terminate it
        const activeShare = await SharedCart.getActiveSharedCart(userId);
        if (activeShare && activeShare.shareId) {
            await db.execute(
                'UPDATE shared_carts SET status = "expired" WHERE share_id = ? AND status = "active"',
                [activeShare.shareId]
            );
        }

        await connection.commit();

        // Add reward points for the final amount paid
        let pointsEarned = 0;
        try {
            console.log(`Adding reward points for order ${orderId} with final amount: ₱${finalAmount}`);
            pointsEarned = await Reward.addPoints(userId, orderId, finalAmount);
            console.log(`Points earned for order ${orderId}: ${pointsEarned} points`);
        } catch (error) {
            console.error('Error adding reward points:', error);
        }

        res.status(201).json({ 
            orderId,
            pointsEarned,
            appliedDiscount,
            finalAmount,
            packagingPreference: validPackagingPreference,
            paymentMethod: validPaymentMethod,
            status: orderStatus,
            message: 'Order created successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order: ' + error.message });
    } finally {
        connection.release();
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