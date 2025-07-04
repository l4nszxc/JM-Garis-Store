const paymongoService = require('../services/paymongoService');
const db = require('../config/db');

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
        const orderId = data.attributes.reference_number;
        console.log('Processing paid payment for order:', orderId);
        
        // Update order status
        await db.execute(
            'UPDATE orders SET status = "paid using gcash", paid_at = NOW() WHERE order_id = ?',
            [orderId]
        );
        
        // Update payment status
        await db.execute(
            'UPDATE payment_intents SET status = "succeeded", updated_at = NOW() WHERE order_id = ?',
            [orderId]
        );
        
        console.log('Successfully updated order status to paid for order:', orderId);
    } catch (error) {
        console.error('Error handling paid payment:', error);
    }
}

async function handleLinkPaymentFailed(data) {
    try {
        const orderId = data.attributes.reference_number;
        console.log('Processing failed payment for order:', orderId);
        
        // Update payment status
        await db.execute(
            'UPDATE payment_intents SET status = "failed", updated_at = NOW() WHERE order_id = ?',
            [orderId]
        );
        
        console.log('Successfully updated payment status to failed for order:', orderId);
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