<template>
    <div class="staff-container">
        <StaffNavbar :username="username" @logout="showLogoutModal = true" />
        <div class="staff-content">
            <h1><i class="fas fa-tasks"></i> Accepted Orders</h1>

            <div class="orders-section">
                <div class="search-filter">
                    <div class="status-filters">
                        <button 
                            v-for="status in statusFilters" 
                            :key="status.value"
                            @click="selectedStatus = status.value"
                            :class="['filter-btn', selectedStatus === status.value ? 'active' : '', status.value.replace(/ /g, '-')]"
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
                                <option value="date_desc">Accepted: Newest First</option>
                                <option value="date_asc">Accepted: Oldest First</option>
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
                                placeholder="Search by order ID or customer..."
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
                                <th>Accepted On</th>
                                <th>Estimated Ready By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in filteredOrders" :key="order.order_id" 
                                :class="{ 'past-due-row': isPastDue(order.estimatedPickupTime) && order.status !== 'ready for pickup' && order.status !== 'paid' }">
                                <td>{{ order.order_id }}</td>
                                <td>{{ order.customer_name }}</td>
                                <td>
                                    <select 
                                        v-model="order.status"
                                        @change="updateOrderStatus(order.order_id, order.status)"
                                        :class="['status-select', order.status.replace(/ /g, '-')]"
                                    >
                                        <option value="pending" disabled>Pending</option>
                                        <option value="preparing">Preparing</option>
                                        <option value="ready for pickup">Ready for Pickup</option>
                                        <option value="paid" disabled>Paid</option>
                                    </select>
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
                                <td>
                                    <span v-if="order.payment_method === 'cash' && order.payment_type === 'downpayment'">
                                        {{ formatPrice(getRemainingAmount(order)) }}
                                        <small style="display: block; color: #6b7280; font-size: 0.8rem;">
                                            Remaining ({{ formatPrice(getDownpaymentAmount(order)) }} paid)
                                        </small>
                                    </span>
                                    <span v-else>
                                        {{ formatPrice(order.total_amount) }}
                                    </span>
                                </td>
                                <td>{{ formatDate(order.accepted_at) }}</td>
                                <td class="estimated-time">
                                    {{ formatDate(order.estimatedPickupTime) }}
                                    <div class="time-remaining" :class="{'past-due': isPastDue(order.estimatedPickupTime) && order.status !== 'ready for pickup' && order.status !== 'paid'}">
                                        <i v-if="isPastDue(order.estimatedPickupTime) && order.status !== 'ready for pickup' && order.status !== 'paid'" class="fas fa-exclamation-triangle"></i>
                                        {{ getTimeRemaining(order.estimatedPickupTime, order.status) }}
                                    </div>
                                </td>
                                <td>
                                    <button @click="viewOrderDetails(order)" class="view-btn">
                                        <i class="fas fa-eye"></i> View Details
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="filteredOrders.length === 0">
                                <td colspan="8" class="no-data">
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
                        <p><strong>Accepted On:</strong> {{ formatDate(selectedOrder.accepted_at) }}</p>
                        <p><strong>Estimated Ready By:</strong> {{ formatDate(selectedOrder.estimatedPickupTime) }}</p>
                        <p><strong>Payment Method:</strong> 
                            <span class="payment-method">
                                <i v-if="selectedOrder.payment_method === 'cash'" class="fas fa-money-bill-wave"></i>
                                <i v-else-if="selectedOrder.payment_method === 'gcash'" class="fas fa-mobile-alt"></i>
                                <i v-else-if="selectedOrder.payment_method === 'hatid'" class="fas fa-truck"></i>
                                <i v-else class="fas fa-credit-card"></i>
                                {{ getPaymentMethodLabel(selectedOrder.payment_method) }}
                            </span>
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
                                <i class="fas fa-dollar-sign"></i> Original Total: {{ formatPrice(getOriginalTotal(selectedOrder)) }}
                            </p>
                            
                            <!-- Downpayment breakdown for cash on pickup -->
                            <div v-if="selectedOrder.payment_method === 'cash' && selectedOrder.payment_type === 'downpayment'" class="downpayment-breakdown">
                                <p class="downpayment-info">
                                    <i class="fas fa-hand-holding-usd"></i> Downpayment (25%): {{ formatPrice(getDownpaymentAmount(selectedOrder)) }}
                                </p>
                                <p class="remaining-amount">
                                    <i class="fas fa-wallet"></i> Remaining to Pay: {{ formatPrice(getRemainingAmount(selectedOrder)) }}
                                </p>
                            </div>
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
                                    <td colspan="5" class="total-label">
                                        <span v-if="selectedOrder.payment_method === 'cash' && selectedOrder.payment_type === 'downpayment'">
                                            Amount Due:
                                        </span>
                                        <span v-else>
                                            Total Amount:
                                        </span>
                                    </td>
                                    <td class="total-amount">
                                        <span v-if="selectedOrder.payment_method === 'cash' && selectedOrder.payment_type === 'downpayment'">
                                            {{ formatPrice(getRemainingAmount(selectedOrder)) }}
                                        </span>
                                        <span v-else>
                                            {{ formatPrice(selectedOrder.total_amount) }}
                                        </span>
                                    </td>
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
            checkedProducts: [],
            searchQuery: '',
            dateFilter: '',
            sortOption: '',
            defaultSortOption: '',
            selectedStatus: 'preparing',
            defaultStatusFilter: 'preparing',
            statusFilters: [
                { label: 'All Status', value: '' },
                { label: 'Preparing', value: 'preparing' },
                { label: 'Ready for Pickup', value: 'ready for pickup' },
                { label: 'Complete', value: 'paid' },
                { label: 'Past Due', value: 'past-due' }
            ],
            // Pagination
            currentPage: 1,
            itemsPerPage: 20
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
        },
        hasActiveFilters() {
            return this.searchQuery !== '' || 
                  this.dateFilter !== '' || 
                  this.selectedStatus !== this.defaultStatusFilter ||
                  this.sortOption !== this.defaultSortOption;
        },
        totalFilteredOrders() {
            // First apply all the filters
            return this.acceptedOrders.filter(order => {
                // Search filter
                const searchMatch = !this.searchQuery || 
                    order.order_id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    order.customer_name.toLowerCase().includes(this.searchQuery.toLowerCase());
                
                // Date filter
                let dateMatch = true;
                if (this.dateFilter) {
                    const orderDate = new Date(order.accepted_at);
                    const filterDate = new Date(this.dateFilter);
                    
                    dateMatch = orderDate.getFullYear() === filterDate.getFullYear() && 
                              orderDate.getMonth() === filterDate.getMonth() && 
                              orderDate.getDate() === filterDate.getDate();
                }
                
                // Status filter
                let statusMatch = true;
                if (this.selectedStatus) {
                    if (this.selectedStatus === 'past-due') {
                        // Past due logic: check if it's past due and not ready or paid
                        statusMatch = this.isPastDue(order.estimatedPickupTime) && 
                                    order.status !== 'ready for pickup' && 
                                    order.status !== 'paid';
                    } else {
                        // Regular status matching
                        statusMatch = order.status === this.selectedStatus;
                    }
                }
                
                return searchMatch && dateMatch && statusMatch;
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
                        return new Date(b.accepted_at) - new Date(a.accepted_at);
                    }
                    else if (this.sortOption === 'date_asc') {
                        return new Date(a.accepted_at) - new Date(b.accepted_at);
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
        selectedStatus() {
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
            this.selectedStatus = this.defaultStatusFilter;
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
        handleDateFilterChange() {
            // Additional handling if needed
        },
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
                const response = await this.$fetch('/api/users/logout', {
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
        getRemainingAmount(order) {
            // Use the remaining_amount from payment_intents if available (downpayment order)
            if (order.payment_type === 'downpayment' && order.remaining_amount !== null) {
                return order.remaining_amount;
            }
            // For non-downpayment orders or if no payment intent data, return full amount
            return order.total_amount;
        },
        getOriginalTotal(order) {
            // Use original_total from payment_intents if available, otherwise use total_amount
            return order.original_total || order.total_amount;
        },
        getDownpaymentAmount(order) {
            if (order.payment_type === 'downpayment') {
                const originalTotal = this.getOriginalTotal(order);
                return originalTotal * 0.25;
            }
            return 0;
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
            e.target.src = '/img/placeholder.jpg'
        },
        calculateEstimatedTime(order) {
            try {
                // 3 minutes per product (180 seconds)
                const timePerProduct = 180; // seconds per product
                
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
        async fetchAcceptedOrders() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/staff/orders/accepted', {
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
                const response = await this.$fetch(`/api/staff/orders/${order.order_id}`, {
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
                    this.checkedProducts = []; // Reset checkboxes
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
            }
        },
        async updateOrderStatus(orderId, newStatus) {
            try {
                const token = localStorage.getItem('token')
                const response = await this.$fetch(`/api/staff/orders/${orderId}/status`, {
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

/* Search and filter styles */
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
    width: 80%;
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

.filter-btn.past-due {
    background-color: #fee2e2;
    color: #b91c1c;
}

.filter-btn.past-due.active {
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

.status-select {
    padding: 0.5rem;
    border-radius: 20px;
    border: none;
    font-size: 0.9rem;
    cursor: pointer;
    width: 150px;
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
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
}

.order-details h2 {
    margin: 0 0 1rem 0;
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
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
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

.downpayment-breakdown {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
    background-color: #f0f9ff;
    padding: 1rem;
    border-radius: 6px;
}

.downpayment-info {
    color: #0369a1;
    margin: 0.25rem 0;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
}

.remaining-amount {
    color: #dc2626;
    margin: 0.25rem 0;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}

.products-table {
    margin: 1.5rem 0;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    max-height: 380px;
    overflow-y: auto;
    flex: 1;
}

.modal-actions {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    background: white;
    position: sticky;
    bottom: 0;
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
    overflow-y: hidden;
    display: flex;
    flex-direction: column;
}

input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.past-due-row {
    background-color: rgba(253, 237, 237, 0.4);
    position: relative;
}

.time-remaining.past-due {
    color: #d32f2f;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
@keyframes pulse {
    0% {
        opacity: 0.6;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0.6;
    }
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

