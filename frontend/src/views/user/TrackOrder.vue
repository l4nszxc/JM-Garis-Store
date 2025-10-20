<template>
    <div class="view-order-container">
        <Navbar :username="username" @logout="showLogoutModal = true" />    

        <div class="view-order-content">
            <h1><i class="fas fa-truck-loading"></i> Track Orders</h1>
            
            <div class="active-orders">
                <!-- Loading State -->
                <div v-if="isLoadingOrders" class="loading-container">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p class="loading-text">Loading active orders...</p>
                </div>
                
                <!-- Orders List -->
                <div v-else-if="activeOrders.length > 0">
                    <div v-for="order in activeOrders" :key="order.order_id" class="order-card">
                        <!-- Order Header -->
                        <div class="order-header">
                            <div class="order-main-info">
                                <h3>Order #{{ order.order_id }}</h3>
                                <p class="order-date">{{ formatDate(order.created_at) }}</p>
                            </div>
                            <div class="order-total">
                                <span class="total-label">Total</span>
                                <span class="total-amount">{{ formatPrice(order.total_amount) }}</span>
                            </div>
                        </div>

                        <!-- Status and Payment Info -->
                        <div class="order-status-section">
                            <div class="badges-container">
                                <span :class="['status-badge', getStatusClass(order.status)]">
                                    <i :class="getStatusIcon(order.status)"></i>
                                    {{ getStatusDisplay(order.status) }}
                                </span>
                                <span :class="['payment-badge', getPaymentClass(order.payment_method)]">
                                    <i :class="getPaymentIcon(order.payment_method)"></i>
                                    {{ getPaymentDisplay(order.payment_method) }}
                                </span>
                            </div>
                            
                            <!-- GCash Payment Details -->
                            <div v-if="order.payment_method === 'gcash'" class="gcash-payment-info">
                                <div v-if="order.gcash_reference" class="gcash-reference-info">
                                    <i class="fab fa-google-pay"></i>
                                    <div class="gcash-details">
                                        <span class="gcash-label">GCash Reference:</span>
                                        <span class="gcash-reference">{{ order.gcash_reference }}</span>
                                    </div>
                                </div>
                                <div v-if="order.payment_status === 'pending_verification' || order.status === 'to verify'" class="verification-status pending">
                                    <i class="fas fa-clock"></i>
                                    <span>Payment verification pending</span>
                                </div>
                                <div v-else-if="order.payment_status === 'succeeded' || order.status === 'paid'" class="verification-status verified">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Payment verified</span>
                                    <small v-if="order.verified_at">{{ formatDate(order.verified_at) }}</small>
                                </div>
                                <div v-else-if="order.payment_status === 'failed'" class="verification-status failed">
                                    <i class="fas fa-times-circle"></i>
                                    <span>Payment verification failed</span>
                                </div>
                                <div v-if="order.receiptImageUrl" class="gcash-receipt-section">
                                    <button 
                                        @click="toggleReceiptImage(order.order_id)" 
                                        class="receipt-toggle-btn"
                                    >
                                        <i class="fas fa-receipt"></i>
                                        {{ order.showReceipt ? 'Hide Receipt' : 'View Receipt' }}
                                        <i :class="['fas', order.showReceipt ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                                    </button>
                                    <div v-show="order.showReceipt" class="receipt-image-container">
                                        <div class="receipt-image-wrapper">
                                            <img 
                                                :src="order.receiptImageUrl" 
                                                alt="GCash Payment Receipt"
                                                class="receipt-image"
                                                @error="handleImageError"
                                                @click="openReceiptModal(order)"
                                                title="Click to view full size"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Cancel reason if applicable -->
                            <div v-if="order.cancel_reason" class="cancel-info">
                                <i class="fas fa-info-circle"></i>
                                <span>{{ order.cancel_reason }}</span>
                            </div>

                            <!-- Estimated time for preparing orders -->
                            <div v-if="order.status === 'preparing'" class="estimated-time" :class="{'delayed': isPastDue(order.estimatedPickupTime)}">
                                <i :class="['fas', isPastDue(order.estimatedPickupTime) ? 'fa-exclamation-triangle' : 'fa-clock']"></i>
                                <span v-if="isPastDue(order.estimatedPickupTime)" class="delay-text">
                                    Order delayed - Please wait
                                </span>
                                <span v-else class="eta-text">
                                    Ready by {{ formatDate(order.estimatedPickupTime) }}
                                </span>
                            </div>

                            <!-- Staff info for preparing orders -->
                            <div v-if="order.status === 'preparing' && order.staff_name" class="staff-info">
                                <i class="fas fa-utensils"></i>
                                <span>Prepared by {{ order.staff_name }}</span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="order-actions">
                            <button class="toggle-btn" @click="toggleOrderDetails(order.order_id)">
                                <i :class="['fas', expandedOrders.has(order.order_id) ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                                {{ expandedOrders.has(order.order_id) ? 'Hide' : 'Details' }}
                            </button>
                            <button 
                                v-if="order.status.toLowerCase() === 'pending'" 
                                @click="showCancelModal(order)" 
                                class="cancel-btn"
                            >
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                        </div>

                        <!-- Order Items (Expandable) -->
                        <div v-show="expandedOrders.has(order.order_id)" class="order-details">
                            <div class="items-list">
                                <div v-for="item in order.items" :key="item.product_id" class="order-item">
                                    <img 
                                        :src="item.image || '/img/placeholder.jpg'"
                                        :alt="item.name"
                                        class="item-image"
                                        @error="handleImageError"
                                    >
                                    <div class="item-info">
                                        <h4>{{ item.name }}</h4>
                                        <p v-if="item.choice_name" class="item-choice">{{ item.choice_name }}</p>
                                        <div class="item-pricing">
                                            <span class="quantity">{{ item.quantity }}x</span>
                                            <span class="price">{{ formatPrice(item.price) }}</span>
                                            <span class="subtotal">{{ formatPrice(item.price * item.quantity) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Order Summary -->
                            <div class="order-summary">
                                <div class="summary-row">
                                    <span>Subtotal</span>
                                    <span>{{ formatPrice(order.subtotal) }}</span>
                                </div>
                                <div v-if="order.discount_amount > 0" class="summary-row discount">
                                    <span>Discount</span>
                                    <span>-{{ formatPrice(order.discount_amount) }}</span>
                                </div>
                                <div class="summary-row total">
                                    <span>Total</span>
                                    <span>{{ formatPrice(order.total_amount) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- No Orders -->
                <div v-else-if="!isLoadingOrders" class="no-orders">
                    <i class="fas fa-box-open"></i>
                    <p>No active orders found</p>
                    <router-link to="/products" class="shop-now-btn">
                        <i class="fas fa-shopping-cart"></i> Shop Now
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Cancel Order Modal -->
        <div v-if="showCancelOrderModal" class="modal-overlay">
            <div class="modal-content">
                <h3>Cancel Order</h3>
                <p>Are you sure you want to cancel this order?</p>
                
                <div class="cancel-reason">
                    <label for="cancelReason">Please provide a reason:</label>
                    <select v-model="cancelReason" id="cancelReason" required>
                        <option value="">Select a reason</option>
                        <option value="Changed my mind">Changed my mind</option>
                        <option value="Ordered by mistake">Ordered by mistake</option>
                        <option value="Found better price elsewhere">Found better price elsewhere</option>
                        <option value="Other">Other</option>
                    </select>
                    
                    <textarea 
                        v-if="cancelReason === 'Other'"
                        v-model="otherReason"
                        placeholder="Please specify your reason"
                        rows="3"
                    ></textarea>
                </div>

                <div class="modal-buttons">
                    <button 
                        @click="confirmCancelOrder" 
                        class="confirm-btn"
                        :disabled="!cancelReason"
                    >
                        <i class="fas fa-check"></i> Confirm Cancel
                    </button>
                    <button @click="closeCancelModal" class="close-btn">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>

        <!-- Receipt Modal -->
        <div v-if="showReceiptModal" class="modal-overlay" @click="closeReceiptModal">
            <div class="modal-content receipt-modal" @click.stop>
                <div class="modal-header">
                    <h3><i class="fas fa-receipt"></i> Payment Receipt</h3>
                    <button @click="closeReceiptModal" class="close-modal-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div v-if="selectedReceiptOrder" class="receipt-info">
                        <div class="order-info-header">
                            <strong>Order #{{ selectedReceiptOrder.order_id }}</strong>
                            <span class="order-date">{{ formatDate(selectedReceiptOrder.created_at) }}</span>
                        </div>
                        <div v-if="selectedReceiptOrder.gcash_reference" class="gcash-ref">
                            <i class="fab fa-google-pay"></i>
                            <span>Ref: {{ selectedReceiptOrder.gcash_reference }}</span>
                        </div>
                    </div>
                    <div class="receipt-image-wrapper">
                        <img 
                            v-if="selectedReceiptOrder && selectedReceiptOrder.receiptImageUrl"
                            :src="selectedReceiptOrder.receiptImageUrl" 
                            alt="GCash Payment Receipt"
                            class="receipt-modal-image"
                            @error="handleImageError"
                        />
                        <div v-else class="no-receipt">
                            <i class="fas fa-image"></i>
                            <p>Receipt image not available</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <LogoutModal 
            :show="showLogoutModal"
            @confirm="handleLogout"
            @cancel="showLogoutModal = false"
        />
    </div>
</template>
<script>
import Navbar from '../../components/Navbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';
import { apiMixin } from '../../mixins/apiMixin.js';

export default {
    name: 'TrackOrder',
    mixins: [apiMixin],
    components: {
        Navbar,
        LogoutModal
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            orders: [],
            showCancelOrderModal: false,
            selectedOrder: null,
            cancelReason: '',
            otherReason: '',
            expandedOrders: new Set(), // Add this line
            isLoadingOrders: false,
            showReceiptModal: false,
            selectedReceiptOrder: null
        }
    },
    computed: {
        activeOrders() {
            return this.orders.map(order => ({
                ...order,
                total_amount: order.total_amount
            })).filter(order => 
                order.status !== 'cancelled' && order.status !== 'paid'
            );
        }
    },
    methods: {
        getStatusClass(status) {
            const statusMap = {
                'pending': 'pending',
                'pending_payment': 'pending-payment',
                'pending_pickup': 'pending-pickup',
                'pending_delivery': 'pending-delivery',
                'paid using gcash': 'paid-gcash',
                'preparing': 'preparing',
                'ready for pickup': 'ready',
                'paid': 'paid',
                'to verify': 'to-verify',
                'cancelled': 'cancelled',
                'completed': 'completed'
            };
            return statusMap[status.toLowerCase()] || 'pending';
        },
        getStatusIcon(status) {
            const iconMap = {
                'pending': 'fas fa-clock',
                'pending_payment': 'fas fa-credit-card',
                'pending_pickup': 'fas fa-hand-holding',
                'pending_delivery': 'fas fa-truck',
                'paid using gcash': 'fas fa-mobile-alt',
                'preparing': 'fas fa-utensils',
                'ready for pickup': 'fas fa-check-circle',
                'paid': 'fas fa-check-double',
                'to verify': 'fas fa-search',
                'cancelled': 'fas fa-times-circle',
                'completed': 'fas fa-flag-checkered'
            };
            return iconMap[status.toLowerCase()] || 'fas fa-clock';
        },
        getStatusDisplay(status) {
            const displayMap = {
                'pending': 'Pending',
                'pending_payment': 'Pending Payment',
                'pending_pickup': 'Pending Pickup',
                'pending_delivery': 'Pending Delivery',
                'paid using gcash': 'Paid via GCash',
                'preparing': 'Preparing',
                'ready for pickup': 'Ready for Pickup',
                'paid': 'Paid',
                'to verify': 'To Verify',
                'cancelled': 'Cancelled',
                'completed': 'Completed'
            };
            return displayMap[status.toLowerCase()] || status;
        },
        getPaymentClass(paymentMethod) {
            const methodMap = {
                'cash': 'payment-cash',
                'gcash': 'payment-gcash',
                'hatid': 'payment-hatid'
            };
            return methodMap[paymentMethod] || 'payment-cash';
        },
        getPaymentIcon(paymentMethod) {
            const iconMap = {
                'cash': 'fas fa-money-bill-wave',
                'gcash': 'fas fa-mobile-alt',
                'hatid': 'fas fa-truck'
            };
            return iconMap[paymentMethod] || 'fas fa-money-bill-wave';
        },
        getPaymentDisplay(paymentMethod) {
            const displayMap = {
                'cash': 'Cash on Pickup',
                'gcash': 'GCash',
                'hatid': 'Deliver with HATID'
            };
            return displayMap[paymentMethod] || paymentMethod;
        },
        isPastDue(estimatedTime) {
            if (!estimatedTime) return false;
            return new Date(estimatedTime) < new Date();
        },
        formatPrice(price) {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price).replace('PHP', '₱');
        },
        toggleOrderDetails(orderId) {
            if (this.expandedOrders.has(orderId)) {
                this.expandedOrders.delete(orderId);
            } else {
                this.expandedOrders.add(orderId);
            }
        },
        toggleReceiptImage(orderId) {
            const order = this.orders.find(o => o.order_id === orderId);
            if (order) {
                order.showReceipt = !order.showReceipt;
            }
        },
        openReceiptModal(order) {
            this.selectedReceiptOrder = order;
            this.showReceiptModal = true;
        },
        closeReceiptModal() {
            this.showReceiptModal = false;
            this.selectedReceiptOrder = null;
        },
        formatDate(date) {
            if (!date) return 'Not available';
            
            try {
                return new Date(date).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                console.error('Error formatting date:', error);
                return 'Invalid date';
            }
        },
        handleImageError(e) {
            e.target.src = '/img/placeholder.jpg';
        },
        showCancelModal(order) {
            this.selectedOrder = order;
            this.showCancelOrderModal = true;
            this.cancelReason = '';
            this.otherReason = '';
        },
        closeCancelModal() {
            this.showCancelOrderModal = false;
            this.selectedOrder = null;
            this.cancelReason = '';
            this.otherReason = '';
        },
        
        async confirmCancelOrder() {
            if (!this.cancelReason) return;

            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch(`/api/orders/${this.selectedOrder.order_id}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        reason: this.cancelReason === 'Other' ? this.otherReason : this.cancelReason
                    })
                });

                if (response.ok) {
                    await this.fetchOrders();
                    this.closeCancelModal();
                }
            } catch (error) {
                console.error('Error canceling order:', error);
            }
        },
        async fetchOrders() {
            this.isLoadingOrders = true;
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/orders/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const orders = await response.json();
                    // Ensure each order has a valid estimatedPickupTime
                    this.orders = orders.map(order => {
                        let orderWithEstimate = { ...order };
                        
                        if (order.status === 'preparing') {
                            // Calculate estimated time: 3 minutes per product
                            const timePerProduct = 180; // 180 seconds (3 minutes) per product
                            const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                            const estimatedSeconds = totalQuantity * timePerProduct;
                            
                            const estimatedTime = new Date(order.accepted_at);
                            estimatedTime.setSeconds(estimatedTime.getSeconds() + estimatedSeconds);
                            
                            orderWithEstimate.estimatedPickupTime = estimatedTime.toISOString();
                        }
                        
                        return orderWithEstimate;
                    });

                    // Load receipt images for GCash orders
                    console.log('🔍 Looking for GCash orders to load receipt images...');
                    for (const order of this.orders) {
                        if (order.payment_method === 'gcash') {
                            console.log(`📱 Loading receipt image for GCash order ${order.order_id}`);
                            await this.loadOrderReceiptImage(order.order_id);
                        }
                    }
                    console.log('✅ Finished loading receipt images');
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                this.isLoadingOrders = false;
            }
        },
        async handleLogout() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/users/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    localStorage.removeItem('token');
                    this.$router.push('/login');
                } else {
                    throw new Error('Logout failed');
                }
            } catch (error) {
                console.error('Error during logout:', error);
            } finally {
                this.showLogoutModal = false;
            }
        },
        async loadOrderReceiptImage(orderId) {
            console.log(`🖼️ Loading receipt image for order ${orderId}...`);
            try {
                const token = localStorage.getItem('token');
                console.log(`📡 Fetching payment intent for order ${orderId}`);
                const response = await this.$fetch(`/api/payment/user/payment-intent/${orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const paymentData = await response.json();
                    console.log(`Payment data for order ${orderId}:`, paymentData);
                    console.log(`Verification method: ${paymentData.verification_method}, Has receipt: ${paymentData.has_receipt_image}`);
                    
                    if (paymentData.verification_method === 'receipt' && paymentData.has_receipt_image) {
                        // Load the receipt image
                        const imageResponse = await this.$fetch(`/api/payment/user/receipt/${paymentData.payment_intent_id}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (imageResponse.ok) {
                            const blob = await imageResponse.blob();
                            const imageUrl = URL.createObjectURL(blob);
                            
                            // Find the order and add the receipt image URL
                            const order = this.orders.find(o => o.order_id === orderId);
                            if (order) {
                                // Direct assignment works in Vue 3
                                order.receiptImageUrl = imageUrl;
                                order.showReceipt = false; // Initialize as hidden
                                console.log(`Receipt image loaded for order ${orderId}:`, imageUrl);
                            }
                        } else {
                            console.log(`No receipt image found for order ${orderId}`);
                        }
                    } else {
                        console.log(`Order ${orderId} uses ${paymentData.verification_method} verification, no receipt image needed`);
                    }
                } else if (response.status === 404) {
                    console.log(`Payment intent not found for order ${orderId} (this is normal for some orders)`);
                } else {
                    console.warn(`Error fetching payment intent for order ${orderId}: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error(`Error loading receipt image for order ${orderId}:`, error);
            }
        },
        async getUserData() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    this.$router.push('/login');
                    return;
                }

                // Get username from token
                const decoded = JSON.parse(atob(token.split('.')[1]));
                this.username = decoded.username;
            } catch (error) {
                console.error('Error getting user data:', error);
            }
        }
    },
    mounted() {
        this.getUserData();
        this.fetchOrders();
    }
}
</script>

<style scoped>
.view-order-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f8f9fa;
}

.view-order-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
}

.view-order-content h1 {
    color: #2c3e50;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
}

.order-card {
    background: white;
    border-radius: 12px;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    overflow: hidden;
    border: 1px solid #e9ecef;
}

/* Order Header */
.order-header {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.order-main-info h3 {
    margin: 0 0 0.25rem 0;
    color: #2c3e50;
    font-size: 1.1rem;
    font-weight: 600;
}

.order-date {
    margin: 0;
    color: #6c757d;
    font-size: 0.875rem;
}

.order-total {
    text-align: right;
}

.total-label {
    display: block;
    color: #6c757d;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.total-amount {
    color: #2c3e50;
    font-size: 1.25rem;
    font-weight: 700;
}

/* Status Section */
.order-status-section {
    padding: 0 1rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.badges-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.status-badge, .payment-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.cancel-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #dc3545;
    font-size: 0.875rem;
    padding: 0.5rem;
    background-color: #f8d7da;
    border-radius: 6px;
    border: 1px solid #f5c6cb;
}

.estimated-time {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    background-color: #e3f2fd;
    color: #1976d2;
    border: 1px solid #bbdefb;
}

.estimated-time.delayed {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.staff-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #28a745;
    padding: 0.5rem;
    background-color: #d4edda;
    border-radius: 6px;
    border: 1px solid #c3e6cb;
}

/* Status Colors */
.pending {
    background-color: #fff3cd;
    color: #856404;
}

.pending-payment {
    background-color: #fef7e0;
    color: #92400e;
}

.pending-pickup {
    background-color: #e0f2fe;
    color: #0277bd;
}

.pending-delivery {
    background-color: #e8f5e9;
    color: #2e7d32;
}

.preparing {
    background-color: #e3f2fd;
    color: #1976d2;
}

.ready {
    background-color: #d4edda;
    color: #155724;
}

.paid {
    background-color: #d1e7dd;
    color: #0f5132;
}

.paid-gcash {
    background-color: #cff4fc;
    color: #055160;
}

.to-verify {
    background-color: #fef3e8;
    color: #c2410c;
}

.cancelled {
    background-color: #f8d7da;
    color: #842029;
}

.completed {
    background-color: #d1ecf1;
    color: #0c5460;
}

.payment-cash {
    background-color: #fff2cc;
    color: #664d03;
}

.payment-gcash {
    background-color: #007bff;
    color: white;
}

.payment-hatid {
    background-color: #28a745;
    color: white;
}

/* Action Buttons */
.order-actions {
    padding: 0 1rem 1rem 1rem;
    display: flex;
    gap: 0.5rem;
}

.toggle-btn, .cancel-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s ease;
    font-weight: 500;
}

.toggle-btn:hover {
    background-color: #f8f9fa;
    border-color: #4CAF50;
    color: #4CAF50;
}

.cancel-btn {
    background-color: #dc3545;
    color: white;
    border-color: #dc3545;
}

.cancel-btn:hover {
    background-color: #c82333;
    border-color: #c82333;
}

/* Order Details */
.order-details {
    border-top: 1px solid #f0f0f0;
    background-color: #fafafa;
}

.items-list {
    padding: 1rem;
}

.order-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    border: 1px solid #e9ecef;
}

.item-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
    flex-shrink: 0;
}

.item-info {
    flex: 1;
    min-width: 0;
}

.item-info h4 {
    margin: 0 0 0.25rem 0;
    color: #2c3e50;
    font-size: 0.875rem;
    font-weight: 600;
}

.item-choice {
    margin: 0 0 0.5rem 0;
    color: #6c757d;
    font-size: 0.75rem;
    font-style: italic;
}

.item-pricing {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.quantity {
    color: #6c757d;
}

.price {
    color: #2c3e50;
}

.subtotal {
    color: #2c3e50;
    font-weight: 600;
    margin-left: auto;
}

/* Order Summary */
.order-summary {
    padding: 1rem;
    border-top: 1px solid #e9ecef;
    background: white;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    font-size: 0.875rem;
}

.summary-row.discount {
    color: #28a745;
}

.summary-row.total {
    border-top: 1px solid #e9ecef;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    color: #2c3e50;
}

/* No Orders */
.no-orders {
    text-align: center;
    padding: 3rem 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.no-orders i {
    font-size: 3rem;
    color: #dee2e6;
    margin-bottom: 1rem;
}

.no-orders p {
    color: #6c757d;
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
}

/* Loading State */
.loading-container {
    text-align: center;
    padding: 4rem 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.loading-spinner {
    margin-bottom: 1.5rem;
}

.loading-spinner i {
    font-size: 3rem;
    color: #4CAF50;
    animation: spin 1s linear infinite;
}

.loading-text {
    color: #6c757d;
    font-size: 1.1rem;
    margin: 0;
    font-weight: 500;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.shop-now-btn {
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.shop-now-btn:hover {
    background-color: #45a049;
    transform: translateY(-1px);
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
}

.modal-content {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    width: 100%;
    max-width: 400px;
}

.modal-content h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
    font-size: 1.25rem;
}

.cancel-reason {
    margin: 1rem 0;
}

.cancel-reason label {
    display: block;
    margin-bottom: 0.5rem;
    color: #2c3e50;
    font-weight: 500;
}

.cancel-reason select,
.cancel-reason textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
}

.cancel-reason textarea {
    resize: vertical;
    min-height: 80px;
}

.modal-buttons {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
}

.confirm-btn, .close-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.confirm-btn {
    background-color: #dc3545;
    color: white;
}

.confirm-btn:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}

.close-btn {
    background-color: #6c757d;
    color: white;
}

/* Receipt Modal Styles */
.receipt-modal {
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
    margin: 0;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.close-modal-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #6c757d;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
}

.close-modal-btn:hover {
    background-color: #f8f9fa;
    color: #495057;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
}

.receipt-info {
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
}

.order-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.order-info-header strong {
    color: #2c3e50;
    font-size: 1.1rem;
}

.order-date {
    color: #6c757d;
    font-size: 0.875rem;
}

.gcash-ref {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #28a745;
    font-weight: 500;
}

.gcash-ref i {
    font-size: 1.1rem;
}

.receipt-image-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    background-color: #f8f9fa;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    padding: 1rem;
}

.receipt-modal-image {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.no-receipt {
    text-align: center;
    color: #6c757d;
}

.no-receipt i {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    display: block;
}

.no-receipt p {
    margin: 0;
    font-size: 1rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .view-order-content {
        padding: 0.75rem;
    }

    .view-order-content h1 {
        font-size: 1.25rem;
        margin-bottom: 1rem;
    }

    .order-header {
        flex-direction: column;
        gap: 0.75rem;
    }

    .order-total {
        text-align: left;
    }

    .total-amount {
        font-size: 1.1rem;
    }

    .badges-container {
        gap: 0.375rem;
    }

    .status-badge, .payment-badge {
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
    }

    .order-actions {
        flex-direction: column;
    }

    .toggle-btn, .cancel-btn {
        justify-content: center;
        padding: 0.75rem;
    }

    .order-item {
        gap: 0.5rem;
        padding: 0.5rem;
    }

    .item-image {
        width: 50px;
        height: 50px;
    }

    .item-info h4 {
        font-size: 0.8rem;
    }

    .item-pricing {
        font-size: 0.8rem;
        gap: 0.375rem;
    }

    .modal-buttons {
        flex-direction: column;
    }

    .modal-buttons button {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .view-order-content {
        padding: 0.5rem;
    }

    .order-card {
        margin-bottom: 0.75rem;
    }

    .order-header,
    .order-status-section,
    .order-actions {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
    }

    .order-status-section {
        padding-bottom: 0.75rem;
    }

    .order-actions {
        padding-bottom: 0.75rem;
    }

    .items-list,
    .order-summary {
        padding: 0.75rem;
    }
    /* Receipt Modal Mobile Styles */
    .receipt-modal {
        max-width: 95vw;
        max-height: 95vh;
        margin: 0.5rem;
    }
    
    .modal-header {
        padding-bottom: 0.75rem;
        margin-bottom: 0.75rem;
    }
    
    .modal-header h3 {
        font-size: 1.1rem;
    }
    
    .receipt-info {
        padding: 0.75rem;
        margin-bottom: 0.75rem;
    }
    
    .order-info-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }
    
    .receipt-image-wrapper {
        min-height: 150px;
        padding: 0.75rem;
    }
    
    .receipt-modal-image {
        max-height: 50vh;
    }
}

/* Receipt Display Styles */
.receipt-image-container {
    margin-top: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    border: 2px solid rgba(25, 118, 210, 0.2);
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.receipt-image-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}

.receipt-image {
    max-width: 100%;
    max-height: 150px;
    width: auto;
    height: auto;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease;
    cursor: pointer;
}

.receipt-image:hover {
    transform: scale(1.02);
}

/* Mobile styles for receipt display */
@media (max-width: 768px) {
    .receipt-image {
        max-height: 120px;
    }
    
    .receipt-image-container {
        padding: 0.4rem;
        margin-top: 0.4rem;
    }
    
    .receipt-toggle-btn {
        font-size: 0.8rem;
        padding: 0.5rem;
    }
    
    .gcash-receipt-section {
        margin-top: 0.4rem;
    }
}

@media (max-width: 480px) {
    .receipt-image {
        max-height: 100px;
    }
    
    .receipt-image-container {
        padding: 0.3rem;
        margin-top: 0.3rem;
    }
    
    .receipt-toggle-btn {
        font-size: 0.75rem;
        padding: 0.4rem;
    }
    
    .gcash-receipt-section {
        margin-top: 0.3rem;
    }
}

/* GCash Payment Information Styles */
.gcash-payment-info {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
    border-radius: 8px;
    border: 1px solid #bbdefb;
}

.gcash-reference-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.gcash-reference-info i {
    font-size: 1.5rem;
    color: #1976d2;
}

.gcash-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.gcash-label {
    font-size: 0.75rem;
    color: #6c757d;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.gcash-reference {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    font-weight: 700;
    color: #1976d2;
    background: rgba(25, 118, 210, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(25, 118, 210, 0.2);
}

.verification-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    margin-top: 0.5rem;
}

.verification-status i {
    font-size: 0.8rem;
}

.verification-status.pending {
    background: rgba(255, 193, 7, 0.1);
    color: #e65100;
    border: 1px solid rgba(255, 193, 7, 0.3);
}

.verification-status.pending i {
    color: #ff9800;
}

.verification-status.verified {
    background: rgba(76, 175, 80, 0.1);
    color: #2e7d32;
    border: 1px solid rgba(76, 175, 80, 0.3);
}

.verification-status.verified i {
    color: #4caf50;
}

.verification-status.failed {
    background: rgba(244, 67, 54, 0.1);
    color: #c62828;
    border: 1px solid rgba(244, 67, 54, 0.3);
}

.verification-status.failed i {
    color: #f44336;
}

.verification-status small {
    font-size: 0.75rem;
    color: #6c757d;
    margin-left: auto;
    font-weight: normal;
}

@media (max-width: 768px) {
    .gcash-reference-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .gcash-reference-info i {
        font-size: 1.25rem;
    }
    
    .gcash-reference {
        font-size: 0.8rem;
        word-break: break-all;
    }
    
    .verification-status {
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
    }
    
    .verification-status small {
        font-size: 0.7rem;
    }
}

/* GCash Receipt Image Styles */
.gcash-receipt-section {
    margin-top: 0.5rem;
}

.receipt-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.6rem;
    background: white;
    border: 2px solid rgba(25, 118, 210, 0.2);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1976d2;
    transition: all 0.2s ease;
    margin-bottom: 0;
}

.receipt-toggle-btn:hover {
    background-color: rgba(25, 118, 210, 0.05);
    border-color: rgba(25, 118, 210, 0.4);
}

.receipt-toggle-btn i:first-child {
    margin-right: 0.5rem;
}

.receipt-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1976d2;
}

.receipt-label i {
    font-size: 0.875rem;
    color: #1976d2;
}


</style>