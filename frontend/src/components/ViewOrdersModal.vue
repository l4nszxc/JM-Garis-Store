<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal-content">
            <h3><i class="fas fa-clipboard-list"></i> Order Summary</h3>
            
            <!-- Add discount selection -->
            <div v-if="availableDiscounts.length" class="discount-section">
                <h4>Available Discounts</h4>
                <select v-model="selectedDiscountId" class="discount-select">
                    <option value="">No discount (₱0)</option>
                    <option v-for="discount in availableDiscounts" 
                            :key="discount.id" 
                            :value="discount.id">
                        ₱{{ discount.amount }} off
                    </option>
                </select>
            </div>

            <div class="scrollable-content">
                <div v-if="localItems.length > 0" class="order-items">
                    <div v-for="item in localItems" :key="item.id" class="order-item">
                        <img 
                            :src="item.image || '/img/placeholder.jpg'"
                            :alt="item.name"
                            class="order-item-image"
                            @error="handleImageError"
                        >
                        <div class="order-item-details">
                            <h4>{{ item.name }}</h4>
                            <p v-if="item.choice_name" class="choice-info">
                                <i class="fas fa-tag"></i> Option: {{ item.choice_name }}
                            </p>
                            <p class="item-price">Price: {{ formatPrice(item.price) }}</p>
                            <div class="quantity-controls">
                                <button 
                                    @click="updateQuantity(item.id, item.quantity - 1)"
                                    :disabled="item.quantity <= 1"
                                    class="quantity-btn"
                                >
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="quantity-value">{{ item.quantity }}</span>
                                <button 
                                    @click="updateQuantity(item.id, item.quantity + 1)"
                                    class="quantity-btn"
                                >
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <p class="item-subtotal">Subtotal: {{ formatPrice(item.price * item.quantity) }}</p>
                            <button class="remove-btn" @click="removeItem(item.id)">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else class="no-items">
                    <p>No items selected</p>
                </div>
            </div>

            <div class="fixed-bottom">
                <div class="order-total">
                    <div class="total-breakdown">
                        <p class="subtotal-line">Subtotal: {{ formatPrice(subtotal) }}</p>
                        <p v-if="discountAmount > 0" class="discount-line">
                            <i class="fas fa-tag"></i> Discount: -{{ formatPrice(discountAmount) }}
                        </p>
                        <h4 class="final-total">Total Amount: {{ formatPrice(calculateTotal) }}</h4>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button 
                        @click="confirmOrder" 
                        class="place-order-btn"
                        :disabled="localItems.length === 0"
                    >
                        <i class="fas fa-check"></i> Confirm Order
                    </button>
                    <button @click="$emit('close')" class="cancel-btn">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ViewOrdersModal',
    props: {
        show: Boolean,
        selectedItems: Array,
        availableDiscounts: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            localItems: [],
            selectedDiscountId: null,
            selectedDiscountId: '' ,
        }
    },
    watch: {
        show(newValue) {
            // Reset the items when modal opens
            if (newValue && this.selectedItems) {
                this.localItems = JSON.parse(JSON.stringify(this.selectedItems));
            }
        },
        selectedItems: {
            handler(newItems) {
                if (this.show && newItems) {
                    this.localItems = JSON.parse(JSON.stringify(newItems));
                }
            },
            immediate: true
        }
    },
    computed: {
        subtotal() {
            return this.localItems.reduce((sum, item) => {
                return sum + (parseFloat(item.price) * item.quantity);
            }, 0);
        },
        discountAmount() {
            if (this.selectedDiscountId && this.availableDiscounts?.length > 0) {
                const selectedDiscount = this.availableDiscounts.find(d => d.id === this.selectedDiscountId);
                return selectedDiscount ? selectedDiscount.amount : 0;
            }
            return 0;
        },
        calculateTotal() {
            return Math.max(0, this.subtotal - this.discountAmount);
        }
    },
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price).replace('PHP', '₱');
        },
        handleImageError(e) {
            e.target.src = '/img/placeholder.jpg';
        },
        updateQuantity(itemId, newQuantity) {
            const item = this.localItems.find(item => item.id === itemId);
            if (item && newQuantity >= 1) {
                item.quantity = newQuantity;
            }
        },
        removeItem(itemId) {
            this.localItems = this.localItems.filter(item => item.id !== itemId);
        },
        confirmOrder() {
            // Format items properly to ensure they contain all needed fields
            const formattedItems = this.localItems.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: parseFloat(item.price),
                choice_id: item.choice_id
            }));
            
            this.$emit('place-order', {
                items: formattedItems,
                discountId: this.selectedDiscountId
            });
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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    position: relative;
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    height: 80vh;
    display: flex;
    flex-direction: column;
}

.modal-content h3 {
    margin: 0;
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
}

.scrollable-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.order-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.order-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
}

.order-item-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.order-item-details {
    flex-grow: 1;
}

.order-item-details h4 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
}

.item-price, .item-quantity, .item-subtotal {
    margin: 0.25rem 0;
    color: #666;
}

.fixed-bottom {
    border-top: 2px solid #eee;
    padding: 1.5rem;
    background: white;
    border-radius: 0 0 12px 12px;
}

.order-total {
    margin-bottom: 1rem;
    text-align: right;
}

.order-total h4 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.2rem;
}

.modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.place-order-btn, .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.place-order-btn {
    background-color: #4CAF50;
    color: white;
}

.cancel-btn {
    background-color: #6c757d;
    color: white;
}

.place-order-btn:hover {
    background-color: #45a049;
}

.cancel-btn:hover {
    background-color: #5a6268;
}
.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
}

.quantity-btn {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.quantity-btn:hover:not(:disabled) {
    border-color: #4CAF50;
    color: #4CAF50;
}

.quantity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.quantity-value {
    min-width: 2rem;
    text-align: center;
    font-weight: 500;
}

.remove-btn {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    transition: all 0.2s;
}

.remove-btn:hover {
    background-color: #c82333;
}

.place-order-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}
.choice-info {
    font-size: 0.95rem;
    color: #3498db;
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.5rem;
    border-radius: 4px;
    width: fit-content;
}

.no-items {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
}
.discount-section {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #eee;
}

.discount-section h4 {
    margin-bottom: 0.5rem;
    color: #2c3e50;
}

.discount-select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.95rem;
}
.total-breakdown {
    text-align: right;
    padding: 1rem 0;
}

.subtotal-line {
    margin: 0;
    color: #666;
    font-size: 0.95rem;
}

.discount-line {
    margin: 0.5rem 0;
    color: #4CAF50;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
}

.final-total {
    margin: 0.5rem 0 0 0;
    color: #2c3e50;
    font-size: 1.2rem;
    font-weight: 600;
}
</style>