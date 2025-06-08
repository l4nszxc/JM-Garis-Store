const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'lanslorence@gmail.com', // Replace with your Gmail
        pass: 'dwha kvpo ogpk txmg' // Use an App Password from Google Account
    }
});

exports.sendOTP = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: '"Your App" <storeofjmgaris@gmail.com>',
            to: email,
            subject: "Email Verification OTP",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>Email Verification</h2>
                    <p>Your OTP for email verification is:</p>
                    <h1 style="color: #4CAF50; font-size: 32px;">${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                </div>
            `
        });
    } catch (error) {
        throw error;
    }
};
exports.sendPasswordResetOTP = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: '"Your App" <storeofjmgaris@gmail.com',
            to: email,
            subject: "Password Reset OTP",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>Password Reset Request</h2>
                    <p>Your OTP for password reset is:</p>
                    <h1 style="color: #4CAF50; font-size: 32px;">${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        });
    } catch (error) {
        throw error;
    }
};
exports.sendOrderStatusReceipt = async (email, order, status, paymentDetails = null) => {
    try {
        if (!email) {
            throw new Error('Recipient email is required');
        }

        const safeNumber = (num) => (typeof num === 'number' || typeof num === 'string') ? 
            Number(num).toFixed(2) : '0.00';

        const statusMessages = {
            'preparing': 'Your order is now being prepared!',
            'ready for pickup': 'Your order is ready for pickup!',
            'paid': 'Thank you for your payment! We hope to serve you again!'
        };

        const items = order.items.map(item => {
            const displayName = item.choice_name 
                ? `${item.name} (${item.choice_name})`
                : item.name;
            const itemTotal = (item.price * item.quantity);
            
            return `
                <tr>
                    <td style="padding: 8px;">${displayName}</td>
                    <td style="padding: 8px; text-align: center;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right;">₱${safeNumber(itemTotal)}</td>
                </tr>
            `;
        }).join('');

        const subtotal = order.subtotal || order.total_amount || 0;
        const discountAmount = order.discount_amount || 0;
        const totalAmount = order.total_amount || 0;

        const paymentSection = status.toLowerCase() === 'paid' && paymentDetails ? `
            <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Cash Amount:</td>
                <td style="padding: 12px; text-align: right;">₱${safeNumber(paymentDetails.cashAmount)}</td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Change:</td>
                <td style="padding: 12px; text-align: right;">₱${safeNumber(paymentDetails.changeAmount)}</td>
            </tr>
        ` : '';

        const priceBreakdown = `
            <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Subtotal:</td>
                <td style="padding: 12px; text-align: right;">₱${safeNumber(subtotal)}</td>
            </tr>
            ${Number(discountAmount) > 0 ? `
            <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; color: #4CAF50;">Discount:</td>
                <td style="padding: 12px; text-align: right; color: #4CAF50;">-₱${safeNumber(discountAmount)}</td>
            </tr>
            ` : ''}
            <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; font-size: 1.1em;">Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 1.1em;">₱${safeNumber(totalAmount)}</td>
            </tr>
            ${paymentSection}
        `;

        await transporter.sendMail({
            from: '"JM Garis Store" <storeofjmgaris@gmail.com>',
            to: email,
            subject: `Order #${order.order_id} - ${status.toUpperCase()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px 0; background-color: #f8f9fa; margin-bottom: 20px;">
                        <h1 style="color: #2c3e50; margin: 0;">JM Garis Store</h1>
                        <p style="color: #2c3e50; margin: 10px 0 0;">Order Status Update</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h2 style="color: #2c3e50;">${statusMessages[status.toLowerCase()]}</h2>
                        <p><strong>Order ID:</strong> ${order.order_id}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Status:</strong> ${status}</p>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 12px; text-align: left;">Item</th>
                                <th style="padding: 12px; text-align: center;">Qty</th>
                                <th style="padding: 12px; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items}
                        </tbody>
                        <tfoot>
                            ${priceBreakdown}
                        </tfoot>
                    </table>

                    <div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
                        <p style="margin: 0;">Thank you for choosing JM Garis Store!</p>
                        <p style="margin: 10px 0 0; font-size: 0.9em;">This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            `
        });
    } catch (error) {
        console.error('Error sending order status email:', error);
        throw error;
    }
};