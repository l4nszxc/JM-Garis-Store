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

            <!-- Payment Method Selection -->
            <div class="payment-method-section">
                <h4 class="section-title">
                    <i class="fas fa-credit-card"></i>
                    Payment Method
                </h4>
                <div class="payment-methods">
                    <label class="payment-option">
                        <input 
                            type="radio" 
                            value="cash" 
                            v-model="selectedPaymentMethod"
                            name="paymentMethod"
                        >
                        <div class="payment-card">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Cash on Pickup</span>
                            <small>Pay when you collect your order</small>
                        </div>
                    </label>
                    
                    <label class="payment-option">
                        <input 
                            type="radio" 
                            value="gcash" 
                            v-model="selectedPaymentMethod"
                            name="paymentMethod"
                        >
                        <div class="payment-card gcash-card">
                            <i class="fab fa-google-pay"></i>
                            <span>GCash</span>
                            <small>Pay now with GCash</small>
                        </div>
                    </label>
                    
                    <label class="payment-option">
                        <input 
                            type="radio" 
                            value="hatid" 
                            v-model="selectedPaymentMethod"
                            name="paymentMethod"
                        >
                        <div class="payment-card hatid-card">
                            <i class="fas fa-motorcycle"></i>
                            <span>Deliver with HATID</span>
                            <small>Cash on delivery via HATID</small>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Delivery Address Section (only for HATID) -->
            <div v-if="selectedPaymentMethod === 'hatid'" class="delivery-address-section">
                <h4 class="section-title">
                    <i class="fas fa-map-marker-alt"></i>
                    Delivery Address
                </h4>
                <textarea 
                    v-model="deliveryAddress"
                    class="address-input"
                    placeholder="Enter your complete delivery address..."
                    rows="3"
                    required
                ></textarea>
                <div class="address-note">
                    <i class="fas fa-info-circle"></i>
                    <span>Please provide a complete address for HATID delivery</span>
                </div>
                
                <div class="special-instructions-field">
                    <label for="specialInstructions" class="section-title">
                        <i class="fas fa-clipboard-list"></i>
                        Special Instructions
                    </label>
                    <textarea 
                        id="specialInstructions"
                        v-model="specialInstructions"
                        class="address-input"
                        placeholder="Any special instructions for HATID delivery (optional)..."
                        rows="2"
                    ></textarea>
                </div>
            </div>

            <!-- Packaging Preference Section -->
            <div class="packaging-section">
                <h4 class="section-title">
                    <i class="fas fa-box"></i>
                    Packaging Preference
                </h4>
                <div class="packaging-toggle">
                    <label class="switch">
                        <input 
                            type="checkbox" 
                            v-model="packagingPreference" 
                            @change="updatePackagingPreference"
                        >
                        <span class="slider round"></span>
                    </label>
                    <span class="toggle-label" :class="{'plastic-requested': packagingPreference}">
                        {{ packagingPreference ? 'Plastic packaging requested' : 'Plastic packaging' }}
                    </span>
                </div>
                <div class="packaging-note" :class="{'plastic-selected': packagingPreference}">
                    <i :class="packagingPreference ? 'fas fa-shopping-bag' : 'fas fa-leaf'"></i>
                    <span v-if="!packagingPreference">
                        Your order will be packed with paper bag/box. Thank you for helping us reducing plastic.
                    </span>
                    <span v-else>
                        Your order will be packed with plastic. Join us in reducing plastic on your next order.
                    </span>
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
                        :disabled="!isFormValid"
                    >
                        <i class="fas fa-spinner fa-spin" v-if="processingPayment"></i>
                        <i class="fas fa-check" v-else></i> 
                        {{ processingPayment ? 'Processing...' : getConfirmButtonText() }}
                    </button>
                    <button @click="$emit('close')" class="cancel-btn" :disabled="processingPayment">
                        <i class="fas fa-times"></i> 
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- HATID Message Modal -->
    <div v-if="showHatidModal" class="modal-overlay" @click.self="closeHatidModal">
        <div class="hatid-modal-content">
            <div class="hatid-modal-header">
                <h3>
                    <i class="fas fa-motorcycle"></i>
                    Message HATID for Delivery
                </h3>
                <button @click="closeHatidModal" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="hatid-modal-body">
                <div class="order-success-info">
                    <i class="fas fa-check-circle"></i>
                    <p>Your order #{{ currentOrderId }} has been created successfully!</p>
                </div>
                
                <div class="message-section">
                    <h4>Copy this message and send it to HATID:</h4>
                    <div class="message-box">
                        <textarea 
                            ref="hatidMessage"
                            :value="hatidMessage"
                            readonly
                            rows="6"
                            class="message-textarea"
                        ></textarea>
                    </div>
                    
                    <div class="copy-actions">
                        <button @click="copyMessage" class="copy-btn">
                            <i :class="copySuccess ? 'fas fa-check' : 'fas fa-copy'"></i>
                            {{ copySuccess ? 'Copied!' : 'Copy Message' }}
                        </button>
                        <a 
                            :href="hatidMessengerLink" 
                            target="_blank" 
                            class="messenger-btn"
                        >
                            <i class="fab fa-facebook-messenger"></i>
                            Open HATID Messenger
                        </a>
                    </div>
                </div>
                
                <div class="instruction-note">
                    <i class="fas fa-info-circle"></i>
                    <p>After copying the message, click "Open HATID Messenger" to go to their Facebook page and send the message directly.</p>
                </div>
            </div>
            
            <div class="hatid-modal-actions">
                <button @click="closeHatidModal" class="done-btn">
                    <i class="fas fa-check"></i>
                    Done
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import PaymentStatusModal from './PaymentStatusModal.vue';

export default {
    name: 'ViewOrdersModal',
    props: {
        show: Boolean,
        selectedItems: Array,
        PaymentStatusModal,
        availableDiscounts: {
            type: Array,
            default: () => []
        },
        userAddress: {
            type: String,
            default: ''
        },
        userProfile: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            localItems: [],
            selectedDiscountId: '',
            packagingPreference: false,
            selectedPaymentMethod: 'cash',
            processingPayment: false,
            showPaymentStatus: false,
            currentOrderId: null,
            currentAmount: 0,
            deliveryAddress: '',
            specialInstructions: '',
            showHatidModal: false,
            copySuccess: false,
            hatidMessengerLink: 'https://www.facebook.com/hatidcpn?rdid=j0kvikC7TTWnwK9z&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1C4RDcdzKp%2F'
        }
    },
    watch: {
        show(newValue) {
            if (newValue && this.selectedItems) {
                this.localItems = JSON.parse(JSON.stringify(this.selectedItems));
                this.selectedPaymentMethod = 'cash'; // Reset to default
                this.processingPayment = false;
                this.deliveryAddress = this.userAddress || '';
                this.specialInstructions = '';
                this.showHatidModal = false;
                this.copySuccess = false;
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
        },
        hatidMessage() {
            const address = this.deliveryAddress || 'Address not provided';
            const currentDateTime = new Date().toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            
            // Get receiver information from user profile
            const receiverName = this.userProfile?.firstname && this.userProfile?.lastname 
                ? `${this.userProfile.firstname} ${this.userProfile.lastname}`.trim()
                : '';
            const receiverContact = this.userProfile?.phone_number || '';
            
            return `Hi, thank you for reaching us!

To ensure quality service, this conversation will be recorded and your information will be used to process current and future transactions.

Time and date: ${currentDateTime}

Exact Drop off (DO): ${address}
Nearest Landmark: 
Exact Pick up(PU)/Store: JG Garis Store, Barcenaga, Naujan City, Oriental Mindoro
(QTY) Food/Items: ${this.localItems.length} item(s) - Order ID: ${this.currentOrderId}

Name of Sender: JG Garis Store
Contact #: 
Name of Receiver: ${receiverName}
Contact #: ${receiverContact}
Mode of Payment: Cash on Delivery - ${this.formatPrice(this.calculateTotal)}

Special Instructions: ${this.specialInstructions || ''}`;
        },
        isFormValid() {
            if (this.localItems.length === 0 || !this.selectedPaymentMethod || this.processingPayment) {
                return false;
            }
            
            // Additional validation for HATID delivery
            if (this.selectedPaymentMethod === 'hatid' && !this.deliveryAddress.trim()) {
                return false;
            }
            
            return true;
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
        updatePackagingPreference() {
            console.log('Packaging preference changed to:', this.packagingPreference ? 'plastic' : 'eco');
        },
        getConfirmButtonText() {
            if (this.selectedPaymentMethod === 'gcash') {
                return 'Pay with GCash';
            } else if (this.selectedPaymentMethod === 'hatid') {
                return 'Order via HATID';
            }
            return 'Confirm Order';
        },
        async confirmOrder() {
            // Validate HATID delivery address
            if (this.selectedPaymentMethod === 'hatid' && !this.deliveryAddress.trim()) {
                this.$emit('payment-error', 'Please provide a delivery address for HATID delivery');
                return;
            }
            
            this.processingPayment = true;
            
            try {
                const formattedItems = this.localItems.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                    choice_id: item.choice_id
                }));
                
                const orderData = {
                    items: formattedItems,
                    discountId: this.selectedDiscountId,
                    packagingPreference: this.packagingPreference ? 'plastic' : 'eco',
                    paymentMethod: this.selectedPaymentMethod,
                    deliveryAddress: this.selectedPaymentMethod === 'hatid' ? this.deliveryAddress : null
                };
                
                console.log('Order data being sent:', orderData);
                
                if (this.selectedPaymentMethod === 'gcash') {
                    await this.processGCashPayment(orderData);
                } else if (this.selectedPaymentMethod === 'hatid') {
                    await this.processHatidOrder(orderData);
                } else {
                    this.$emit('place-order', orderData);
                }
            } catch (error) {
                console.error('Error processing order:', error);
                this.$emit('payment-error', error.message || 'Failed to process payment');
            } finally {
                this.processingPayment = false;
            }
        },
        
        async processGCashPayment(orderData) {
            try {
                // First create the order
                const token = localStorage.getItem('token');
                const orderResponse = await fetch('http://localhost:7904/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        items: orderData.items,
                        totalAmount: this.calculateTotal,
                        discountId: orderData.discountId,
                        packagingPreference: orderData.packagingPreference
                    })
                });

                if (!orderResponse.ok) {
                    throw new Error('Failed to create order');
                }

                 const { orderId } = await orderResponse.json();

                // Create GCash payment
                const paymentResponse = await fetch('http://localhost:7904/api/payment/gcash/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        orderId: orderId,
                        amount: this.calculateTotal
                    })
                });

                if (!paymentResponse.ok) {
                    throw new Error('Failed to create GCash payment');
                }

                const paymentData = await paymentResponse.json();
                
                // Open payment in new window instead of redirecting
                const paymentWindow = window.open(
                    paymentData.checkoutUrl,
                    'gcash-payment',
                    'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,location=no,directories=no,status=no,menubar=no'
                );

                if (!paymentWindow) {
                    throw new Error('Payment window blocked. Please allow popups and try again.');
                }

                // Monitor the payment window
                this.monitorPaymentWindow(paymentWindow, orderId);
                
            } catch (error) {
                console.error('GCash payment error:', error);
                throw error;
            }
        },
         monitorPaymentWindow(paymentWindow, orderId) {
            const checkWindow = setInterval(() => {
                try {
                    // Check if window is closed
                    if (paymentWindow.closed) {
                        clearInterval(checkWindow);
                        this.processingPayment = false;
                        
                        // Check payment status after window closes
                        this.checkPaymentStatus(orderId);
                        return;
                    }

                    // Try to detect success/failure URLs
                    try {
                        const currentUrl = paymentWindow.location.href;
                        
                        if (currentUrl.includes('payment-success')) {
                            clearInterval(checkWindow);
                            paymentWindow.close();
                            this.handlePaymentSuccess(orderId);
                        } else if (currentUrl.includes('payment-failed')) {
                            clearInterval(checkWindow);
                            paymentWindow.close();
                            this.handlePaymentFailure(orderId);
                        }
                    } catch (e) {
                        // Cross-origin restrictions prevent URL access
                        // This is expected behavior
                    }
                } catch (error) {
                    console.error('Error monitoring payment window:', error);
                }
            }, 1000);

            // Set a timeout for the payment window (10 minutes)
            setTimeout(() => {
                if (!paymentWindow.closed) {
                    clearInterval(checkWindow);
                    paymentWindow.close();
                    this.processingPayment = false;
                    this.$emit('payment-error', 'Payment session expired. Please try again.');
                }
            }, 600000); // 10 minutes
        },
        async checkPaymentStatus(orderId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:7904/api/payment/status/${orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const paymentStatus = await response.json();
                    
                    if (paymentStatus.status === 'succeeded') {
                        this.handlePaymentSuccess(orderId);
                    } else if (paymentStatus.status === 'failed') {
                        this.handlePaymentFailure(orderId);
                    } else {
                        // Payment still pending
                        this.$emit('payment-error', 'Payment status is still pending. Please check your order history.');
                    }
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
                this.$emit('payment-error', 'Unable to verify payment status. Please check your order history.');
            }
        },
        handlePaymentSuccess(orderId) {
            this.processingPayment = false;
            this.$emit('close');
            
            // Show success message
            this.$emit('payment-success', {
                message: `Payment successful! Order #${orderId} has been processed.`,
                orderId: orderId
            });
            
            // Redirect to order history or receipt
            this.$router.push(`/receipt/${orderId}`);
        },

        handlePaymentFailure(orderId) {
            this.processingPayment = false;
            this.$emit('payment-error', `Payment failed for Order #${orderId}. Please try again or use a different payment method.`);
        },
        
        async processHatidOrder(orderData) {
            try {
                // Create the order with HATID delivery
                const token = localStorage.getItem('token');
                const orderResponse = await fetch('http://localhost:7904/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        items: orderData.items,
                        totalAmount: this.calculateTotal,
                        discountId: orderData.discountId,
                        packagingPreference: orderData.packagingPreference,
                        paymentMethod: 'hatid',
                        deliveryAddress: orderData.deliveryAddress,
                        status: 'pending_delivery'
                    })
                });

                if (!orderResponse.ok) {
                    throw new Error('Failed to create HATID order');
                }

                const { orderId } = await orderResponse.json();
                this.currentOrderId = orderId;
                
                // Close the main modal and show HATID modal
                this.$emit('close');
                this.showHatidModal = true;
                this.processingPayment = false;
                
            } catch (error) {
                console.error('HATID order error:', error);
                throw error;
            }
        },
        
        copyMessage() {
            const textarea = this.$refs.hatidMessage;
            if (textarea) {
                textarea.select();
                textarea.setSelectionRange(0, 99999); // For mobile devices
                
                try {
                    document.execCommand('copy');
                    this.copySuccess = true;
                    
                    // Reset copy success after 2 seconds  
                    setTimeout(() => {
                        this.copySuccess = false;
                    }, 2000);
                } catch (err) {
                    console.error('Could not copy text: ', err);
                    // Fallback: try using the Clipboard API
                    navigator.clipboard.writeText(this.hatidMessage).then(() => {
                        this.copySuccess = true;
                        setTimeout(() => {
                            this.copySuccess = false;
                        }, 2000);
                    }).catch(() => {
                        this.$emit('payment-error', 'Could not copy message to clipboard');
                    });
                }
            }
        },
        
        closeHatidModal() {
            this.showHatidModal = false;
            this.copySuccess = false;
            // Show success message
            this.$emit('payment-success', {
                message: `HATID order #${this.currentOrderId} created successfully! Message HATID to complete your delivery.`,
                orderId: this.currentOrderId
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

/* Payment Method Section */
.payment-method-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f9f1;
    background-color: #fafffe;
}

.payment-methods {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
}

.payment-option {
    cursor: pointer;
}

.payment-option input[type="radio"] {
    display: none;
}

.payment-card {
    padding: 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background-color: white;
    transition: all 0.3s ease;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.payment-card i {
    font-size: 2rem;
    color: #64748b;
    transition: color 0.3s ease;
}

.payment-card span {
    font-weight: 600;
    color: #2a3f2a;
    font-size: 1.1rem;
}

.payment-card small {
    color: #64748b;
    font-size: 0.85rem;
}

.payment-option input[type="radio"]:checked + .payment-card {
    border-color: #4CAF50;
    background-color: #f8fff8;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
}

.payment-option input[type="radio"]:checked + .payment-card i {
    color: #4CAF50;
}

.gcash-card i {
    color: #007bff;
}

.payment-option input[type="radio"]:checked + .gcash-card i {
    color: #007bff;
}

.payment-option input[type="radio"]:checked + .gcash-card {
    border-color: #007bff;
    background-color: #f0f8ff;
}

.hatid-card i {
    color: #FF6B35;
}

.payment-option input[type="radio"]:checked + .hatid-card i {
    color: #FF6B35;
}

.payment-option input[type="radio"]:checked + .hatid-card {
    border-color: #FF6B35;
    background-color: #fff5f2;
}

.payment-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Delivery Address Section */
.delivery-address-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f9f1;
    background-color: #fff9f5;
}

.address-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    color: #2a3f2a;
    background-color: white;
    transition: border-color 0.2s ease;
    resize: vertical;
    font-family: inherit;
}

.address-input:focus {
    outline: none;
    border-color: #FF6B35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
}

.address-input::placeholder {
    color: #94a3b8;
}

.address-note {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    color: #FF6B35;
    font-size: 0.9rem;
}

.address-note i {
    font-size: 1rem;
}

.special-instructions-field {
    margin-top: 1.5rem;
}

.special-instructions-field .section-title {
    margin-bottom: 0.75rem;
    font-size: 1rem;
}

/* Packaging Section */
.packaging-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f9f1;
    background-color: #fafffe;
}

.packaging-toggle {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #4CAF50;
    transition: .4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: #FFA500;
}

input:checked + .slider:before {
    transform: translateX(26px);
}

.toggle-label {
    font-weight: 600;
    color: #2a3f2a;
    font-size: 1rem;
    transition: color 0.3s ease;
}

.toggle-label.plastic-requested {
    color: #B8860B;
}

.packaging-note {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background-color: #f8fffe;
    border-radius: 8px;
    border-left: 4px solid #4CAF50;
    font-size: 0.9rem;
    color: #2a3f2a;
    line-height: 1.4;
    transition: all 0.3s ease;
}

.packaging-note i {
    color: #4CAF50;
    font-size: 1.1rem;
    flex-shrink: 0;
    transition: color 0.3s ease;
}

.packaging-note span {
    flex: 1;
}

.packaging-note.plastic-selected {
    border-left-color: #FFA500;
    background-color: #fffbf0;
    color: #B8860B;
}

.packaging-note.plastic-selected i {
    color: #FFA500;
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

.cancel-btn:hover:not(:disabled) {
    background-color: #f8f9fa;
    border-color: #cbd5e1;
    transform: translateY(-2px);
}

.cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .payment-methods {
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }
}

@media (max-width: 768px) {
    .modal-content {
        margin: 1rem;
        max-height: 95vh;
    }
    
    .modal-header, .payment-method-section, .delivery-address-section, .packaging-section, .discount-section, .scrollable-content, .fixed-bottom {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }
    
    .payment-methods {
        grid-template-columns: 1fr;
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

/* HATID Modal Styles */
.hatid-modal-content {
    background-color: white;
    border-radius: 16px;
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #FF6B35;
    animation: modalSlideIn 0.3s ease-out;
}

.hatid-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid #fff5f2;
}

.hatid-modal-header h3 {
    margin: 0;
    color: #2a3f2a;
    font-size: 1.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.hatid-modal-header h3 i {
    color: #FF6B35;
}

.hatid-modal-body {
    padding: 1.5rem 2rem;
    overflow-y: auto;
}

.order-success-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    margin-bottom: 1.5rem;
}

.order-success-info i {
    color: #0ea5e9;
    font-size: 1.25rem;
}

.order-success-info p {
    margin: 0;
    color: #0c4a6e;
    font-weight: 600;
}

.message-section h4 {
    margin: 0 0 1rem 0;
    color: #2a3f2a;
    font-size: 1.1rem;
    font-weight: 600;
}

.message-box {
    margin-bottom: 1.5rem;
}

.message-textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #2a3f2a;
    background-color: #f8f9fa;
    resize: none;
    font-family: 'Courier New', monospace;
    line-height: 1.5;
}

.message-textarea:focus {
    outline: none;
    border-color: #FF6B35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
}

.copy-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.copy-btn, .messenger-btn {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    text-decoration: none;
    border: 2px solid transparent;
}

.copy-btn {
    background-color: #FF6B35;
    color: white;
    border-color: #FF6B35;
}

.copy-btn:hover {
    background-color: #e55a2b;
    border-color: #e55a2b;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.copy-btn i.fa-check {
    color: #10b981;
}

.messenger-btn {
    background-color: #1877f2;
    color: white;
    border-color: #1877f2;
}

.messenger-btn:hover {
    background-color: #166fe5;
    border-color: #166fe5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3);
    text-decoration: none;
    color: white;
}

.instruction-note {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background-color: #fff5f2;
    border: 1px solid #fed7cc;
    border-radius: 8px;
    color: #9a3412;
    font-size: 0.9rem;
    line-height: 1.4;
}

.instruction-note i {
    color: #ea580c;
    font-size: 1rem;
    margin-top: 0.1rem;
    flex-shrink: 0;
}

.instruction-note p {
    margin: 0;
}

.hatid-modal-actions {
    padding: 1rem 2rem 1.5rem;
    border-top: 1px solid #fff5f2;
}

.done-btn {
    width: 100%;
    padding: 1rem 1.5rem;
    background-color: #4CAF50;
    color: white;
    border: 2px solid #4CAF50;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.done-btn:hover {
    background-color: #45a049;
    border-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* Responsive Design for HATID Modal */
@media (max-width: 768px) {
    .hatid-modal-content {
        margin: 1rem;
        max-height: 90vh;
    }
    
    .copy-actions {
        flex-direction: column;
    }
    
    .hatid-modal-header, .hatid-modal-body, .hatid-modal-actions {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }
}

@media (max-width: 480px) {
    .hatid-modal-header h3 {
        font-size: 1.25rem;
    }
}
</style>