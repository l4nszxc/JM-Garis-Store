<template>
    <div class="staff-container">
        <StaffNavbar 
            :username="username"
            @logout="showLogoutModal = true"
        />
        
        <div class="staff-content">
            <h1><i class="fas fa-clipboard-list"></i> All Orders</h1>

            <div class="orders-section">
                <div class="search-filter">
                    <div class="status-filters">
                        <button 
                            v-for="status in statusFilters" 
                            :key="status.value"
                            @click="statusFilter = status.value"
                            :class="['filter-btn', statusFilter === status.value ? 'active' : '', status.value]"
                        >
                            {{ status.label }}
                        </button>
                    </div>
                    
                    <div class="filters-right">
                        <div class="date-filter">
                            <i class="fas fa-calendar"></i>
                            <input 
                                type="date" 
                                v-model="dateFilter"
                                @change="handleDateFilterChange"
                                class="date-input"
                            >
                        </div>
                        
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input 
                                type="text" 
                                v-model="searchQuery" 
                                placeholder="Search by order ID or customer name..."
                            >
                        </div>
                        
                        <button 
                            @click="resetFilters" 
                            class="reset-filters-btn"
                            v-if="hasActiveFilters"
                        >
                            <i class="fas fa-redo-alt"></i> Reset Filters
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Total Amount</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in filteredOrders" :key="order.order_id" :class="{ 'past-due-row': isPastDue(order.estimatedPickupTime) && order.status === 'preparing' }">
                                <td>{{ order.order_id }}</td>
                                <td>{{ order.customer_name }}</td>
                                <td>
                                    <span :class="['status-badge', order.status]">
                                        {{ order.status }}
                                    </span>
                                    <div v-if="order.staff_name" class="staff-info">
                                        <small>Accepted by: {{ order.staff_name }}</small>
                                    </div>
                                    <div v-if="order.status === 'preparing' && order.estimatedPickupTime" class="time-remaining" :class="{'past-due': isPastDue(order.estimatedPickupTime)}">
                                        <i v-if="isPastDue(order.estimatedPickupTime)" class="fas fa-exclamation-triangle"></i>
                                        {{ formatRemainingTime(order.estimatedPickupTime) }}
                                    </div>
                                </td>
                                <td>{{ formatPrice(order.total_amount) }}</td>
                                <td>{{ formatDate(order.created_at) }}</td>
                                <td>
                                    <button 
                                        @click="viewOrderDetails(order)"
                                        class="view-btn"
                                    >
                                        <i class="fas fa-eye"></i> View Details
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="filteredOrders.length === 0">
                                <td colspan="6" class="no-data">
                                    No orders found for the selected filters
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
                        <p><strong>Order Date:</strong> {{ formatDate(selectedOrder.created_at) }}</p>
                        <p v-if="selectedOrder.accepted_at"><strong>Accepted On:</strong> {{ formatDate(selectedOrder.accepted_at) }}</p>
                        <p v-if="selectedOrder.status === 'preparing' && selectedOrder.estimatedPickupTime">
                            <strong>Estimated Ready By:</strong> {{ formatDate(selectedOrder.estimatedPickupTime) }}
                        </p>
                        
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
                                    <th>Product</th>
                                    <th>Image</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in selectedOrder.items" :key="item.product_id">
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
                                    <td colspan="4" class="total-label">Total Amount:</td>
                                    <td class="total-amount">{{ formatPrice(selectedOrder.total_amount) }}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="modal-actions">
                    <button 
                        v-if="selectedOrder.status === 'pending'"
                        @click="acceptOrder(selectedOrder.order_id)" 
                        class="accept-btn"
                    >
                        <i class="fas fa-check"></i> Accept Order
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
    name: 'StaffHome',
    components: {
        StaffNavbar
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            orders: [],
            searchQuery: '',
            dateFilter: '',
            statusFilter: 'pending',
            defaultStatusFilter: 'pending',
            statusFilters: [
                { label: 'Pending', value: 'pending' },
                { label: 'Preparing', value: 'preparing' },
                { label: 'Ready for Pickup', value: 'ready for pickup' },
                { label: 'Paid', value: 'paid' },
                { label: 'Cancelled', value: 'cancelled' }
            ],
            selectedOrder: null,
            isLoading: false
        }
    },
    computed: {
        hasActiveFilters() {
            return this.searchQuery !== '' || 
                  this.dateFilter !== '' || 
                  this.statusFilter !== this.defaultStatusFilter;
        },
        filteredOrders() {
            return this.orders.filter(order => {
                const searchMatch = !this.searchQuery || 
                    order.order_id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    order.customer_name.toLowerCase().includes(this.searchQuery.toLowerCase());
                
                const statusMatch = order.status === this.statusFilter;
                
                // Date filter
                let dateMatch = true;
                if (this.dateFilter) {
                    const orderDate = new Date(order.created_at);
                    const filterDate = new Date(this.dateFilter);
                    
                    dateMatch = orderDate.getFullYear() === filterDate.getFullYear() && 
                               orderDate.getMonth() === filterDate.getMonth() && 
                               orderDate.getDate() === filterDate.getDate();
                }
                
                return searchMatch && statusMatch && dateMatch;
            });
        }
    },
    methods: {
        resetFilters() {
            this.searchQuery = '';
            this.dateFilter = '';
            this.statusFilter = this.defaultStatusFilter;
        },
        clearDateFilter() {
            this.dateFilter = '';
        },
        isPastDue(estimatedTime) {
            if (!estimatedTime) return false;
            return new Date(estimatedTime) < new Date();
        },
        calculateEstimatedTime(order) {
            try {
                const baseTime = 15; // Base preparation time in minutes
                const timePerItem = 5; // Additional time per item in minutes
                
                if (!order.items || !Array.isArray(order.items)) {
                    return null;
                }

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
        formatRemainingTime(estimatedTime) {
            if (!estimatedTime) return 'Not available';

            const now = new Date();
            const estimated = new Date(estimatedTime);
            const diff = estimated - now;

            if (diff < 0) {
                // Calculate how long it's been past due
                const pastMinutes = Math.floor(Math.abs(diff) / 60000);
                if (pastMinutes < 60) {
                    return `Past due by ${pastMinutes} minutes`;
                }

                const pastHours = Math.floor(pastMinutes / 60);
                const remainingMinutes = pastMinutes % 60;
                return `Past due by ${pastHours}h ${remainingMinutes}m`;
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
            e.target.src = '/img/placeholder.jpg';
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
            });
        },
        async acceptOrder(orderId) {
            try {
                this.isLoading = true;
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:7904/api/staff/orders/${orderId}/accept`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    // Close the modal
                    this.selectedOrder = null;
                    
                    // Refresh the order list
                    await this.fetchOrders();
                }
            } catch (error) {
                console.error('Error accepting order:', error);
                alert('Failed to accept order');
            } finally {
                this.isLoading = false;
            }
        },
        async fetchOrders() {
            try {
                this.isLoading = true;
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/staff/orders', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const orders = await response.json();
                    
                    // Process orders to add estimatedPickupTime
                    this.orders = orders.map(order => {
                        if (order.status === 'preparing' && order.accepted_at) {
                            return {
                                ...order,
                                estimatedPickupTime: this.calculateEstimatedTime(order)
                            };
                        }
                        return order;
                    });
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                this.isLoading = false;
            }
        },
        async viewOrderDetails(order) {
            try {
                this.isLoading = true;
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
                        subtotal: orderData.subtotal || orderData.total_amount,
                        discount_amount: parseFloat(orderData.discount_amount) || 0,
                        estimatedPickupTime: this.calculateEstimatedTime(orderData)
                    };
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
            } finally {
                this.isLoading = false;
            }
        },
        async handleLogout() {
            try {
                this.isLoading = true;
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
                this.isLoading = false;
                this.showLogoutModal = false;
            }
        }
    },
    mounted() {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.username = decoded.username || 'Staff';
        }
        this.fetchOrders();
    }
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

.search-filter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.filters-right {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.date-filter {
    position: relative;
    display: flex;
    align-items: center;
    width: 160px;
}

.date-filter i {
    position: absolute;
    left: 10px;
    color: #a0aec0;
    z-index: 1;
}

.date-input {
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #2c3e50;
    width: 100%;
    cursor: pointer;
}

.reset-filters-btn {
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.reset-filters-btn:hover {
    background-color: #5a6268;
    transform: translateY(-1px);
}

.reset-filters-btn i {
    font-size: 0.8rem;
}

.search-box {
    position: relative;
    flex: 1;
    min-width: 250px;
    max-width: 300px;
}

.search-box input {
    width: 78%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

.search-box i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
}

.status-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: left;
    flex: 2;
}

.filter-btn {
    padding: 0.5rem 1rem;
    background-color: #f8f9fa;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

.filter-btn.active {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-btn.pending {
    background-color: #fef3c7;
    color: #92400e;
}

.filter-btn.pending.active {
    background-color: #f59e0b;
    color: white;
}

.filter-btn.preparing {
    background-color: #cce5ff;
    color: #004085;
}

.filter-btn.preparing.active {
    background-color: #0d6efd;
    color: white;
}

.filter-btn.ready-for-pickup {
    background-color: #d4edda;
    color: #155724;
}

.filter-btn.ready-for-pickup.active {
    background-color: #198754;
    color: white;
}

.filter-btn.paid {
    background-color: #d1e7dd;
    color: #0f5132;
}

.filter-btn.paid.active {
    background-color: #20c997;
    color: white;
}

.filter-btn.cancelled {
    background-color: #fee2e2;
    color: #b91c1c;
}

.filter-btn.cancelled.active {
    background-color: #dc3545;
    color: white;
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

.status-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
}

.pending {
    background-color: #fef3c7;
    color: #92400e;
}

.preparing {
    background-color: #cce5ff;
    color: #004085;
}

.ready-for-pickup {
    background-color: #d4edda;
    color: #155724;
}

.paid {
    background-color: #d1e7dd;
    color: #0f5132;
}

.cancelled {
    background-color: #fee2e2;
    color: #b91c1c;
}

.staff-info {
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 0.25rem;
}

.time-remaining {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #2e7d32;
    font-weight: 500;
}

.time-remaining.past-due {
    color: #d32f2f;
}

.past-due-row {
    background-color: rgba(253, 237, 237, 0.4);
    position: relative;
}

.past-due-row::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 4px;
    background-color: #d32f2f;
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

.no-data {
    text-align: center;
    padding: 2rem;
    color: #718096;
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

.order-details h2 {
    margin: 0 0 1.5rem 0;
}

.modal-scroll-content {
    overflow-y: auto;
    flex: 1;
    padding-right: 0.5rem;
}

.order-info {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
}

.order-info p {
    margin: 0.5rem 0;
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
    font-weight: bold;
}

.product-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
}

.products-table {
    margin: 1.5rem 0;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    max-height: 380px;
    overflow-y: auto;
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

.modal-actions {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.accept-btn {
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
    transition: all 0.3s ease;
}

.accept-btn:hover {
    background-color: #45a049;
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

@media (max-width: 768px) {
    .staff-container {
        padding-left: 60px;
    }

    .staff-content {
        padding: 1rem;
    }

    .search-filter {
        flex-direction: column;
        align-items: stretch;
    }
    
    .filters-right {
        flex-direction: column;
        width: 100%;
    }
    
    .search-box, .date-filter {
        width: 100%;
        max-width: 100%;
    }
    
    .date-input {
        width: 100%;
    }
    
    .status-filters {
        order: 2;
        justify-content: center;
    }
    
    .reset-filters-btn {
        width: 100%;
        justify-content: center;
        margin-top: 0.5rem;
    }

    .modal-content {
        width: 95%;
        padding: 1rem;
    }
}
</style>