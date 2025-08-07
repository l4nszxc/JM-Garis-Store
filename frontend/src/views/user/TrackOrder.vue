<template>
    <div class="view-order-container">
        <Navbar :username="username" @logout="showLogoutModal = true" />    

        <div class="view-order-content">
            <h1><i class="fas fa-truck-loading"></i> Track Orders</h1>
            
            <div class="active-orders">
                <div v-if="activeOrders.length > 0">
                    <div v-for="order in activeOrders" :key="order.order_id" class="order-card">
                        <div class="order-header">
                            <div class="order-info">
                                <h3>Order #{{ order.order_id }}</h3>
                                <div class="status-container">
                                    <span :class="['status-badge', getStatusClass(order.status)]">
                                        <i :class="getStatusIcon(order.status)"></i>
                                        {{ getStatusDisplay(order.status) }}
                                    </span>
                                    <span :class="['payment-badge', getPaymentClass(order.payment_method)]">
                                        <i :class="getPaymentIcon(order.payment_method)"></i>
                                        {{ getPaymentDisplay(order.payment_method) }}
                                    </span>
                                    <span v-if="order.cancel_reason" class="cancel-reason-badge">
                                        <i class="fas fa-info-circle"></i>
                                        {{ order.cancel_reason }}
                                    </span>
                                </div>
                                <div v-if="order.status === 'preparing'" class="estimated-time" :class="{'delayed': isPastDue(order.estimatedPickupTime)}">
                                    <i :class="['fas', isPastDue(order.estimatedPickupTime) ? 'fa-exclamation-circle' : 'fa-clock']"></i>
                                    <div class="time-details">
                                        <span v-if="isPastDue(order.estimatedPickupTime)">
                                            There's been a delay in your order, please wait
                                        </span>
                                        <span v-else>Estimated ready by:</span>
                                        <strong v-if="!isPastDue(order.estimatedPickupTime)">{{ formatDate(order.estimatedPickupTime) }}</strong>
                                    </div>
                                </div>
                                <!-- Add staff info display -->
                                <div v-if="order.status === 'preparing' && order.staff_name" class="staff-info">
                                    <i class="fas fa-user"></i>
                                    <div class="staff-details">
                                        <span>Being prepared by: {{ order.staff_name }}</span>
                                        <small>{{ formatDate(order.accepted_at) }}</small>
                                    </div>
                                </div>
                            </div>
                            <div class="order-secondary-info">
                                <p class="order-date">{{ formatDate(order.created_at) }}</p>
                                <div class="price-breakdown">
                                    <p class="subtotal">
                                        <i class="fas fa-receipt"></i> Subtotal: {{ formatPrice(order.subtotal) }}
                                    </p>
                                    <p v-if="order.discount_amount > 0" class="discount-amount">
                                        <i class="fas fa-tag"></i> Discount: -{{ formatPrice(order.discount_amount) }}
                                    </p>
                                    <p class="total-amount">
                                        <i class="fas fa-peso-sign"></i> Total: {{ formatPrice(order.total_amount) }}
                                    </p>
                                </div>
                                <div class="button-group">
                                    <button class="toggle-btn" @click="toggleOrderDetails(order.order_id)">
                                        <i :class="['fas', expandedOrders.has(order.order_id) ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                                        {{ expandedOrders.has(order.order_id) ? 'Hide Details' : 'Show Details' }}
                                    </button>
                                    <button 
                                        v-if="order.status.toLowerCase() === 'pending'" 
                                        @click="showCancelModal(order)" 
                                        class="cancel-btn"
                                    >
                                        <i class="fas fa-times-circle"></i> Cancel Order
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-show="expandedOrders.has(order.order_id)" class="order-items">
                            <div v-for="item in order.items" :key="item.product_id" class="order-item">
                                <img 
                                    :src="item.image || '/img/placeholder.jpg'"
                                    :alt="item.name"
                                    class="item-image"
                                    @error="handleImageError"
                                >
                                <div class="item-details">
                                    <h4>{{ item.name }}</h4>
                                    <!-- Display choice information if available -->
                                    <p v-if="item.choice_name" class="choice-info">
                                        <i class="fas fa-tag"></i> Option: {{ item.choice_name }}
                                    </p>
                                    <p class="item-price">{{ formatPrice(item.price) }} x {{ item.quantity }}</p>
                                    <p class="item-subtotal">Subtotal: {{ formatPrice(item.price * item.quantity) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="no-orders">
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

export default {
    name: 'TrackOrder',
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
            expandedOrders: new Set() // Add this line
        }
    },
    computed: {
        activeOrders() {
            return this.orders.map(order => ({
                ...order,
                subtotal: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                discount_amount: order.discount_amount || 0,
                total_amount: order.total_amount
            })).filter(order => 
                ['pending', 'pending_payment', 'pending_pickup', 'pending_delivery', 'preparing', 'ready for pickup'].includes(order.status.toLowerCase())
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
                'preparing': 'preparing',
                'ready for pickup': 'ready',
                'paid': 'paid',
                'paid using gcash': 'paid-gcash',
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
                'preparing': 'fas fa-utensils',
                'ready for pickup': 'fas fa-check-circle',
                'paid': 'fas fa-check-double',
                'paid using gcash': 'fas fa-mobile-alt',
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
                'preparing': 'Preparing',
                'ready for pickup': 'Ready for Pickup',
                'paid': 'Paid',
                'paid using gcash': 'Paid via GCash',
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
                'hatid': 'Cash on Delivery'
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
                const response = await fetch(`http://localhost:7904/api/orders/${this.selectedOrder.order_id}/cancel`, {
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
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/orders/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const orders = await response.json();
                    // Ensure each order has a valid estimatedPickupTime
                    this.orders = orders.map(order => {
                        if (order.status === 'preparing') {
                            // Calculate estimated time: 3 minutes per product
                            const timePerProduct = 180; // 180 seconds (3 minutes) per product
                            const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                            const estimatedSeconds = totalQuantity * timePerProduct;
                            
                            const estimatedTime = new Date(order.accepted_at);
                            estimatedTime.setSeconds(estimatedTime.getSeconds() + estimatedSeconds);
                            
                            return {
                                ...order,
                                estimatedPickupTime: estimatedTime.toISOString()
                            };
                        }
                        return order;
                    });
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            }
        },
        async handleLogout() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/users/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
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
    background-color: #f5f5f5;
}

.view-order-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
}

.view-order-content h1 {
    color: #2c3e50;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.order-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
}

.order-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.status-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.status-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.payment-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.cancel-reason-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    background-color: #f8d7da;
    color: #721c24;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Status badge variants */
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
    background-color: #cce5ff;
    color: #004085;
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

.cancelled {
    background-color: #f8d7da;
    color: #842029;
}

.completed {
    background-color: #d1ecf1;
    color: #0c5460;
}

/* Payment badge variants */
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

.order-date {
    color: #666;
    margin: 0;
}

.order-item {
    display: flex;
    gap: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    align-items: center;
}

.item-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.item-details {
    flex-grow: 1;
}

.item-details h4 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
}

.order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
}

.price-breakdown {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    margin: 0.5rem 0;
}

.subtotal {
    color: #666;
    margin: 0;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.discount-amount {
    color: #4CAF50;
    margin: 0;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.total-amount {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.button-group {
    display: flex;
    gap: 1rem;
    align-items: center;
}
.order-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
    width: 100%;
}

.cancel-btn {
    height: 42px;
    padding: 0 1.5rem;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    font-size: 0.95rem;
}

.cancel-btn:hover {
    background-color: #c82333;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
}

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
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
}
.modal-content h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
    font-size: 1.5rem;
}
.cancel-reason {
    margin: 1.5rem 0;
}

.cancel-reason label {
    display: block;
    margin-bottom: 0.5rem;
    color: #2c3e50;
}

.cancel-reason select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.95rem;
    color: #2c3e50;
}

.cancel-reason textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    resize: vertical;
    font-size: 0.95rem;
    min-height: 100px;
    color: #2c3e50;
}

.modal-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
}

.confirm-btn, .close-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    border: none;
    transition: all 0.3s ease;
}

.confirm-btn {
    background-color: #dc3545;
    color: white;
}

.confirm-btn:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    color: #6c757d;
}

.close-btn {
    background-color: #6c757d;
    color: white;
}

.no-orders {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.no-orders i {
    font-size: 4rem;
    color: #cbd5e0;
    margin-bottom: 1rem;
}

.no-orders p {
    color: #2c3e50;
    font-size: 1.25rem;
    margin-bottom: 2rem;
}

.shop-now-btn {
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    padding: 1rem 2rem;
    border-radius: 25px;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    font-size: 1.1rem;
    box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
    transition: all 0.3s ease;
    border: 2px solid transparent;
}
.staff-info {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    margin-left: 1rem;
    border: 1px solid #c8e6c9;
}

.staff-details {
    display: flex;
    flex-direction: column;
}

.staff-details small {
    font-size: 0.8rem;
    color: #4caf50;
    margin-top: 0.2rem;
}

.staff-info i {
    font-size: 1rem;
    color: #2e7d32;
}
.shop-now-btn:hover {
    background-color: white;
    color: #4CAF50;
    border: 2px solid #4CAF50;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
}
.shop-now-btn i {
    font-size: 1.5em; /* Changed from 1.5em to 0.9em to make it smaller */
    position: relative;
    top: 1px; /* Small adjustment to align with text */
}
.order-secondary-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.toggle-btn {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #495057;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    font-weight: 500;
    height: 42px;
}

.estimated-time {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e3f2fd;
    color: #1976d2;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    margin-left: 1rem;
    border: 1px solid #bbdefb;
}

.estimated-time i {
    font-size: 1rem;
}

.time-details {
    display: flex;
    flex-direction: column;
    font-size: 0.85rem;
}

.time-details strong {
    font-size: 0.9rem;
    color: #1565c0;
}
.toggle-btn:hover {
    background-color: #e9ecef;
    border-color: #4CAF50;
    color: #4CAF50;
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
.estimated-time.delayed {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeeba;
}

.estimated-time.delayed i {
    color: #e65100;
}
@media (max-width: 768px) {
    .order-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .order-secondary-info {
        width: 100%;
        justify-content: space-between;
    }

    .toggle-btn {
        width: 100%;
        justify-content: center;
    }
    .estimated-time {
        margin: 0.5rem 0;
        width: 100%;
        justify-content: center;
    }
    .price-breakdown {
        width: 100%;
        align-items: flex-start;
        margin: 0.5rem 0;
    }
    .order-actions {
        margin-top: 1rem;
        width: 100%;
    }

    .cancel-btn {
        width: 100%;
        justify-content: center;
    }

    .modal-buttons {
        flex-direction: column;
    }

    .modal-buttons button {
        width: 100%;
    }
    .button-group {
        width: 100%;
        flex-direction: column;
        gap: 0.5rem;
    }
    .order-secondary-info {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
    }

}
</style>