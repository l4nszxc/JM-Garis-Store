const axios = require('axios');
require('dotenv').config();

class PayMongoService {
    constructor() {
        this.baseURL = 'https://api.paymongo.com/v1';
        
        // Use environment variables with fallbacks for development
        this.publicKey = process.env.PAYMONGO_PUBLIC_KEY;
        this.secretKey = process.env.PAYMONGO_SECRET_KEY;
        
        // Validate that keys are provided
        if (!this.publicKey || !this.secretKey) {
            console.warn('PayMongo keys not found in environment variables. Payment functionality may not work.');
        }
        
        // Log key prefixes for debugging (never log full keys)
        if (process.env.NODE_ENV === 'development') {
            console.log('PayMongo Public Key prefix:', this.publicKey?.substring(0, 10) + '...');
            console.log('PayMongo Secret Key prefix:', this.secretKey?.substring(0, 10) + '...');
        }
    }

    async createPaymentLink(amount, orderId, description = 'Order Payment') {
        if (!this.publicKey || !this.secretKey) {
            throw new Error('PayMongo credentials not configured. Please check environment variables.');
        }

        try {
            const response = await axios.post(
                `${this.baseURL}/links`,
                {
                    data: {
                        attributes: {
                            amount: Math.round(amount * 100), // Convert to centavos
                            description: `${description} - Order #${orderId}`,
                            remarks: `JM Garis Store - Order ${orderId}`,
                            currency: 'PHP',
                            // Add reference number to track in dashboard
                            reference_number: orderId.toString(),
                            // Add redirect URLs for better tracking
                            redirect: {
                                success: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/payment-success?order_id=${orderId}`,
                                failed: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/payment-failed?order_id=${orderId}`
                            }
                        }
                    }
                },
                {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(this.secretKey).toString('base64')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('PayMongo Link Created:', response.data.data);
            return response.data.data;
        } catch (error) {
            console.error('Error creating payment link:', error.response?.data || error.message);
            throw new Error('Failed to create payment link');
        }
    }

    async getPaymentLink(linkId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/links/${linkId}`,
                {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(this.secretKey).toString('base64')}`
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error('Error retrieving payment link:', error.response?.data || error.message);
            throw new Error('Failed to retrieve payment link');
        }
    }

    async archivePaymentLink(linkId) {
        try {
            const response = await axios.post(
                `${this.baseURL}/links/${linkId}/archive`,
                {},
                {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(this.secretKey).toString('base64')}`
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error('Error archiving payment link:', error.response?.data || error.message);
            throw new Error('Failed to archive payment link');
        }
    }
}

module.exports = new PayMongoService();