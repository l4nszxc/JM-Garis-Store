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
                            :title="status.value === 'pending' ? 'Shows all orders awaiting acceptance: Pending, Pending Pickup, Pending Delivery, and Paid via GCash' : ''"
                        >
                            {{ status.label }}
                        </button>
                    </div>
                    
                    <div class="filters-right">
                        <div class="sort-filter">
                            <select 
                                v-model="sortOption" 
                                @change="handleSortChange"
                                class="sort-select"
                            >
                                <option value="">Sort by</option>
                                <option value="amount_asc">Amount: Low to High</option>
                                <option value="amount_desc">Amount: High to Low</option>
                                <option value="date_desc">Date: Newest First</option>
                                <option value="date_asc">Date: Oldest First</option>
                            </select>
                            <i class="fas fa-sort"></i>
                        </div>
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
                                <th>Payment Method</th>
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
                                    <span :class="['status-badge', order.status.replace(/ /g, '-')]">
                                        <i v-if="order.status === 'pending'" class="fas fa-clock"></i>
                                        <i v-else-if="order.status === 'pending_pickup'" class="fas fa-hand-holding"></i>
                                        <i v-else-if="order.status === 'pending_delivery'" class="fas fa-truck"></i>
                                        <i v-else-if="order.status === 'paid using gcash'" class="fas fa-mobile-alt"></i>
                                        <i v-else-if="order.status === 'preparing'" class="fas fa-utensils"></i>
                                        <i v-else-if="order.status === 'ready for pickup'" class="fas fa-check-circle"></i>
                                        <i v-else-if="order.status === 'paid'" class="fas fa-check-double"></i>
                                        <i v-else-if="order.status === 'cancelled'" class="fas fa-times-circle"></i>
                                        <i v-else class="fas fa-info-circle"></i>
                                        {{ getStatusDisplay(order.status) }}
                                    </span>
                                    <div v-if="order.staff_name" class="staff-info">
                                        <small>Accepted by: {{ order.staff_name }}</small>
                                    </div>
                                    <div v-if="order.status === 'preparing' && order.estimatedPickupTime" class="time-remaining" :class="{'past-due': isPastDue(order.estimatedPickupTime)}">
                                        <i v-if="isPastDue(order.estimatedPickupTime)" class="fas fa-exclamation-triangle"></i>
                                        {{ formatRemainingTime(order.estimatedPickupTime) }}
                                    </div>
                                </td>
                                <td>
                                    <span class="payment-method">
                                        <i v-if="order.payment_method === 'cash'" class="fas fa-money-bill-wave"></i>
                                        <i v-else-if="order.payment_method === 'gcash'" class="fas fa-mobile-alt"></i>
                                        <i v-else-if="order.payment_method === 'hatid'" class="fas fa-truck"></i>
                                        <i v-else class="fas fa-credit-card"></i>
                                        {{ getPaymentMethodLabel(order.payment_method) }}
                                    </span>
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
                                <td colspan="7" class="no-data">
                                    No orders found for the selected filters
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="pagination-container" v-if="totalPages > 1">
                    <div class="pagination-info">
                        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, totalFilteredOrders.length) }} of {{ totalFilteredOrders.length }} orders
                    </div>
                    <div class="pagination">
                        <button 
                            @click="prevPage" 
                            :disabled="currentPage === 1"
                            class="pagination-btn"
                        >
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                        
                        <button 
                            v-for="page in totalPages" 
                            :key="page"
                            @click="goToPage(page)"
                            :class="['pagination-btn', 'page-btn', { 'active': currentPage === page }]"
                            v-show="page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2"
                        >
                            {{ page }}
                        </button>
                        
                        <span v-if="totalPages > 5 && currentPage < totalPages - 2" class="pagination-ellipsis">...</span>
                        
                        <button 
                            @click="nextPage" 
                            :disabled="currentPage === totalPages"
                            class="pagination-btn"
                        >
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
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
                            <span :class="['status-badge', selectedOrder.status.replace(/ /g, '-')]">
                                <i v-if="selectedOrder.status === 'pending'" class="fas fa-clock"></i>
                                <i v-else-if="selectedOrder.status === 'pending_pickup'" class="fas fa-hand-holding"></i>
                                <i v-else-if="selectedOrder.status === 'pending_delivery'" class="fas fa-truck"></i>
                                <i v-else-if="selectedOrder.status === 'paid using gcash'" class="fas fa-mobile-alt"></i>
                                <i v-else-if="selectedOrder.status === 'preparing'" class="fas fa-utensils"></i>
                                <i v-else-if="selectedOrder.status === 'ready for pickup'" class="fas fa-check-circle"></i>
                                <i v-else-if="selectedOrder.status === 'paid'" class="fas fa-check-double"></i>
                                <i v-else-if="selectedOrder.status === 'cancelled'" class="fas fa-times-circle"></i>
                                <i v-else class="fas fa-info-circle"></i>
                                {{ getStatusDisplay(selectedOrder.status) }}
                            </span>
                        </p>
                        <p><strong>Order Date:</strong> {{ formatDate(selectedOrder.created_at) }}</p>
                        <p><strong>Payment Method:</strong> 
                            <span class="payment-method">
                                <i v-if="selectedOrder.payment_method === 'cash'" class="fas fa-money-bill-wave"></i>
                                <i v-else-if="selectedOrder.payment_method === 'gcash'" class="fas fa-mobile-alt"></i>
                                <i v-else-if="selectedOrder.payment_method === 'hatid'" class="fas fa-truck"></i>
                                <i v-else class="fas fa-credit-card"></i>
                                {{ getPaymentMethodLabel(selectedOrder.payment_method) }}
                            </span>
                        </p>
                        <p v-if="selectedOrder.accepted_at"><strong>Accepted On:</strong> {{ formatDate(selectedOrder.accepted_at) }}</p>
                        <p v-if="selectedOrder.status === 'preparing' && selectedOrder.estimatedPickupTime">
                            <strong>Estimated Ready By:</strong> {{ formatDate(selectedOrder.estimatedPickupTime) }}
                        </p>
                        
                        <!-- Add Packaging Preference Display -->
                        <div class="packaging-info">
                            <p><strong>Packaging Preference:</strong></p>
                            <div class="packaging-display" :class="selectedOrder.packaging_preference">
                                <i :class="selectedOrder.packaging_preference === 'plastic' ? 'fas fa-shopping-bag' : 'fas fa-leaf'"></i>
                                <span v-if="selectedOrder.packaging_preference === 'plastic'">
                                    Plastic Packaging Requested
                                </span>
                                <span v-else>
                                    Eco-Friendly (Paper Bag/Box)
                                </span>
                            </div>
                        </div>
                        
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
                        v-if="['pending', 'pending_pickup', 'pending_delivery', 'paid using gcash'].includes(selectedOrder.status)"
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
            sortOption: '',
            defaultSortOption: '',
            statusFilter: 'pending',
            defaultStatusFilter: 'pending',
            statusFilters: [
                { label: 'All Status', value: '' },
                { label: 'Pending (All)', value: 'pending' },
                { label: 'Pending Pickup', value: 'pending_pickup' },
                { label: 'Pending Delivery', value: 'pending_delivery' },
                { label: 'Paid via GCash', value: 'paid using gcash' },
                { label: 'Preparing', value: 'preparing' },
                { label: 'Ready for Pickup', value: 'ready for pickup' },
                { label: 'Paid', value: 'paid' },
                { label: 'Cancelled', value: 'cancelled' }
            ],
            selectedOrder: null,
            isLoading: false,
            // Pagination
            currentPage: 1,
            itemsPerPage: 20
        }
    },
    computed: {
        hasActiveFilters() {
            return this.searchQuery !== '' || 
                  this.dateFilter !== '' || 
                  this.statusFilter !== this.defaultStatusFilter ||
                  this.sortOption !== this.defaultSortOption;
        },
        filteredOrders() {
            // First filter the orders based on existing criteria
            let filtered = this.orders.filter(order => {
                const searchMatch = !this.searchQuery || 
                    order.order_id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    order.customer_name.toLowerCase().includes(this.searchQuery.toLowerCase());
                
                // Status filter logic - if "pending" is selected, show all pending statuses that need acceptance
                let statusMatch = true;
                if (this.statusFilter) {
                    if (this.statusFilter === 'pending') {
                        // Show all statuses that need to be accepted
                        const pendingStatuses = ['pending', 'pending_pickup', 'pending_delivery', 'paid using gcash'];
                        statusMatch = pendingStatuses.includes(order.status);
                    } else {
                        statusMatch = order.status === this.statusFilter;
                    }
                } else {
                    statusMatch = true;
                }
                
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
            
            // Then sort the filtered results
            if (this.sortOption) {
                filtered = [...filtered].sort((a, b) => {
                    if (this.sortOption === 'amount_asc') {
                        return a.total_amount - b.total_amount;
                    } 
                    else if (this.sortOption === 'amount_desc') {
                        return b.total_amount - a.total_amount;
                    }
                    else if (this.sortOption === 'date_desc') {
                        return new Date(b.created_at) - new Date(a.created_at);
                    }
                    else if (this.sortOption === 'date_asc') {
                        return new Date(a.created_at) - new Date(b.created_at);
                    }
                    return 0;
                });
            }
            
            return filtered;
        },
        totalFilteredOrders() {
            // First filter the orders based on existing criteria
            return this.orders.filter(order => {
                const searchMatch = !this.searchQuery || 
                    order.order_id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    order.customer_name.toLowerCase().includes(this.searchQuery.toLowerCase());
                
                // Status filter logic - if "pending" is selected, show all pending statuses that need acceptance
                let statusMatch = true;
                if (this.statusFilter) {
                    if (this.statusFilter === 'pending') {
                        // Show all statuses that need to be accepted
                        const pendingStatuses = ['pending', 'pending_pickup', 'pending_delivery', 'paid using gcash'];
                        statusMatch = pendingStatuses.includes(order.status);
                    } else {
                        statusMatch = order.status === this.statusFilter;
                    }
                }
                
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
        },
        totalPages() {
            return Math.ceil(this.totalFilteredOrders.length / this.itemsPerPage);
        },
        filteredOrders() {
            // Get all filtered orders
            let filtered = this.totalFilteredOrders;
            
            // Then sort the filtered results
            if (this.sortOption) {
                filtered = [...filtered].sort((a, b) => {
                    if (this.sortOption === 'amount_asc') {
                        return a.total_amount - b.total_amount;
                    } 
                    else if (this.sortOption === 'amount_desc') {
                        return b.total_amount - a.total_amount;
                    }
                    else if (this.sortOption === 'date_desc') {
                        return new Date(b.created_at) - new Date(a.created_at);
                    }
                    else if (this.sortOption === 'date_asc') {
                        return new Date(a.created_at) - new Date(b.created_at);
                    }
                    return 0;
                });
            }
            
            // Apply pagination
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            return filtered.slice(startIndex, endIndex);
        }
    },
    watch: {
        searchQuery() {
            this.currentPage = 1;
        },
        statusFilter() {
            this.currentPage = 1;
        },
        dateFilter() {
            this.currentPage = 1;
        },
        sortOption() {
            this.currentPage = 1;
        }
    },
    methods: {
        resetFilters() {
            this.searchQuery = '';
            this.dateFilter = '';
            this.statusFilter = this.defaultStatusFilter;
            this.sortOption = this.defaultSortOption;
            this.currentPage = 1; // Reset to first page
        },
        // Pagination methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
            }
        },
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
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
                // 3 minutes per product (180 seconds)
                const timePerProduct = 180; // seconds per product
                
                if (!order.items || !Array.isArray(order.items)) {
                    return null;
                }

                const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const estimatedSeconds = totalQuantity * timePerProduct;
                
                // Use accepted_at as base time
                const estimatedTime = new Date(order.accepted_at);
                estimatedTime.setSeconds(estimatedTime.getSeconds() + estimatedSeconds);
                
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
        getPaymentMethodLabel(method) {
            switch (method) {
                case 'cash':
                    return 'Cash on Pickup';
                case 'gcash':
                    return 'GCash';
                case 'hatid':
                    return 'Deliver with HATID';
                default:
                    return method || 'Not specified';
            }
        },
        getStatusDisplay(status) {
            const displayMap = {
                'pending': 'Pending',
                'pending_pickup': 'Pending Pickup (Downpayment)',
                'pending_delivery': 'Pending Delivery',
                'paid using gcash': 'Paid via GCash',
                'preparing': 'Preparing',
                'ready for pickup': 'Ready for Pickup',
                'paid': 'Paid',
                'cancelled': 'Cancelled',
                'completed': 'Completed'
            };
            return displayMap[status.toLowerCase()] || status;
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

.filter-btn.pending_pickup {
    background-color: #e0f2fe;
    color: #0277bd;
}

.filter-btn.pending_pickup.active {
    background-color: #0277bd;
    color: white;
}

.filter-btn.pending_delivery {
    background-color: #e8f5e9;
    color: #2e7d32;
}

.filter-btn.pending_delivery.active {
    background-color: #2e7d32;
    color: white;
}

.filter-btn.paid-using-gcash {
    background-color: #cff4fc;
    color: #055160;
}

.filter-btn.paid-using-gcash.active {
    background-color: #007bff;
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
    background-color: #e3f5e9;
    color: #0f7840;
}

.filter-btn.ready-for-pickup.active {
    background-color: #38a169;
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
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
}

.pending {
    background-color: #fef3c7;
    color: #92400e;
}

.pending_pickup {
    background-color: #e0f2fe;
    color: #0277bd;
}

.pending_delivery {
    background-color: #e8f5e9;
    color: #2e7d32;
}

.paid-using-gcash {
    background-color: #cff4fc;
    color: #055160;
}

.preparing {
    background-color: #cce5ff;
    color: #004085;
}

.ready-for-pickup {
    background-color: #e3f5e9;
    color: #0f7840;
}

.paid {
    background-color: #d1e7dd;
    color: #0f5132;
}

.cancelled {
    background-color: #fee2e2;
    color: #b91c1c;
}

.payment-method {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    color: #495057;
}

.payment-method i {
    font-size: 1rem;
    color: #6c757d;
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
.sort-filter {
    position: relative;
    display: flex;
    align-items: center;
}

.sort-select {
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background-color: white;
    appearance: none;
    font-size: 0.9rem;
    color: #334155;
    cursor: pointer;
    width: 180px;
    transition: all 0.2s;
}

.sort-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sort-filter i {
    position: absolute;
    right: 1rem;
    pointer-events: none;
    color: #64748b;
}
.packaging-info {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #f8fffe;
    border-radius: 8px;
    border-left: 4px solid #4CAF50;
}

.packaging-info p {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    color: #2c3e50;
}

.packaging-display {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.packaging-display.eco {
    color: #2a3f2a;
    background-color: #f0f8f0;
}

.packaging-display.plastic {
    color: #B8860B;
    background-color: #fffbf0;
    border-left-color: #FFA500;
}

.packaging-display.plastic + .packaging-info {
    border-left-color: #FFA500;
    background-color: #fffbf0;
}

.packaging-display i {
    font-size: 1.1rem;
    flex-shrink: 0;
}

.packaging-display.eco i {
    color: #4CAF50;
}

.packaging-display.plastic i {
    color: #FFA500;
}

/* Pagination Styles */
.pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
}

.pagination-info {
    color: #64748b;
    font-size: 0.9rem;
}

.pagination {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.pagination-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    background-color: white;
    color: #374151;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    min-width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
}

.pagination-btn:hover:not(:disabled) {
    background-color: #f3f4f6;
    border-color: #d1d5db;
}

.pagination-btn:disabled {
    background-color: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
    border-color: #f3f4f6;
}

.pagination-btn.page-btn {
    min-width: 40px;
}

.pagination-btn.active {
    background-color: #3b82f6;
    border-color: #3b82f6;
    color: white;
}

.pagination-btn.active:hover {
    background-color: #2563eb;
    border-color: #2563eb;
}

.pagination-ellipsis {
    padding: 0.5rem;
    color: #9ca3af;
}

@media (max-width: 768px) {
    .sort-filter {
        width: 100%;
    }
    
    .sort-select {
        width: 100%;
    }
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
    
    .pagination-container {
        flex-direction: column;
        gap: 1rem;
        align-items: center;
    }
    
    .pagination {
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .pagination-btn {
        padding: 0.4rem 0.6rem;
        font-size: 0.8rem;
        min-width: 35px;
    }
}
</style>