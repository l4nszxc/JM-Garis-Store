<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal-content">
            <div class="payment-status">
                <div class="status-icon">
                    <i class="fas fa-credit-card fa-pulse"></i>
                </div>
                <h3>Processing Payment</h3>
                <p>Please complete your payment in the GCash window.</p>
                <div class="status-details">
                    <p><strong>Order ID:</strong> {{ orderId }}</p>
                    <p><strong>Amount:</strong> {{ formatPrice(amount) }}</p>
                </div>
                <div class="payment-instructions">
                    <ul>
                        <li>Complete your payment in the GCash window</li>
                        <li>Do not close this window until payment is complete</li>
                        <li>You will be notified when payment is processed</li>
                    </ul>
                </div>
                <button @click="$emit('cancel')" class="cancel-btn">
                    <i class="fas fa-times"></i>
                    Cancel Payment
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PaymentStatusModal',
    props: {
        show: Boolean,
        orderId: String,
        amount: Number
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price).replace('PHP', '₱');
        }
    }
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1500;
}

.modal-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.payment-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
}

.status-icon {
    font-size: 4rem;
    color: #4CAF50;
}

.payment-status h3 {
    margin: 0;
    color: #2a3f2a;
    font-size: 1.5rem;
}

.payment-status p {
    margin: 0;
    color: #64748b;
    font-size: 1.1rem;
}

.status-details {
    background: #f8fff8;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e8f5e8;
    width: 100%;
}

.status-details p {
    margin: 0.5rem 0;
    text-align: left;
}

.payment-instructions {
    background: #f0f8ff;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e0f2fe;
    width: 100%;
}

.payment-instructions ul {
    margin: 0;
    padding-left: 1.5rem;
    text-align: left;
}

.payment-instructions li {
    margin: 0.5rem 0;
    color: #1976d2;
}

.cancel-btn {
    background: #f44336;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    transition: background-color 0.3s ease;
}

.cancel-btn:hover {
    background: #d32f2f;
}
</style>