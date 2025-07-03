<template>
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
                <h3>
                    <i class="fas fa-clipboard-list"></i>
                    Order Summary
                </h3>
                <button @click="$emit('close')" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Packaging Preference Section -->
            <div class="packaging-section">
                <h4 class="section-title">
                    <i class="fas fa-box"></i>
                    Packaging Preference
                </h4>
                <div class="packaging-toggle-container">
                    <label class="packaging-toggle">
                        <input 
                            type="checkbox" 
                            v-model="plasticPackaging"
                            class="toggle-input"
                        >
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">
                            {{ plasticPackaging ? 'Eco-friendly packaging' : 'Plastic packaging requested' }}
                        </span>
                    </label>
                    <div class="packaging-note" :class="{ 'eco-note': !plasticPackaging, 'plastic-note': plasticPackaging }">
                        <i :class="plasticPackaging ? 'fas fa-shopping-bag' : 'fas fa-leaf'"></i>
                        <span v-if="!plasticPackaging">
                            Your order will be packed with paper bag/box. Thank you for helping us reducing plastic.
                        </span>
                        <span v-else>
                            Your order will be packed with plastic. Join us in reducing plastic on your next order.
                        </span>
                    </div>
                </div>
            </div>

            <!-- Discount Selection -->
            <div v-if="availableDiscounts.length" class="discount-section">
                <h4 class="section-title">
                    <i class="fas fa-tags"></i>
                    Available Discounts
                </h4>
                <select v-model="selectedDiscountId" class="discount-select">
                    <option value="">No discount (₱0)</option>
                    <option v-for="discount in availableDiscounts" 
                            :key="discount.id" 
                            :value="discount.id">
                        ₱{{ discount.amount }} off
                    </option>
                </select>
            </div>

            <!-- Scrollable Content -->
            <div class="scrollable-content">
                <div v-if="localItems.length > 0" class="order-items">
                    <div v-for="item in localItems" :key="item.id" class="order-item">
                        <div class="item-image-container">
                            <img 
                                :src="item.image || '/img/placeholder.jpg'"
                                :alt="item.name"
                                class="order-item-image"
                                @error="handleImageError"
                            >
                        </div>
                        
                        <div class="item-details">
                            <h4 class="item-name">{{ item.name }}</h4>
                            
                            <div v-if="item.choice_name" class="choice-info">
                                <i class="fas fa-tag"></i> 
                                {{ item.choice_name }}
                            </div>
                            
                            <div class="item-price">
                                <i class="fas fa-peso-sign"></i>
                                {{ formatPrice(item.price) }}
                            </div>
                            
                            <div class="quantity-section">
                                <div class="quantity-controls">
                                    <button 
                                        @click="updateQuantity(item.id, item.quantity - 1)"
                                        :disabled="item.quantity <= 1"
                                        class="quantity-btn"
                                    >
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <div class="quantity-display">
                                        {{ item.quantity }}
                                    </div>
                                    <button 
                                        @click="updateQuantity(item.id, item.quantity + 1)"
                                        class="quantity-btn"
                                    >
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="item-subtotal">
                                Subtotal: {{ formatPrice(item.price * item.quantity) }}
                            </div>
                            
                            <button class="remove-btn" @click="removeItem(item.id)">
                                <i class="fas fa-trash"></i> 
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
                
                <div v-else class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No items selected</p>
                </div>
            </div>

            <!-- Fixed Bottom Section -->
            <div class="fixed-bottom">
                <div class="total-calculation">
                    <div class="calculation-row">
                        <span>Subtotal:</span>
                        <span>{{ formatPrice(subtotal) }}</span>
                    </div>
                    <div v-if="discountAmount > 0" class="calculation-row discount-row">
                        <span>
                            <i class="fas fa-tag"></i> 
                            Discount:
                        </span>
                        <span>-{{ formatPrice(discountAmount) }}</span>
                    </div>
                    <div class="calculation-divider"></div>
                    <div class="calculation-row total-row">
                        <span>Total:</span>
                        <span class="total-price">{{ formatPrice(calculateTotal) }}</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button 
                        @click="confirmOrder" 
                        class="confirm-btn"
                        :disabled="localItems.length === 0"
                    >
                        <i class="fas fa-check"></i> 
                        Confirm Order
                    </button>
                    <button @click="$emit('close')" class="cancel-btn">
                        <i class="fas fa-times"></i> 
                        Close
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
            selectedDiscountId: '',
            plasticPackaging: false // This should start as false (eco-friendly)
        }
    },
    watch: {
        show(newValue) {
            if (newValue && this.selectedItems) {
                this.localItems = JSON.parse(JSON.stringify(this.selectedItems));
                // Reset packaging preference when modal opens
                this.plasticPackaging = false;
                this.selectedDiscountId = '';
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
            const formattedItems = this.localItems.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: parseFloat(item.price),
                choice_id: item.choice_id
            }));
            
            console.log('Confirming order with plastic packaging:', this.plasticPackaging); // Debug log
            
            this.$emit('place-order', {
                items: formattedItems,
                discountId: this.selectedDiscountId,
                plasticPackaging: this.plasticPackaging // Make sure this is being sent
            });
        }
    }
}
</script>

<style scoped>
/* Modal Overlay & Container */
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
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(2px);
}

.modal-content {
    background-color: white;
    border-radius: 16px;
    max-width: 700px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #4CAF50;
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Modal Header */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid #f1f9f1;
}

.modal-header h3 {
    margin: 0;
    color: #2a3f2a;
    font-size: 1.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.close-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s ease;
    font-size: 1.25rem;
}

.close-btn:hover {
    background-color: #fee2e2;
    color: #dc2626;
}

/* Section Styles */
.section-title {
    margin: 0 0 1rem 0;
    color: #2a3f2a;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Packaging Section */
.packaging-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f9f1;
    background-color: #fafffe;
}

.packaging-toggle-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.packaging-toggle {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    user-select: none;
}

.toggle-input {
    display: none;
}

.toggle-slider {
    position: relative;
    width: 60px;
    height: 30px;
    background-color: #e2e8f0;
    border-radius: 15px;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.toggle-slider::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    background-color: white;
    border-radius: 50%;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
    background-color: #4CAF50;
}

.toggle-input:checked + .toggle-slider::before {
    transform: translateX(30px);
}

.toggle-label {
    font-size: 1rem;
    font-weight: 500;
    color: #2a3f2a;
}

.packaging-note {
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.9rem;
    line-height: 1.4;
    transition: all 0.3s ease;
}

.packaging-note.eco-note {
    background-color: #f0fdf4;
    color: #166534;
    border: 1px solid #dcfce7;
}

.packaging-note.plastic-note {
    background-color: #fef3f2;
    color: #dc2626;
    border: 1px solid #fecaca;
}

.packaging-note i {
    font-size: 1.1rem;
    margin-top: 0.1rem;
    flex-shrink: 0;
}

/* Discount Section */
.discount-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f9f1;
    background-color: #fafffe;
}

.discount-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    color: #2a3f2a;
    background-color: white;
    transition: border-color 0.2s ease;
}

.discount-select:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
}

/* Scrollable Content */
.scrollable-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 2rem;
}

.order-items {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.order-item {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    background-color: #fafffe;
    border-radius: 12px;
    border: 1px solid #f1f9f1;
    transition: all 0.2s ease;
}

.order-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.1);
}

.item-image-container {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    background-color: white;
    border: 1px solid #e2e8f0;
}

.order-item-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.item-name {
    margin: 0;
    color: #2a3f2a;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.3;
}

.choice-info {
    background-color: #f1f9f1;
    color: #4CAF50;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 500;
    width: fit-content;
}

.item-price {
    color: #4CAF50;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

/* Quantity Section */
.quantity-section {
    margin: 0.5rem 0;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.quantity-btn {
    width: 2rem;
    height: 2rem;
    border: 2px solid #4CAF50;
    background-color: white;
    color: #4CAF50;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    transition: all 0.2s ease;
}

.quantity-btn:hover:not(:disabled) {
    background-color: #4CAF50;
    color: white;
    transform: scale(1.05);
}

.quantity-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
}

.quantity-display {
    min-width: 2rem;
    text-align: center;
    font-weight: 600;
    font-size: 1rem;
    color: #2a3f2a;
    background-color: white;
    padding: 0.5rem;
    border-radius: 6px;
    border: 2px solid #e2e8f0;
}

.item-subtotal {
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 500;
}

.remove-btn {
    background-color: #fee2e2;
    color: #dc2626;
    border: 2px solid #fecaca;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s ease;
    width: fit-content;
}

.remove-btn:hover {
    background-color: #dc2626;
    color: white;
    border-color: #dc2626;
    transform: translateY(-1px);
}

.empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
}

.empty-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #cbd5e1;
}

.empty-state p {
    margin: 0;
    font-size: 1.1rem;
}

/* Fixed Bottom Section */
.fixed-bottom {
    border-top: 1px solid #f1f9f1;
    padding: 1.5rem 2rem;
    background: white;
    border-radius: 0 0 16px 16px;
}

.total-calculation {
    background-color: #fafffe;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #f1f9f1;
    margin-bottom: 1.5rem;
}

.calculation-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    color: #64748b;
    font-size: 0.95rem;
}

.calculation-row:last-child {
    margin-bottom: 0;
}

.discount-row {
    color: #4CAF50;
}

.calculation-divider {
    height: 1px;
    background-color: #e2e8f0;
    margin: 1rem 0;
}

.total-row {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2a3f2a;
}

.total-price {
    color: #4CAF50;
    font-size: 1.3rem;
    font-weight: 700;
}

/* Action Buttons */
.modal-actions {
    display: flex;
    gap: 1rem;
}

.confirm-btn, .cancel-btn {
    flex: 1;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.confirm-btn {
    background-color: #4CAF50;
    color: white;
    border-color: #4CAF50;
}

.confirm-btn:hover:not(:disabled) {
    background-color: #45a049;
    border-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.confirm-btn:disabled {
    background-color: #c8e6c9;
    border-color: #c8e6c9;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.cancel-btn {
    background-color: white;
    color: #64748b;
    border-color: #e2e8f0;
}

.cancel-btn:hover {
    background-color: #f8f9fa;
    border-color: #cbd5e1;
    transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
    .modal-content {
        margin: 1rem;
        max-height: 95vh;
    }
    
    .modal-header, .packaging-section, .discount-section, .scrollable-content, .fixed-bottom {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }
    
    .order-item {
        flex-direction: column;
        gap: 1rem;
    }
    
    .item-image-container {
        width: 100%;
        height: 150px;
        align-self: center;
    }
    
    .modal-actions {
        flex-direction: column;
    }
    
    .packaging-toggle {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }
}

@media (max-width: 480px) {
    .modal-overlay {
        padding: 0.5rem;
    }
    
    .modal-header h3 {
        font-size: 1.25rem;
    }
    
    .quantity-controls {
        justify-content: center;
    }
    
    .toggle-slider {
        width: 50px;
        height: 26px;
    }
    
    .toggle-slider::before {
        width: 20px;
        height: 20px;
        top: 3px;
        left: 3px;
    }
    
    .toggle-input:checked + .toggle-slider::before {
        transform: translateX(24px);
    }
}

/* Scrollbar Styling */
.scrollable-content::-webkit-scrollbar {
    width: 6px;
}

.scrollable-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.scrollable-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>