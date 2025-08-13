<template>
    <div class="order-history-container">
        <Navbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="order-history-content">
            <h1><i class="fas fa-history"></i> Order History</h1>
            <div class="filters-container">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        v-model="searchQuery" 
                        placeholder="Search by order number..."
                    >
                </div>
                <div class="status-filter">
                    <select v-model="selectedStatus">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="pending_payment">Pending Payment</option>
                        <option value="pending_pickup">Pending Pickup</option>
                        <option value="pending_delivery">Pending Delivery</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready for pickup">Ready for Pickup</option>
                        <option value="paid">Paid</option>
                        <option value="paid using gcash">Paid via GCash</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
            
            <div class="orders-container">
                <div v-if="orders.length > 0">
                    <div v-for="order in filteredOrders" :key="order.order_id" class="order-card">
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
                            
                            <!-- Cancel reason if applicable -->
                            <div v-if="order.cancel_reason" class="cancel-info">
                                <i class="fas fa-info-circle"></i>
                                <span>{{ order.cancel_reason }}</span>
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
                                v-if="order.status === 'paid' || order.status === 'paid using gcash'" 
                                @click="viewReceipt(order.order_id)"
                                class="receipt-btn"
                            >
                                <i class="fas fa-receipt"></i>
                                Receipt
                            </button>
                            <button 
                                v-if="order.status === 'paid' || order.status === 'paid using gcash'" 
                                @click="showRepeatOrderModal(order)"
                                class="repeat-btn"
                            >
                                <i class="fas fa-redo"></i>
                                Repeat
                            </button>
                        </div>

                        <!-- Order Details (Expandable) -->
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
                                    <span>{{ formatPrice(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)) }}</span>
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
                <div v-else class="no-orders">
                    <i class="fas fa-box-open"></i>
                    <p>No orders found</p>
                    <router-link to="/products" class="shop-now-btn">
                        <i class="fas fa-shopping-cart"></i> Start Shopping
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Add Repeat Order Modal -->
        <RepeatOrderModal
            :show="showRepeatModal"
            :orderId="selectedOrderForRepeat?.order_id || ''"
            :orderItems="selectedOrderForRepeat?.items || []"
            @close="closeRepeatModal"
            @success="handleRepeatSuccess"
            @error="handleRepeatError"
        />

        <!-- Notification -->
        <div v-if="notification.show" :class="['notification', notification.type]">
            <div class="notification-content">
                <i :class="notification.icon"></i>
                {{ notification.message }}
            </div>
            <button class="notification-close" @click="hideNotification">
                <i class="fas fa-times"></i>
            </button>
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
import RepeatOrderModal from '../../components/RepeatOrderModal.vue';

export default {
    name: 'OrderHistory',
    components: {
        Navbar,
        LogoutModal,
        RepeatOrderModal
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            orders: [],
            expandedOrders: new Set(),
            searchQuery: '',
            selectedStatus: '',
            showRepeatModal: false,
            selectedOrderForRepeat: null,
            notification: {
                show: false,
                message: '',
                type: 'success',
                icon: 'fas fa-check-circle'
            }
        }
    },
    computed: {
        filteredOrders() {
            return this.orders.filter(order => {
                const matchesSearch = order.order_id.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesStatus = !this.selectedStatus || order.status.toLowerCase() === this.selectedStatus.toLowerCase();
                return matchesSearch && matchesStatus;
            });
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
        viewReceipt(orderId) {
            this.$router.push(`/receipt/${orderId}`);
        },
        showRepeatOrderModal(order) {
            this.selectedOrderForRepeat = order;
            this.showRepeatModal = true;
        },
        closeRepeatModal() {
            this.showRepeatModal = false;
            this.selectedOrderForRepeat = null;
        },
        handleRepeatSuccess(data) {
            this.showNotification(data.message, 'success');
            // Dispatch event to update cart count
            window.dispatchEvent(new CustomEvent('cart-updated'));
            
            // Optionally redirect to cart if user replaced cart
            if (data.replaceCart) {
                setTimeout(() => {
                    this.$router.push('/cart');
                }, 1500);
            }
        },
        handleRepeatError(message) {
            this.showNotification(message, 'error');
        },
        showNotification(message, type = 'success') {
            this.notification = {
                show: true,
                message,
                type,
                icon: type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
            };
            
            setTimeout(() => {
                this.hideNotification();
            }, 5000);
        },
        hideNotification() {
            this.notification.show = false;
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
      formatDate(dateString) {
        if (!dateString) return 'Not available';
        
        try {
            return new Date(dateString).toLocaleString('en-US', {
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
      async getUserData() {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            this.$router.push('/login');
            return;
          }

          // Get username from token
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          this.username = decodedToken.username;
        } catch (error) {
          console.error('Error getting user data:', error);
          this.$router.push('/login');
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
            const data = await response.json();
            this.orders = data;
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      },
      async handleLogout() {
        try {
          const token = localStorage.getItem('token');
          await this.$fetch('/api/users/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error('Error during logout:', error);
        } finally {
          localStorage.removeItem('token');
          this.$router.push('/login');
        }
      }
    },
    async mounted() {
      await this.getUserData();
      await this.fetchOrders();
    }
}
</script>
  
  <style scoped>
.order-history-container {
  font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f8f9fa;
}

.order-history-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
}

.order-history-content h1 {
    color: #2c3e50;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filters-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    background: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid #e9ecef;
}

.search-bar {
    flex: 1;
    position: relative;
}

.search-bar i {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
    font-size: 0.875rem;
}

.search-bar input {
    width: 86.5%;
    padding: 0.75rem 0.75rem 0.75rem 2.25rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.3s ease;
}

.search-bar input:focus {
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.status-filter {
    min-width: 180px;
}

.status-filter select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    font-size: 0.875rem;
    background-color: white;
    cursor: pointer;
    outline: none;
    transition: border-color 0.3s ease;
}

.status-filter select:focus {
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.orders-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.order-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    border: 1px solid #e9ecef;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.order-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
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
    flex-wrap: wrap;
}

.toggle-btn, .receipt-btn, .repeat-btn {
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

.receipt-btn {
    background-color: #17a2b8;
    color: white;
    border-color: #17a2b8;
}

.receipt-btn:hover {
    background-color: #138496;
    border-color: #138496;
}

.repeat-btn {
    background-color: #3d83df;
    color: white;
    border-color: #3d83df;
}

.repeat-btn:hover {
    background-color: #2c6ed4;
    border-color: #2c6ed4;
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

/* Notification */
.notification {
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 1000;
    max-width: 400px;
    animation: slideIn 0.3s ease;
}

.notification.success {
    background-color: #4CAF50;
}

.notification.error {
    background-color: #f44336;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.3s ease;
}

.notification-close:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .order-history-content {
        padding: 0.75rem;
    }

    .order-history-content h1 {
        font-size: 1.25rem;
        margin-bottom: 1rem;
    }

    .filters-container {
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.75rem;
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

    .toggle-btn, .receipt-btn, .repeat-btn {
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

    .notification {
        top: 1rem;
        right: 1rem;
        left: 1rem;
        max-width: none;
    }
}

@media (max-width: 480px) {
    .order-history-content {
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
}
  </style>