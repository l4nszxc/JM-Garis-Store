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
                        <div class="order-summary">
                            <div class="order-primary-info">
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
                                    <!-- Add View Receipt button for paid orders -->
                                    <button 
                                        v-if="order.status === 'paid' || order.status === 'paid using gcash'" 
                                        @click="viewReceipt(order.order_id)"
                                        class="receipt-btn"
                                        title="View Receipt"
                                    >
                                        <i class="fas fa-receipt"></i> View Receipt
                                    </button>
                                    <!-- Add Repeat Order button for paid orders -->
                                    <button 
                                        v-if="order.status === 'paid' || order.status === 'paid using gcash'" 
                                        @click="showRepeatOrderModal(order)"
                                        class="repeat-btn"
                                        title="Repeat Order"
                                    >
                                        <i class="fas fa-redo"></i> Repeat Order
                                    </button>
                                </div>
                                <!-- Updated staff info display -->
                                <span v-if="order.status === 'preparing' && order.staff_name" class="staff-info">
                                    <i class="fas fa-user"></i> 
                                    <span class="staff-details">
                                        Being prepared by: {{ order.staff_name }}
                                        <small>{{ formatDate(order.accepted_at) }}</small>
                                    </span>
                                </span>
                            </div>
                            <div class="order-secondary-info">
                                <p class="order-date">{{ formatDate(order.created_at) }}</p>
                                <p class="total-amount">{{ formatPrice(order.total_amount) }}</p>
                                <button class="toggle-btn" @click="toggleOrderDetails(order.order_id)">
                                    <i :class="['fas', expandedOrders.has(order.order_id) ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                                    {{ expandedOrders.has(order.order_id) ? 'Hide Details' : 'Show Details' }}
                                </button>
                            </div>
                        </div>
                        
                        <div v-show="expandedOrders.has(order.order_id)" class="order-details">
                            <div class="order-items">
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
          await fetch('http://localhost:7904/api/users/logout', {
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
  .staff-info {
    display: inline-flex;
    align-items: flex-start;
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
    font-size: 0.8rem;
    margin-top: 0.2rem;
}
    .order-history-container {
        min-height: 100vh;
        background-color: #f5f5f5;
        padding-bottom: 2rem;
        font-family: Arial, sans-serif; 
    }
  
  .order-history-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
  }
  
  .order-history-content h1 {
    font-family: Arial, sans-serif;
    color: #2c3e50;
    margin-bottom: 2rem;
    font-size: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
  
  .filters-container {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .search-bar {
      flex: 1;
      min-width: 250px;
      position: relative;
  }
  
  .search-bar i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
  }
  
  .search-bar input {
      width: 50%;
      padding: 0.875rem 1rem 0.875rem 2.75rem;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
      transition: all 0.3s ease;
      background-color: #f8f9fa;
  }
  
  .search-bar input:focus {
      border-color: #4CAF50;
      background-color: white;
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }
  
  .status-filter {
      min-width: 200px;
  }
  
  .status-filter select {
      width: 100%;
      padding: 0.875rem 2.5rem 0.875rem 1rem;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      font-size: 1rem;
      background-color: #f8f9fa;
      cursor: pointer;
      outline: none;
      transition: all 0.3s ease;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1.5em;
  }
  
  .status-filter select:focus {
      border-color: #4CAF50;
      background-color: white;
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }
  
  .orders-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
  }
  
  .order-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .order-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .order-summary {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      background-color: #fff;
  }
  
  .order-primary-info {
      display: flex;
      align-items: center;
      gap: 1rem;
  }
  
  .order-primary-info h3 {
      font-size: 1.2rem;
      color: #2c3e50;
      margin: 0;
      font-weight: 600;
  }
  
  .order-secondary-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}
  
  .order-date, .order-amount {
      color: #666;
      margin: 0;
      font-size: 1rem;
  }
  
  .order-amount {
      font-weight: 600;
      color: #2c3e50;
  }
  
  .status-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
}

  .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: capitalize;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
  
  .pending {
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
  }

  .pending-payment {
      background-color: #fef7e0;
      color: #92400e;
      border: 1px solid #fde68a;
  }

  .pending-pickup {
      background-color: #e0f2fe;
      color: #0277bd;
      border: 1px solid #b3e5fc;
  }

  .pending-delivery {
      background-color: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
  }
  
  .preparing {
      background-color: #cce5ff;
      color: #004085;
      border: 1px solid #b8daff;
  }
  
  .ready {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
  }
  
  .paid {
    background-color: #d1e7dd;
    color: #0f5132;
    border: 1px solid #badbcc;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.paid-gcash {
    background-color: #cff4fc;
    color: #055160;
    border: 1px solid #9eeaf9;
}

.paid i {
    font-size: 0.875rem;
}

.completed {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #9eeaf9;
}

  .cancelled {
    background-color: #f8d7da;
    color: #842029;
    border: 1px solid #f5c2c7;
}

/* Payment badge variants */
.payment-cash {
    background-color: #fff2cc;
    color: #664d03;
    border: 1px solid #ffecb5;
}

.payment-gcash {
    background-color: #007bff;
    color: white;
    border: 1px solid #0056b3;
}

.payment-hatid {
    background-color: #28a745;
    color: white;
    border: 1px solid #1e7e34;
}
.cancel-reason {
    color: #842029;
    font-size: 0.9rem;
    margin: 0;
    font-style: italic;
}
  .toggle-btn {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #495057;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      font-weight: 500;
  }
  
  .toggle-btn:hover {
      background-color: #e9ecef;
      border-color: #4CAF50;
      color: #4CAF50;
  }
  
  .order-details {
      background-color: #f8f9fa;
      transition: all 0.3s ease;
  }
  
  .order-items {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
  }
  
  .order-item {
      display: flex;
      gap: 1.5rem;
      padding: 1.25rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease;
  }
  
  .order-item:hover {
      transform: translateX(4px);
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
      display: flex;
      flex-direction: column;
      justify-content: center;
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

.staff-info i {
    font-size: 0.8rem;
}
  .item-details h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
      font-weight: 600;
  }
  
  .item-price {
      color: #666;
      margin: 0.25rem 0;
      font-size: 0.95rem;
  }
  
  .item-subtotal {
      color: #2c3e50;
      font-weight: 600;
      margin: 0.25rem 0;
  }
  
  .no-orders {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  .no-orders i {
      font-size: 4rem;
      color: #cbd5e0;
      margin-bottom: 1.5rem;
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
      padding: 0.875rem 1.75rem;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
  }
  
  .shop-now-btn:hover {
      background-color: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
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
.status-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.receipt-btn {
    background-color: #17a2b8;
    color: white;
    border: none;
    padding: 0.5rem 0.875rem;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    font-weight: 500;
}

.receipt-btn:hover {
    background-color: #138496;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(23, 162, 184, 0.3);
}

.receipt-btn i {
    font-size: 0.8rem;
}
.repeat-btn {
    background-color: #3d83df;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.3s ease;
    margin-left: 0.5rem;
}

.repeat-btn:hover {
    background-color: #0e30a0;
    transform: translateY(-1px);
}

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

  @media (max-width: 768px) {
      .order-history-content {
          padding: 1rem;
      }
  
      .filters-container {
          flex-direction: column;
          padding: 1rem;
      }
  
      .search-bar,
      .status-filter {
          width: 100%;
      }
  
      .order-summary {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
      }
  
  
      .toggle-btn {
          width: 100%;
          justify-content: center;
      }
  
      .item-image {
          width: 80px;
          height: 80px;
      }
  
      .order-item {
          padding: 1rem;
      }
  
      .item-details h4 {
          font-size: 1rem;
      }
      .price-breakdown {
        width: 100%;
        align-items: flex-start;
        margin: 0.5rem 0;
     }
  }
  </style>