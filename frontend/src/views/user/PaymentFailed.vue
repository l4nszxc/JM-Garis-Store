<template>
    <div class="payment-result-container">
        <div class="result-content">
            <div class="failed-icon">
                <i class="fas fa-times-circle"></i>
            </div>
            <h1>Payment Failed</h1>
            <p>Unfortunately, your GCash payment could not be processed.</p>
            <div class="error-info">
                <p>Please try again or use a different payment method.</p>
                <p><small>If you continue to experience issues, please contact our support.</small></p>
            </div>
            <div class="action-buttons">
                <button @click="goToCart" class="primary-btn">
                    <i class="fas fa-shopping-cart"></i> Back to Cart
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
    name: 'PaymentFailed',
    methods: {
        goToCart() {
            this.$router.push('/cart');
        },
        goToHome() {
            this.$router.push('/');
        }
    },
    mounted() {
        // Check if this is running in a popup window
        if (window.opener && !window.opener.closed) {
            // This is a popup window, close it automatically after a delay
            setTimeout(() => {
                window.close();
            }, 5000);
        }
    },
}
</script>

<style scoped>
.payment-result-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
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

.failed-icon {
    font-size: 5rem;
    color: #dc2626;
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

.error-info {
    background: #fef2f2;
    padding: 1.5rem;
    border-radius: 12px;
    margin: 2rem 0;
    border: 1px solid #fecaca;
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

