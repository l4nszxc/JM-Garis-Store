<template>
    <div v-if="show" class="modal-overlay" @click.self="cancel">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
                <h3>Add to Cart</h3>
                <button @click="cancel" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Product Information Section -->
            <div v-if="product" class="product-info-section">
                <div class="product-main-info">
                    <div class="product-image-container">
                        <img 
                            :src="product.image || '/img/placeholder.jpg'" 
                            :alt="product.name"
                            @error="handleImageError"
                            class="product-image"
                        >
                        <div v-if="parseInt(product.total_sold) > 0" class="sold-badge">
                            <i class="fas fa-fire-alt"></i> {{ parseInt(product.total_sold) }} sold
                        </div>
                    </div>
                    
                    <div class="product-details">
                        <h4 class="product-name">{{ product.name }}</h4>
                        
                        <!-- Product Rating -->
                        <div class="product-rating">
                            <div class="star-rating">
                                <div class="stars-background">
                                    <i v-for="i in 5" :key="`bg-${i}`" class="fas fa-star"></i>
                                </div>
                                <div class="stars-foreground" :style="{width: `${(product.rating || 0) * 20}%`}">
                                    <i v-for="i in 5" :key="`fg-${i}`" class="fas fa-star"></i>
                                </div>
                            </div>
                            <span v-if="product.rating" class="rating-count">
                                {{ product.rating.toFixed(1) }} ({{ product.review_count || 0 }})
                            </span>
                            <span v-else class="rating-count">No reviews</span>
                        </div>

                        <!-- Product Category -->
                        <div class="product-category">
                            <span class="category-tag">
                                <i class="fas fa-tag"></i> {{ product.category }}
                            </span>
                        </div>

                        <!-- Product Description -->
                        <p class="product-description">{{ product.description }}</p>

                        <!-- Stock Information -->
                        <div class="stock-indicator" :class="{ 'low-stock': getTotalStock() <= 10, 'out-of-stock': getTotalStock() === 0 }">
                            <i class="fas fa-cubes"></i>
                            <span v-if="getTotalStock() > 0">
                                {{ getTotalStock() }} items available
                            </span>
                            <span v-else>Out of stock</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Product Choices Section -->
            <div v-if="hasChoices" class="choices-section">
                <h4 class="section-title">
                    <i class="fas fa-list"></i> Product Options
                </h4>
                <div class="choices-grid">
                    <div 
                        v-for="choice in product.choices" 
                        :key="choice.choice_id"
                        class="choice-card"
                        :class="{ 
                            'selected': selectedChoice && selectedChoice.choice_id === choice.choice_id,
                            'out-of-stock': choice.stock <= 0 
                        }"
                        @click="selectChoice(choice)"
                    >
                        <div class="choice-image-container" v-if="choice.image">
                            <img 
                                :src="choice.image || product.image || '/img/placeholder.jpg'" 
                                :alt="choice.name"
                                @error="handleImageError"
                                class="choice-image"
                            >
                        </div>
                        <div class="choice-info">
                            <div class="choice-name">{{ choice.name }}</div>
                            <div class="choice-price">{{ formatPrice(choice.price) }}</div>
                            <div class="choice-stock" :class="{ 'low-stock': choice.stock <= 10, 'no-stock': choice.stock <= 0 }">
                                <i class="fas fa-cubes"></i>
                                {{ choice.stock > 0 ? `${choice.stock} in stock` : 'Out of stock' }}
                            </div>
                        </div>
                        <div v-if="selectedChoice && selectedChoice.choice_id === choice.choice_id" class="selected-indicator">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Price Display Section -->
            <div class="price-section">
                <div class="price-info">
                    <span class="price-label">Price:</span>
                    <div class="price-display">
                        <template v-if="selectedChoice">
                            {{ formatPrice(selectedChoice.price) }}
                        </template>
                        <template v-else-if="hasChoices && product.choices">
                            {{ formatPrice(getPriceRange().min) }}
                            <template v-if="getPriceRange().min !== getPriceRange().max">
                                - {{ formatPrice(getPriceRange().max) }}
                            </template>
                        </template>
                        <template v-else>
                            {{ formatPrice(product.price) }}
                        </template>
                    </div>
                </div>
            </div>

            <!-- Quantity Selection Section -->
            <div class="quantity-section">
                <h4 class="section-title">
                    <i class="fas fa-sort-numeric-up"></i> Quantity
                </h4>
                <div class="quantity-controls">
                    <button 
                        @click="decrementQuantity" 
                        :disabled="quantity <= 1"
                        class="quantity-btn"
                    >
                        <i class="fas fa-minus"></i>
                    </button>
                    <div class="quantity-display">
                        <input 
                            type="number" 
                            v-model.number="quantity" 
                            min="1" 
                            :max="getMaxStock()"
                            @input="validateQuantity"
                            class="quantity-input"
                        >
                    </div>
                    <button 
                        @click="incrementQuantity" 
                        :disabled="quantity >= getMaxStock() || getMaxStock() === 0"
                        class="quantity-btn"
                    >
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="quantity-info">
                    <span class="available-stock">
                        <i class="fas fa-info-circle"></i>
                        Maximum available: {{ getMaxStock() }} items
                    </span>
                </div>
            </div>

            <!-- Total Price Section -->
            <div class="total-section">
                <div class="total-calculation">
                    <div class="calculation-row">
                        <span>Unit Price:</span>
                        <span>{{ formatPrice(getCurrentPrice()) }}</span>
                    </div>
                    <div class="calculation-row">
                        <span>Quantity:</span>
                        <span>{{ quantity }}</span>
                    </div>
                    <div class="calculation-divider"></div>
                    <div class="calculation-row total-row">
                        <span>Total:</span>
                        <span class="total-price">{{ formatPrice(getCurrentPrice() * quantity) }}</span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="modal-actions">
                <button 
                    @click="confirm" 
                    class="confirm-btn"
                    :disabled="!isValidQuantity || (hasChoices && !selectedChoice) || getMaxStock() === 0"
                >
                    <i class="fas fa-shopping-cart"></i>
                    Add to Cart
                </button>
                <button @click="cancel" class="cancel-btn">
                    <i class="fas fa-times"></i>
                    Cancel
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'QuantityModal',
    props: {
        show: Boolean,
        productStock: {
            type: Number,
            required: true
        },
        product: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            quantity: 1,
            selectedChoice: null
        }
    },
    computed: {
        isValidQuantity() {
            return this.quantity >= 1 && this.quantity <= this.getMaxStock() && this.getMaxStock() > 0;
        },
        hasChoices() {
            return this.product && this.product.choices && this.product.choices.length > 0;
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
        getTotalStock() {
            if (!this.product) return 0;
            
            if (this.hasChoices) {
                return this.product.choices.reduce((total, choice) => {
                    return total + (parseInt(choice.stock) || 0);
                }, 0);
            }
            
            return this.productStock || this.product.stock_quantity || 0;
        },
        getMaxStock() {
            if (this.selectedChoice) {
                return this.selectedChoice.stock || 0;
            }
            
            return this.getTotalStock();
        },
        getPriceRange() {
            if (!this.hasChoices) {
                return { min: this.product.price, max: this.product.price };
            }
            
            let min = Infinity;
            let max = 0;
            
            this.product.choices.forEach(choice => {
                if (choice.price && parseFloat(choice.price) > 0) {
                    min = Math.min(min, parseFloat(choice.price));
                    max = Math.max(max, parseFloat(choice.price));
                }
            });
            
            if (min === Infinity) min = 0;
            if (max === 0) max = 0;
            
            return { min, max };
        },
        getCurrentPrice() {
            if (this.selectedChoice) {
                return parseFloat(this.selectedChoice.price) || 0;
            }
            
            if (this.hasChoices) {
                return this.getPriceRange().min;
            }
            
            return parseFloat(this.product.price) || 0;
        },
        selectChoice(choice) {
            if (choice.stock <= 0) return;
            
            this.selectedChoice = this.selectedChoice && this.selectedChoice.choice_id === choice.choice_id ? null : choice;
            this.quantity = 1; // Reset quantity when changing choice
        },
        incrementQuantity() {
            if (this.quantity < this.getMaxStock()) {
                this.quantity++;
            }
        },
        decrementQuantity() {
            if (this.quantity > 1) {
                this.quantity--;
            }
        },
        validateQuantity() {
            if (isNaN(this.quantity) || this.quantity < 1) {
                this.quantity = 1;
            } else {
                const maxStock = this.getMaxStock();
                this.quantity = Math.min(Math.max(1, this.quantity), maxStock);
            }
        },
        confirm() {
            if (this.isValidQuantity) {
                this.$emit('confirm', {
                    quantity: this.quantity,
                    choice: this.selectedChoice
                });
            }
        },
        cancel() {
            this.$emit('cancel');
        }
    },
    watch: {
        show(newVal) {
            if (newVal) {
                this.quantity = 1;
                this.selectedChoice = null;
                
                // Auto-select the first available choice if there's only one option
                if (this.hasChoices && this.product.choices.length === 1 && this.product.choices[0].stock > 0) {
                    this.selectedChoice = this.product.choices[0];
                }
            }
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
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
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

/* Product Information Section */
.product-info-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f9f1;
}

.product-main-info {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
}

.product-image-container {
    position: relative;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    background-color: #f9fff9;
    border: 1px solid #e2e8f0;
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.sold-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background-color: rgba(76, 175, 80, 0.9);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 600;
}

.product-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.product-name {
    margin: 0;
    color: #2a3f2a;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
}

/* Star Rating */
.product-rating {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.star-rating {
    position: relative;
    display: inline-block;
    width: 80px;
    height: 16px;
}

.stars-background, .stars-foreground {
    display: flex;
    gap: 2px;
    position: absolute;
    top: 0;
    left: 0;
}

.stars-background {
    color: #e2e8f0;
}

.stars-foreground {
    color: #4CAF50;
    overflow: hidden;
    white-space: nowrap;
}

.rating-count {
    font-size: 0.85rem;
    color: #64748b;
}

.product-category {
    margin: 0.25rem 0;
}

.category-tag {
    background-color: #f1f9f1;
    color: #4CAF50;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 500;
}

.product-description {
    color: #5a675a;
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.stock-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    background-color: #f1f9f1;
    color: #4CAF50;
    border: 1px solid #e8f5e8;
}

.stock-indicator.low-stock {
    background-color: #fff3cd;
    color: #856404;
    border-color: #ffeaa7;
}

.stock-indicator.out-of-stock {
    background-color: #f8d7da;
    color: #721c24;
    border-color: #f5c6cb;
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

/* Choices Section */
.choices-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f9f1;
}

.choices-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
}

.choice-card {
    position: relative;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
}

.choice-card:hover:not(.out-of-stock) {
    border-color: #4CAF50;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
}

.choice-card.selected {
    border-color: #4CAF50;
    background-color: #f9fff9;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.choice-card.out-of-stock {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #f8f9fa;
}

.choice-image-container {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #f9fff9;
    border: 1px solid #e2e8f0;
}

.choice-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.choice-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.choice-name {
    font-weight: 600;
    color: #2a3f2a;
    font-size: 0.95rem;
}

.choice-price {
    color: #4CAF50;
    font-size: 1.1rem;
    font-weight: 600;
}

.choice-stock {
    font-size: 0.8rem;
    color: #4CAF50;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
}

.choice-stock.low-stock {
    color: #f59e0b;
}

.choice-stock.no-stock {
    color: #dc2626;
}

.selected-indicator {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    color: #4CAF50;
    font-size: 1.25rem;
}

/* Price Section */
.price-section {
    padding: 1rem 2rem;
    border-bottom: 1px solid #f1f9f1;
    background-color: #fafffe;
}

.price-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.price-label {
    color: #64748b;
    font-weight: 500;
}

.price-display {
    color: #4CAF50;
    font-size: 1.5rem;
    font-weight: 700;
}

/* Quantity Section */
.quantity-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f9f1;
}

.quantity-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.quantity-btn {
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid #4CAF50;
    background-color: white;
    color: #4CAF50;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
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
    position: relative;
}

.quantity-input {
    width: 4rem;
    height: 2.5rem;
    text-align: center;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2a3f2a;
    background-color: white;
}

.quantity-input:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
}

.quantity-info {
    display: flex;
    justify-content: center;
}

.available-stock {
    color: #64748b;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Total Section */
.total-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f9f1;
    background-color: #fafffe;
}

.total-calculation {
    background-color: white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
}

.calculation-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    color: #64748b;
}

.calculation-row:last-child {
    margin-bottom: 0;
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
    font-size: 1.5rem;
    font-weight: 700;
}

/* Action Buttons */
.modal-actions {
    padding: 1.5rem 2rem;
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
    
    .modal-header, .product-info-section, .choices-section, 
    .price-section, .quantity-section, .total-section, .modal-actions {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }
    
    .product-main-info {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1rem;
    }
    
    .product-image-container {
        width: 140px;
        height: 140px;
    }
    
    .choices-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
    }
    
    .modal-actions {
        flex-direction: column;
    }
}

@media (max-width: 480px) {
    .modal-overlay {
        padding: 0.5rem;
    }
    
    .modal-header h3 {
        font-size: 1.25rem;
    }
    
    .product-name {
        font-size: 1.1rem;
    }
    
    .choices-grid {
        grid-template-columns: 1fr;
    }
    
    .quantity-controls {
        gap: 0.75rem;
    }
    
    .quantity-btn {
        width: 2.25rem;
        height: 2.25rem;
    }
    
    .quantity-input {
        width: 3.5rem;
        height: 2.25rem;
        font-size: 1.1rem;
    }
}

/* Scrollbar Styling */
.modal-content::-webkit-scrollbar {
    width: 6px;
}

.modal-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
