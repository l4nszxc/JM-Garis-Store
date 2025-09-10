const paymongoService = require('../services/paymongoService');
const db = require('../config/db');

exports.createGCashDownpayment = async (req, res) => {
    try {
        const { downpaymentAmount, totalAmount, remainingAmount, items, discountId, packagingPreference, paymentMethod } = req.body;
        const userId = req.user.id;
        
        // Generate a temporary payment reference for downpayment
        const tempReference = `downpay_${Date.now()}_${userId}`;
        
        // Create PayMongo payment link for downpayment
        const paymentLink = await paymongoService.createPaymentLink(
            downpaymentAmount,
            tempReference,
            'JM Garis Store - Downpayment (25%)'
        );
        
        console.log('Downpayment Link Created:', paymentLink);
        
        // Store payment info in database with order data for later use
        const downpaymentData = {
            items, 
            discountId, 
            packagingPreference, 
            paymentMethod, 
            totalAmount, 
            remainingAmount, 
            downpaymentAmount,
            type: 'downpayment'
        };
        
        await db.execute(
            `INSERT INTO payment_intents (
                payment_link_id, 
                paymongo_link_id,
                reference_number,
                amount, 
                status,
                order_data,
                user_id,
                payment_type,
                total_amount,
                remaining_amount
            ) VALUES (?, ?, ?, ?, 'pending', ?, ?, 'downpayment', ?, ?)`,
            [
                paymentLink.id, 
                paymentLink.id,
                paymentLink.attributes.reference_number,
                downpaymentAmount,
                JSON.stringify(downpaymentData),
                userId,
                totalAmount,
                remainingAmount
            ]
        );
        
        res.json({
            paymentId: paymentLink.id,
            linkId: paymentLink.id,
            checkoutUrl: paymentLink.attributes.checkout_url,
            referenceNumber: paymentLink.attributes.reference_number,
            amount: paymentLink.attributes.amount / 100,
            downpaymentAmount,
            remainingAmount
        });
        
    } catch (error) {
        console.error('Error creating downpayment:', error);
        res.status(500).json({ message: 'Failed to create downpayment' });
    }
};

exports.checkDownpaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        const [payments] = await db.execute(
            'SELECT * FROM payment_intents WHERE payment_link_id = ? AND payment_type = "downpayment" ORDER BY created_at DESC LIMIT 1',
            [paymentId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({ message: 'Downpayment not found' });
        }

        // Get the latest status from PayMongo
        try {
            const paymentLink = await paymongoService.getPaymentLink(payments[0].payment_link_id);
            
            // Update local status based on PayMongo status
            let localStatus = 'pending';
            if (paymentLink.attributes.status === 'paid') {
                localStatus = 'succeeded';
            } else if (paymentLink.attributes.status === 'unpaid') {
                localStatus = 'pending';
            } else if (paymentLink.attributes.status === 'expired') {
                localStatus = 'failed';
            }
            
            if (localStatus !== payments[0].status) {
                await db.execute(
                    'UPDATE payment_intents SET status = ? WHERE id = ?',
                    [localStatus, payments[0].id]
                );
                payments[0].status = localStatus;
            }
            
        } catch (error) {
            console.error('Error checking PayMongo status:', error);
        }
        
        res.json(payments[0]);
        
    } catch (error) {
        console.error('Error checking downpayment status:', error);
        res.status(500).json({ message: 'Failed to check downpayment status' });
    }
};

exports.createGCashPaymentOnly = async (req, res) => {
    try {
        const { amount, items, discountId, packagingPreference, paymentMethod } = req.body;
        const userId = req.user.id;
        
        // Generate a temporary payment reference
        const tempReference = `temp_${Date.now()}_${userId}`;
        
        // Create PayMongo payment link
        const paymentLink = await paymongoService.createPaymentLink(
            amount,
            tempReference,
            'JM Garis Store Order Payment'
        );
        
        console.log('Payment Link Created:', paymentLink);
        
        // Store payment info in database with order data for later use
        await db.execute(
            `INSERT INTO payment_intents (
                payment_link_id, 
                paymongo_link_id,
                reference_number,
                amount, 
                status,
                order_data,
                user_id,
                payment_type,
                total_amount
            ) VALUES (?, ?, ?, ?, 'pending', ?, ?, 'full_payment', ?)`,
            [
                paymentLink.id, 
                paymentLink.id,
                paymentLink.attributes.reference_number,
                amount,
                JSON.stringify({ items, discountId, packagingPreference, paymentMethod }),
                userId,
                amount
            ]
        );
        
        res.json({
            paymentId: paymentLink.id,
            linkId: paymentLink.id,
            checkoutUrl: paymentLink.attributes.checkout_url,
            referenceNumber: paymentLink.attributes.reference_number,
            amount: paymentLink.attributes.amount / 100
        });
        
    } catch (error) {
        console.error('Error creating GCash payment:', error);
        res.status(500).json({ message: 'Failed to create GCash payment' });
    }
};

exports.createGCashPayment = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        const userId = req.user.id;
        
        // Verify order belongs to user and is pending
        const [orders] = await db.execute(
            'SELECT * FROM orders WHERE order_id = ? AND user_id = ? AND status = "pending"',
            [orderId, userId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found or already processed' });
        }
        
        // Create PayMongo payment link
        const paymentLink = await paymongoService.createPaymentLink(
            amount,
            orderId,
            'JM Garis Store Order Payment'
        );
        
        console.log('Payment Link Created:', paymentLink);
        
        // Store comprehensive payment info in database
        await db.execute(
            `INSERT INTO payment_intents (
                order_id, 
                payment_link_id, 
                paymongo_link_id,
                reference_number,
                amount, 
                status, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
            [
                orderId, 
                paymentLink.id, 
                paymentLink.id,
                paymentLink.attributes.reference_number,
                amount
            ]
        );
        
        res.json({
            linkId: paymentLink.id,
            checkoutUrl: paymentLink.attributes.checkout_url,
            referenceNumber: paymentLink.attributes.reference_number,
            amount: paymentLink.attributes.amount / 100
        });
        
    } catch (error) {
        console.error('Error creating GCash payment:', error);
        res.status(500).json({ message: 'Failed to create GCash payment' });
    }
};

exports.handlePaymentResult = async (req, res) => {
    try {
        const { status, reference_number } = req.query;
        
        if (status === 'success') {
            // Update order status to paid using gcash
            await db.execute(
                'UPDATE orders SET status = "paid using gcash" WHERE order_id = ?',
                [reference_number]
            );
            
            // Update payment status
            await db.execute(
                'UPDATE payment_intents SET status = "succeeded" WHERE order_id = ?',
                [reference_number]
            );
            
            // Redirect to success page
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/payment-success?order_id=${reference_number}`);
        } else {
            // Update payment status to failed
            await db.execute(
                'UPDATE payment_intents SET status = "failed" WHERE order_id = ?',
                [reference_number]
            );
            
            // Redirect to failed page
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/payment-failed?order_id=${reference_number}`);
        }
        
    } catch (error) {
        console.error('Error handling payment result:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/payment-failed`);
    }
};

exports.checkPaymentStatusByPaymentId = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        const [payments] = await db.execute(
            'SELECT * FROM payment_intents WHERE payment_link_id = ? ORDER BY created_at DESC LIMIT 1',
            [paymentId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Get the latest status from PayMongo
        try {
            const paymentLink = await paymongoService.getPaymentLink(payments[0].payment_link_id);
            
            // Update local status based on PayMongo status
            let localStatus = 'pending';
            if (paymentLink.attributes.status === 'paid') {
                localStatus = 'succeeded';
            } else if (paymentLink.attributes.status === 'unpaid') {
                localStatus = 'pending';
            } else if (paymentLink.attributes.status === 'expired') {
                localStatus = 'failed';
            }
            
            if (localStatus !== payments[0].status) {
                await db.execute(
                    'UPDATE payment_intents SET status = ? WHERE id = ?',
                    [localStatus, payments[0].id]
                );
                payments[0].status = localStatus;
            }
            
        } catch (error) {
            console.error('Error checking PayMongo status:', error);
        }
        
        res.json(payments[0]);
        
    } catch (error) {
        console.error('Error checking payment status by payment ID:', error);
        res.status(500).json({ message: 'Failed to check payment status' });
    }
};

exports.checkPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const [payments] = await db.execute(
            'SELECT * FROM payment_intents WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
            [orderId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // If we have a payment link ID, get the latest status from PayMongo
        if (payments[0].payment_link_id) {
            try {
                const paymentLink = await paymongoService.getPaymentLink(payments[0].payment_link_id);
                
                // Update local status based on PayMongo status
                let localStatus = 'pending';
                if (paymentLink.attributes.status === 'paid') {
                    localStatus = 'succeeded';
                } else if (paymentLink.attributes.status === 'unpaid') {
                    localStatus = 'pending';
                }
                
                if (localStatus !== payments[0].status) {
                    await db.execute(
                        'UPDATE payment_intents SET status = ? WHERE id = ?',
                        [localStatus, payments[0].id]
                    );
                    payments[0].status = localStatus;
                }
                
                // If payment is successful, update order status
                if (localStatus === 'succeeded') {
                    await db.execute(
                        'UPDATE orders SET status = "paid using gcash" WHERE order_id = ?',
                        [orderId]
                    );
                }
            } catch (error) {
                console.error('Error checking PayMongo status:', error);
            }
        }
        
        res.json(payments[0]);
        
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ message: 'Failed to check payment status' });
    }
};

exports.webhookHandler = async (req, res) => {
    try {
        const event = req.body;
        console.log('PayMongo Webhook Received:', JSON.stringify(event, null, 2));
        
        // Verify webhook signature (recommended for production)
        // const signature = req.headers['paymongo-signature'];
        // if (!verifyWebhookSignature(req.body, signature)) {
        //     return res.status(400).json({ error: 'Invalid signature' });
        // }
        
        if (event.data && event.data.type === 'event') {
            const eventType = event.data.attributes.type;
            const eventData = event.data.attributes.data;
            
            console.log('Event Type:', eventType);
            console.log('Event Data:', eventData);
            
            switch (eventType) {
                case 'link.payment.paid':
                    await handleLinkPaymentPaid(eventData);
                    break;
                case 'link.payment.failed':
                    await handleLinkPaymentFailed(eventData);
                    break;
                case 'payment.paid':
                    await handlePaymentPaid(eventData);
                    break;
                case 'payment.failed':
                    await handlePaymentFailed(eventData);
                    break;
                default:
                    console.log('Unhandled event type:', eventType);
            }
        }
        
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: 'Webhook failed' });
    }
};
async function handleLinkPaymentPaid(data) {
    try {
        const referenceNumber = data.attributes.reference_number;
        console.log('Processing paid payment for reference:', referenceNumber);
        
        // Check if this is a temporary reference (new flow) or an order ID (old flow)
        if (referenceNumber.startsWith('temp_')) {
            // New flow: Create order after payment confirmation
            const [paymentIntents] = await db.execute(
                'SELECT * FROM payment_intents WHERE reference_number = ?',
                [referenceNumber]
            );
            
            if (paymentIntents.length > 0) {
                const paymentIntent = paymentIntents[0];
                const orderData = JSON.parse(paymentIntent.order_data);
                
                // Update payment status first
                await db.execute(
                    'UPDATE payment_intents SET status = "succeeded", updated_at = NOW() WHERE reference_number = ?',
                    [referenceNumber]
                );
                
                // Create the order with the stored data
                const orderId = await createOrderFromPayment(paymentIntent.user_id, orderData, paymentIntent.amount, paymentIntent.payment_link_id);
                
                console.log('Successfully created order after payment confirmation:', orderId);
            }
        } else {
            // Old flow: Update existing order status
            await db.execute(
                'UPDATE orders SET status = "paid using gcash", paid_at = NOW() WHERE order_id = ?',
                [referenceNumber]
            );
            
            await db.execute(
                'UPDATE payment_intents SET status = "succeeded", updated_at = NOW() WHERE order_id = ?',
                [referenceNumber]
            );
            
            console.log('Successfully updated order status to paid for order:', referenceNumber);
        }
        
    } catch (error) {
        console.error('Error handling paid payment:', error);
    }
}

async function createOrderFromPayment(userId, orderData, amount, paymentId) {
    const Order = require('../models/orderModel');
    const Reward = require('../models/rewardModel');
    
    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        const { items, discountId, packagingPreference, paymentMethod } = orderData;
        
        let finalAmount = amount / 100; // PayMongo amounts are in centavos
        let appliedDiscount = 0;

        // Apply discount if provided
        if (discountId) {
            try {
                appliedDiscount = await Reward.applyDiscount(userId, null, discountId);
                finalAmount = Math.max(0, finalAmount - appliedDiscount);
            } catch (error) {
                console.error('Error applying discount:', error);
            }
        }
        
        // Create order with paid status
        const orderId = await Order.create(userId, items, finalAmount, packagingPreference, paymentMethod, 'paid using gcash');
        
        // Link payment to order
        await connection.execute(
            'UPDATE payment_intents SET order_id = ? WHERE payment_link_id = ?',
            [orderId, paymentId]
        );
        
        // Add reward points
        try {
            await Reward.addPoints(userId, orderId, finalAmount);
        } catch (error) {
            console.error('Error adding reward points:', error);
        }
        
        await connection.commit();
        connection.release();
        
        return orderId;
    } catch (error) {
        console.error('Error creating order from payment:', error);
        throw error;
    }
}

async function handleLinkPaymentFailed(data) {
    try {
        const referenceNumber = data.attributes.reference_number;
        console.log('Processing failed payment for reference:', referenceNumber);
        
        // Update payment status to failed
        await db.execute(
            'UPDATE payment_intents SET status = "failed", updated_at = NOW() WHERE reference_number = ?',
            [referenceNumber]
        );
        
        // For old flow, also check if there's an order to update
        if (!referenceNumber.startsWith('temp_')) {
            await db.execute(
                'UPDATE payment_intents SET status = "failed", updated_at = NOW() WHERE order_id = ?',
                [referenceNumber]
            );
        }
        
        console.log('Successfully updated payment status to failed for reference:', referenceNumber);
    } catch (error) {
        console.error('Error handling failed payment:', error);
    }
}

async function handlePaymentPaid(data) {
    // Handle direct payment events if needed
    console.log('Direct payment paid event:', data);
}

async function handlePaymentFailed(data) {
    // Handle direct payment failed events if needed
    console.log('Direct payment failed event:', data);
}