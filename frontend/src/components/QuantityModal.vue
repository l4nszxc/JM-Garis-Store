<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal-content">
            <h3>{{ product ? product.name : 'Select Quantity' }}</h3>
            
            <!-- Product Choices Section -->
            <div v-if="product && product.choices && product.choices.length > 0" class="product-choices">
                <h4>Select Option:</h4>
                <div class="choices-container">
                    <div 
                        v-for="(choice, index) in product.choices" 
                        :key="index" 
                        class="choice-item"
                        :class="{ 'selected': selectedChoice && selectedChoice.choice_id === choice.choice_id }"
                        @click="selectChoice(choice)"
                    >
                        <div class="choice-image-container" v-if="choice.image">
                            <img 
                                :src="choice.image || '/img/placeholder.jpg'" 
                                :alt="choice.name"
                                @error="handleImageError"
                            >
                        </div>
                        <div class="choice-details">
                            <span class="choice-name">{{ choice.name }}</span>
                            <span class="choice-price">₱{{ formatPrice(choice.price) }}</span>
                            <span class="choice-stock" :class="{'low-stock': choice.stock <= 10}">
                                {{ choice.stock }} in stock
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="quantity-controls">
                <button @click="decrementQuantity" :disabled="quantity <= 1">-</button>
                <input 
                    type="number" 
                    v-model.number="quantity" 
                    min="1" 
                    :max="getMaxStock()"
                    @input="validateQuantity"
                >
                <button @click="incrementQuantity" :disabled="quantity >= getMaxStock()">+</button>
            </div>
            <p class="stock-info">Available stock: {{ getMaxStock() }}</p>
            <div class="modal-buttons">
                <button 
                    @click="confirm" 
                    class="confirm-btn" 
                    :disabled="!isValidQuantity || (hasChoices && !selectedChoice)"
                >
                    Confirm
                </button>
                <button @click="cancel" class="cancel-btn">Cancel</button>
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
            return this.quantity >= 1 && this.quantity <= this.getMaxStock();
        },
        hasChoices() {
            return this.product && this.product.choices && this.product.choices.length > 0;
        }
    },
    methods: {
        formatPrice(price) {
            return Number(price).toFixed(2);
        },
        handleImageError(e) {
            e.target.src = '/img/placeholder.jpg';
        },
        getMaxStock() {
            if (this.selectedChoice) {
                // Return specific choice stock when a choice is selected
                return this.selectedChoice.stock;
            }
            
            // Calculate total stock from all choices if product has choices
            if (this.product && this.product.choices && this.product.choices.length > 0) {
                return this.product.choices.reduce((total, choice) => {
                    return total + (parseInt(choice.stock) || 0);
                }, 0);
            }
            
            // Return product stock if no choices available
            return this.productStock;
        },
        selectChoice(choice) {
            this.selectedChoice = choice;
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
                this.quantity = Math.min(Math.max(1, this.quantity), this.getMaxStock());
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
            }
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
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    min-width: 300px;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}

.product-choices {
    margin: 15px 0;
}

.product-choices h4 {
    margin-bottom: 10px;
    color: #333;
}

.choices-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
}

.choice-item {
    border: 2px solid #eee;
    border-radius: 8px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 10px;
}

.choice-item:hover {
    border-color: #3498db;
    transform: translateY(-2px);
}

.choice-item.selected {
    border-color: #3498db;
    background-color: #ebf5fb;
}

.choice-image-container {
    width: 50px;
    height: 50px;
    overflow: hidden;
    border-radius: 4px;
}

.choice-image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.choice-details {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.choice-name {
    font-weight: bold;
    font-size: 14px;
}

.choice-price {
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

.choice-stock {
    font-size: 12px;
    color: #27ae60;
}

.choice-stock.low-stock {
    color: #f39c12;
}

.quantity-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin: 20px 0;
}

.quantity-controls button {
    padding: 5px 15px;
    border: 1px solid #ddd;
    background-color: #f8f8f8;
    cursor: pointer;
    border-radius: 4px;
}

.quantity-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.quantity-controls input {
    width: 60px;
    text-align: center;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.stock-info {
    text-align: center;
    color: #666;
    margin-bottom: 15px;
}

.modal-buttons {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.confirm-btn, .cancel-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
}

.confirm-btn {
    background-color: #3498db;
    color: white;
}

.confirm-btn:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
}

.cancel-btn {
    background-color: #e74c3c;
    color: white;
}
</style>