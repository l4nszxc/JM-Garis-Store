<template>
    <div class="staff-container">
        <StaffNavbar :username="username" @logout="showLogoutModal = true" />
        <div class="staff-content">
            <h1><i class="fas fa-tasks"></i>Accepted Orders</h1>

            <div class="orders-section">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Total Amount</th>
                                <th>Accepted On</th>
                                <th>Estimated Ready By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in acceptedOrders" :key="order.order_id">
                                <td>{{ order.order_id }}</td>
                                <td>{{ order.customer_name }}</td>
                                <td>
                                    <select 
                                        v-model="order.status"
                                        @change="updateOrderStatus(order.order_id, order.status)"
                                        :class="['status-select', order.status]"
                                    >
                                        <option value="pending" disabled>Pending</option>
                                        <option value="preparing">Preparing</option>
                                        <option value="ready for pickup">Ready for Pickup</option>
                                        <option value="paid" disabled>Paid</option>
                                    </select>
                                </td>
                                <td>{{ formatPrice(order.total_amount) }}</td>
                                <td>{{ formatDate(order.accepted_at) }}</td>
                                <td class="estimated-time">
                                    {{ formatDate(order.estimatedPickupTime) }}
                                    <div class="time-remaining" :class="{'past-due': isPastDue(order.estimatedPickupTime) && order.status !== 'ready for pickup' && order.status !== 'paid'}">
                                        {{ getTimeRemaining(order.estimatedPickupTime, order.status) }}
                                    </div>
                                </td>
                                <td>
                                    <button @click="viewOrderDetails(order)" class="view-btn">
                                        <i class="fas fa-eye"></i> View Details
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Order Details Modal -->
        <div v-if="selectedOrder" class="modal-overlay">
            <div class="modal-content order-details">
                <h2>Order Details</h2>
                <div class="modal-scroll-content">
                    <div class="order-info">
                        <p><strong>Order ID:</strong> {{ selectedOrder.order_id }}</p>
                        <p><strong>Customer:</strong> {{ selectedOrder.customer_name }}</p>
                        <p><strong>Status:</strong> 
                            <span :class="['status-badge', selectedOrder.status]">
                                {{ selectedOrder.status }}
                            </span>
                        </p>
                        <p><strong>Accepted On:</strong> {{ formatDate(selectedOrder.accepted_at) }}</p>
                        <p><strong>Estimated Ready By:</strong> {{ formatDate(selectedOrder.estimatedPickupTime) }}</p>
                        
                        <div class="price-breakdown">
                            <p class="subtotal">
                                <i class="fas fa-receipt"></i> Subtotal: {{ formatPrice(selectedOrder.subtotal) }}
                            </p>
                            <p v-if="selectedOrder.discount_amount > 0" class="discount-amount">
                                <i class="fas fa-tag"></i> Discount: -{{ formatPrice(selectedOrder.discount_amount) }}
                            </p>
                            <p class="total-amount">
                                <i class="fas fa-dollar-sign"></i> Total: {{ formatPrice(selectedOrder.total_amount) }}
                            </p>
                        </div>
                    </div>
                    
                    <div class="products-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <input 
                                            type="checkbox" 
                                            :checked="allChecked"
                                            @change="toggleAllProducts"
                                        >
                                    </th>
                                    <th>Product</th>
                                    <th>Image</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in selectedOrder.items" :key="item.product_id">
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            v-model="checkedProducts"
                                            :value="item.product_id"
                                        >
                                    </td>
                                    <td>{{ item.name }}</td>
                                    <td>
                                        <img 
                                            :src="item.image || '/img/placeholder.jpg'" 
                                            :alt="item.name"
                                            class="product-image"
                                            @error="handleImageError"
                                        >
                                    </td>
                                    <td>{{ formatPrice(item.price) }}</td>
                                    <td>{{ item.quantity }}</td>
                                    <td>{{ formatPrice(item.price * item.quantity) }}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="5" class="total-label">Total Amount:</td>
                                    <td class="total-amount">{{ formatPrice(selectedOrder.total_amount) }}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="modal-actions">
                    <button 
                        @click="markAsReady" 
                        class="ready-btn"
                        :disabled="!allChecked || selectedOrder.status === 'ready for pickup' || selectedOrder.status === 'paid'"
                    >
                        <i class="fas fa-check"></i> Mark as Ready
                    </button>
                    <button @click="selectedOrder = null" class="close-btn">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showLogoutModal" class="modal-overlay">
            <div class="modal-content logout-modal">
                <h2>Confirm Logout</h2>
                <p>Are you sure you want to logout?</p>
                <div class="modal-buttons">
                    <button @click="handleLogout" class="confirm-btn">Yes, Logout</button>
                    <button @click="showLogoutModal = false" class="cancel-btn">Cancel</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import StaffNavbar from '../../components/StaffNavbar.vue'

export default {
    name: 'AcceptedOrders',
    components: {
        StaffNavbar
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            acceptedOrders: [],
            selectedOrder: null,
            checkedProducts: []
        }
    },
    computed: {
        allChecked: {
            get() {
                return this.selectedOrder && 
                    this.checkedProducts.length === this.selectedOrder.items.length;
            },
            set(value) {
                this.checkedProducts = value ? 
                    this.selectedOrder.items.map(item => item.product_id) : [];
            }
        },
        isAllChecked() {
            return this.allChecked;
        }
    },
    methods: {
        toggleAllProducts(e) {
        this.allChecked = e.target.checked;
        },
        
        async markAsReady() {
            if (!this.isAllChecked) return;
            
            try {
                await this.updateOrderStatus(this.selectedOrder.order_id, 'ready for pickup');
                this.selectedOrder = null;
                this.checkedProducts = [];
            } catch (error) {
                console.error('Error marking order as ready:', error);
            }
        },
        async viewOrderDetails(order) {
            try {
                // ...existing viewOrderDetails code...
                this.checkedProducts = []; // Reset checkboxes
            } catch (error) {
                console.error('Error fetching order details:', error);
            }
        },
        isOptionDisabled(currentStatus, optionValue) {
            // Prevent ready for pickup selection when status is preparing
            if (currentStatus === 'preparing' && optionValue === 'ready for pickup') {
                return true;
            }

            // Allow moving back from "ready for pickup" to "preparing"
            if (currentStatus === 'ready for pickup' && optionValue === 'preparing') {
                return false;
            }

            // Status progression mapping
            const statusOrder = ['pending', 'preparing', 'ready for pickup', 'paid'];
            const currentIndex = statusOrder.indexOf(currentStatus);
            const optionIndex = statusOrder.indexOf(optionValue);

            // Disable if option is before current status or more than one step ahead
            return optionIndex < currentIndex || optionIndex > currentIndex + 1;
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
                console.error('Logout failed:', error);
            } finally {
                this.showLogoutModal = false;
            }
        },
        formatPrice(price) {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price).replace('PHP', '₱');
        },
        formatDate(date) {
            return new Date(date).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
        isPastDue(estimatedTime) {
            return new Date(estimatedTime) < new Date()
        },
        getTimeRemaining(estimatedTime, status) {
            if (status === 'ready for pickup' || status === 'paid') {
                return 'Complete';
            }

            const now = new Date();
            const estimated = new Date(estimatedTime);
            const diff = estimated - now;

            if (diff < 0) {
                return 'Past due';
            }

            const minutes = Math.floor(diff / 60000);
            if (minutes < 60) {
                return `${minutes} minutes remaining`;
            }

            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m remaining`;
        },
        handleImageError(e) {
            e.target.src = '/img/placeholder.jpg'
        },
        calculateEstimatedTime(order) {
            try {
                const baseTime = 15; // Base preparation time in minutes
                const timePerItem = 5; // Additional time per item in minutes
                
                const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const estimatedMinutes = baseTime + (timePerItem * totalQuantity);
                
                // Use accepted_at as base time
                const estimatedTime = new Date(order.accepted_at);
                estimatedTime.setMinutes(estimatedTime.getMinutes() + estimatedMinutes);
                
                return estimatedTime.toISOString();
            } catch (error) {
                console.error('Error calculating estimated time:', error);
                return null;
            }
        },
        async fetchAcceptedOrders() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/staff/orders/accepted', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const orders = await response.json();
                    // Calculate estimated time for each order
                    this.acceptedOrders = orders.map(order => ({
                        ...order,
                        estimatedPickupTime: this.calculateEstimatedTime(order)
                    }));
                }
            } catch (error) {
                console.error('Error fetching accepted orders:', error);
            }
        },
        async viewOrderDetails(order) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:7904/api/staff/orders/${order.order_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const orderData = await response.json();
                    this.selectedOrder = {
                        ...orderData,
                        estimatedPickupTime: this.calculateEstimatedTime(orderData)
                    };
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
            }
        },
        async updateOrderStatus(orderId, newStatus) {
            try {
                const token = localStorage.getItem('token')
                const response = await fetch(`http://localhost:7904/api/staff/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                })

                if (!response.ok) {
                    throw new Error('Failed to update order status')
                }

                await this.fetchAcceptedOrders()
            } catch (error) {
                console.error('Error updating order status:', error)
            }
        }
    },
    mounted() {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.username = decoded.username;
        }
        this.fetchAcceptedOrders();
    },
}
</script>

<style scoped>
.staff-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px;
}

.staff-content {
    padding: 2rem;
}

.staff-content h1 {
    color: #2c3e50;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.orders-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 1.5rem;
}

.table-container {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
}

th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #2c3e50;
}

.status-select {
    padding: 0.5rem;
    border-radius: 20px;
    border: none;
    font-size: 0.9rem;
    cursor: pointer;
    width: 150px;
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

.view-btn {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.view-btn:hover {
    background-color: #2980b9;
    transform: translateY(-1px);
}

.estimated-time {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.time-remaining {
    font-size: 0.85rem;
    color: #2e7d32;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.time-remaining.past-due {
    color: #d32f2f;
}

/* Modal Styles */
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
    border-radius: 12px;
    padding: 2rem;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
}

.order-info {
    margin-bottom: 1rem; /* Reduce from 2rem */
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
}

.order-details h2 {
    margin: 0 0 1rem 0; /* Reduce from 1.5rem */
}

/* Add a container for the scrollable content */
.modal-scroll-content {
    overflow-y: auto;
    flex: 1;
    padding-right: 0.5rem; /* Add some padding for the scrollbar */
}
.order-info p {
    margin: 0.5rem 0;
}

.status-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
}

.product-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
}
tfoot {
    border-top: 2px solid #eee;
}

tfoot tr td {
    padding: 1rem;
    font-weight: 600;
}
.total-label {
    text-align: right;
    color: #2c3e50;
}
.price-breakdown {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
}

.subtotal {
    color: #666;
    margin: 0.25rem 0;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.discount-amount {
    color: #4CAF50;
    margin: 0.25rem 0;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.total-amount {
    color: #2c3e50;
    font-size: 1.1rem;
}

.products-table {
    margin: 1.5rem 0;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    max-height: 380px;
    overflow-y: auto;
    flex: 1; /* Add this */
}

.modal-actions {
    margin-top: 1rem; /* Reduce from 2rem */
    padding-top: 1rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    background: white; /* Add this */
    position: sticky; /* Add this */
    bottom: 0; /* Add this */
}

.close-btn {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}
.time-remaining:not(.past-due) {
    color: #2e7d32;
}

.time-remaining:has(+ .complete) {
    color: #1565c0;
    font-weight: 600;
}
.close-btn:hover {
    background-color: #5a6268;
}
.logout-modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    max-width: 400px;
    width: 90%;
}

.logout-modal h2 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

.logout-modal p {
    margin-bottom: 1.5rem;
    color: #666;
}

.modal-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

.confirm-btn, .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
}

.confirm-btn {
    background-color: #dc3545;
    color: white;
}

.confirm-btn:hover {
    background-color: #c82333;
}

.cancel-btn {
    background-color: #6c757d;
    color: white;
}

.cancel-btn:hover {
    background-color: #5a6268;
}
.ready-btn {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    margin-right: 1rem;
    transition: all 0.3s ease;
}

.ready-btn:hover {
    background-color: #45a049;
}

.ready-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}
.modal-content.order-details {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: hidden; /* Change from auto to hidden */
    display: flex;
    flex-direction: column;
}
input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}
@media (max-width: 768px) {
    tfoot tr td {
        padding: 0.75rem;
    }
    .staff-container {
        padding-left: 60px;
    }

    .staff-content {
        padding: 1rem;
    }

    .modal-content {
        width: 95%;
        padding: 1rem;
    }

    .status-select {
        width: 120px;
    }
}
</style>