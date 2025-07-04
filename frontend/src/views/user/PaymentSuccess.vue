<template>
    <div class="payment-result-container">
        <div class="result-content">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h1>Payment Successful!</h1>
            <p>Your GCash payment has been processed successfully.</p>
            <div class="order-info" v-if="orderId">
                <p><strong>Order ID:</strong> {{ orderId }}</p>
                <p>You will receive a confirmation shortly.</p>
            </div>
            <div class="action-buttons">
                <button @click="goToOrders" class="primary-btn">
                    <i class="fas fa-list"></i> View Orders
                </button>
                <button @click="goToHome" class="secondary-btn">
                    <i class="fas fa-home"></i> Back to Home
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PaymentSuccess',
    data() {
        return {
            orderId: null
        }
    },
    mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        this.orderId = urlParams.get('order_id');
        
        // Check if this is running in a popup window
        if (window.opener && !window.opener.closed) {
            // This is a popup window, close it automatically after a delay
            setTimeout(() => {
                window.close();
            }, 3000);
        }
    },
    methods: {
        goToOrders() {
            this.$router.push('/order-history');
        },
        goToHome() {
            this.$router.push('/');
        }
    }
}
</script>

<style scoped>
.payment-result-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
}

.result-content {
    background: white;
    padding: 3rem;
    border-radius: 20px;
    text-align: center;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.success-icon {
    font-size: 5rem;
    color: #4CAF50;
    margin-bottom: 1.5rem;
}

h1 {
    color: #2a3f2a;
    margin-bottom: 1rem;
    font-size: 2rem;
}

p {
    color: #64748b;
    margin-bottom: 1rem;
    font-size: 1.1rem;
}

.order-info {
    background: #f8fff8;
    padding: 1.5rem;
    border-radius: 12px;
    margin: 2rem 0;
    border: 1px solid #e8f5e8;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
}

.primary-btn, .secondary-btn {
    padding: 1rem 2rem;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    text-decoration: none;
    font-size: 1rem;
}

.primary-btn {
    background: #4CAF50;
    color: white;
}

.primary-btn:hover {
    background: #45a049;
    transform: translateY(-2px);
}

.secondary-btn {
    background: #f8f9fa;
    color: #64748b;
    border: 2px solid #e2e8f0;
}

.secondary-btn:hover {
    background: #e9ecef;
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .result-content {
        padding: 2rem;
    }
    
    .action-buttons {
        flex-direction: column;
    }
    
    .primary-btn, .secondary-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>