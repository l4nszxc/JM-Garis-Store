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
                            :class="['filter-btn', selectedStatus === status.value ? 'active' : '', (status.value || 'all-status').replace(/ /g, '-')]"
                        >
                            {{ status.label }}
                            <span class="status-count" v-if="statusCounts[status.value] !== undefined">
                                {{ statusCounts[status.value] }}
                            </span>
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
                                placeholder="Search by order ID, customer name, or payment method..."
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
                                <th>Payment Verification</th>
                                <th>Total Amount</th>
                                <th>Order Date</th>
                                <th>Staff Assigned</th>
                                <th>Estimated Ready By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in filteredOrders" :key="order.order_id" 
                                :class="{ 'past-due-row': isPastDue(order.estimatedPickupTime) && order.status !== 'ready for pickup' && order.status !== 'paid' }">
                                <td>{{ order.order_id }}</td>
                                <td>
                                    <template v-if="order.is_physical_order">
                                        <span class="physical-order-badge">
                                            <i class="fas fa-store"></i> {{ order.customer_name }}
                                        </span>
                                    </template>
                                    <template v-else>
                                        {{ order.customer_name }}
                                    </template>
                                </td>
                                <td>
                                    <select 
                                        v-model="order.status"
                                        @change="updateOrderStatus(order.order_id, order.status)"
                                        :class="['status-select', order.status.toLowerCase().replace(/ /g, '-')]"
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
                                    <div v-if="order.payment_method === 'gcash' || order.payment_type === 'downpayment'" class="payment-verification">
                                        <div v-if="order.payment_status === 'verified'" class="verification-item verified">
                                            <i class="fas fa-check-circle text-success"></i>
                                            <span class="verification-text">Verified</span>
                                        </div>
                                        <div v-else-if="order.payment_status === 'rejected'" class="verification-item rejected">
                                            <i class="fas fa-times-circle text-danger"></i>
                                            <span class="verification-text">Rejected</span>
                                        </div>
                                        <div v-else-if="order.payment_status === 'pending_verification'" class="verification-item pending">
                                            <i class="fas fa-clock text-warning"></i>
                                            <span class="verification-text">Pending verification</span>
                                        </div>
                                        <div v-else-if="order.verification_method === 'receipt' && order.receipt_filename" class="verification-item pending">
                                            <i class="fas fa-receipt text-warning"></i>
                                            <span class="verification-text">
                                                <a href="#" @click.prevent="viewReceipt(order)" class="receipt-link">
                                                    View Receipt
                                                </a>
                                            </span>
                                        </div>
                                        <div v-else-if="order.verification_method === 'reference' && order.gcash_reference" class="verification-item pending">
                                            <i class="fas fa-hashtag text-blue"></i>
                                            <span class="verification-text">Ref: {{ order.gcash_reference.substring(0, 12) }}{{ order.gcash_reference.length > 12 ? '...' : '' }}</span>
                                        </div>
                                        <div v-else class="verification-item missing">
                                            <i class="fas fa-exclamation-triangle text-danger"></i>
                                            <span class="verification-text">No verification data</span>
                                        </div>
                                    </div>
                                    <div v-else class="payment-verification">
                                        <span class="verification-text text-muted">N/A</span>
                                    </div>
                                </td>
                                <td>
                                    <span v-if="order.payment_type === 'downpayment'">
                                        {{ formatPrice(getRemainingAmount(order)) }}
                                        <div class="subtotal">
                                            <i class="fas fa-info-circle"></i> Downpayment paid: {{ formatPrice(getDownpaymentAmount(order)) }}
                                        </div>
                                    </span>
                                    <span v-else>
                                        {{ formatPrice(order.total_amount) }}
                                    </span>
                                </td>
                                <td>{{ formatDate(order.created_at) }}</td>
                                <td>
                                    <span v-if="order.staff_name" class="staff-info">
                                        <i class="fas fa-user"></i> {{ order.staff_name }}
                                    </span>
                                    <span v-else>-</span>
                                </td>
                                <td class="estimated-time">
                                    {{ formatDate(order.estimatedPickupTime) }}
                                    <div class="time-remaining" :class="{'past-due': isPastDue(order.estimatedPickupTime) && order.status !== 'ready for pickup' && order.status !== 'paid'}">
                                        <i v-if="isPastDue(order.estimatedPickupTime) && order.status !== 'ready for pickup' && order.status !== 'paid'" class="fas fa-exclamation-triangle"></i>
                                        {{ getTimeRemaining(order.estimatedPickupTime, order.status) }}
                                    </div>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button @click="viewOrderDetails(order)" class="view-btn">
                                            <i class="fas fa-eye"></i> View Details
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="filteredOrders.length === 0">
                                <td colspan="10" class="no-data">
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
                        
                        <!-- First page -->
                        <button 
                            v-if="totalPages > 1"
                            @click="goToPage(1)"
                            :class="['pagination-btn', 'page-btn', { 'active': currentPage === 1 }]"
                        >
                            1
                        </button>
                        
                        <!-- Left ellipsis -->
                        <span v-if="currentPage > 4" class="pagination-ellipsis">...</span>
                        
                        <!-- Pages around current page -->
                        <button 
                            v-for="page in visiblePages" 
                            :key="page"
                            @click="goToPage(page)"
                            :class="['pagination-btn', 'page-btn', { 'active': currentPage === page }]"
                        >
                            {{ page }}
                        </button>
                        
                        <!-- Right ellipsis -->
                        <span v-if="currentPage < totalPages - 3" class="pagination-ellipsis">...</span>
                        
                        <!-- Last page -->
                        <button 
                            v-if="totalPages > 1 && currentPage !== totalPages"
                            @click="goToPage(totalPages)"
                            :class="['pagination-btn', 'page-btn', { 'active': currentPage === totalPages }]"
                        >
                            {{ totalPages }}
                        </button>
                        
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
                        
                        <!-- Payment Verification Details for GCash -->
                        <div v-if="selectedOrder.payment_method === 'gcash'" class="payment-verification-details">
                            <p><strong>Payment Verification Details:</strong></p>
                            <div class="verification-details-content">
                                <div v-if="selectedOrder.payment_status === 'verified'" class="verification-status verified">
                                    <i class="fas fa-check-circle text-success"></i>
                                    <span class="status-text">Payment Verified</span>
                                    <small v-if="selectedOrder.verified_at" class="verification-date">
                                        Verified on {{ formatDate(selectedOrder.verified_at) }}
                                    </small>
                                </div>
                                <div v-else-if="selectedOrder.payment_status === 'rejected'" class="verification-status rejected">
                                    <i class="fas fa-times-circle text-danger"></i>
                                    <span class="status-text">Payment Rejected</span>
                                </div>
                                <div v-else-if="selectedOrder.payment_status === 'pending_verification'" class="verification-status pending">
                                    <i class="fas fa-clock text-warning"></i>
                                    <span class="status-text">Pending Verification</span>
                                </div>
                                <div v-else class="verification-status unknown">
                                    <i class="fas fa-question-circle text-muted"></i>
                                    <span class="status-text">Status Unknown</span>
                                </div>
                                
                                <div class="verification-method-info">
                                    <div v-if="selectedOrder.verification_method === 'receipt'" class="method-info">
                                        <p><strong>Verification Method:</strong> Receipt Upload</p>
                                        
                                        <!-- Receipt Image Display with Toggle -->
                                        <div v-if="selectedOrder.receipt_filename" class="receipt-section">
                                            <button 
                                                @click="toggleReceiptDisplay" 
                                                class="receipt-toggle-btn"
                                            >
                                                <i class="fas fa-receipt"></i>
                                                {{ showReceiptInModal ? 'Hide Receipt' : 'View Receipt' }}
                                                <i :class="['fas', showReceiptInModal ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                                            </button>
                                            <div v-show="showReceiptInModal" class="receipt-image-container">
                                                <div class="receipt-image-wrapper">
                                                    <img 
                                                        v-if="receiptImageUrl" 
                                                        :src="receiptImageUrl" 
                                                        alt="Payment Receipt" 
                                                        class="receipt-image"
                                                        @error="handleReceiptImageError"
                                                        @click="openReceiptImageModal"
                                                        title="Click to view full size"
                                                    />
                                                    <div v-else class="no-receipt">
                                                        <i class="fas fa-image"></i>
                                                        <p>Receipt image not available</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else-if="selectedOrder.verification_method === 'reference'" class="method-info">
                                        <p><strong>Verification Method:</strong> Reference Number</p>
                                        <p v-if="selectedOrder.gcash_reference" class="reference-display">
                                            <strong>GCash Reference:</strong> {{ selectedOrder.gcash_reference }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
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
                                    <i class="fas fa-hand-holding-usd"></i> Downpayment Paid: {{ formatPrice(getDownpaymentAmount(selectedOrder)) }}
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
                        :disabled="!allChecked || selectedOrder.status === 'ready for pickup' || selectedOrder.status === 'paid' || isMarkingReady"
                    >
                        <i class="fas fa-spinner fa-spin" v-if="isMarkingReady"></i>
                        <i class="fas fa-check" v-else></i>
                        {{ isMarkingReady ? 'Marking Ready...' : 'Mark as Ready' }}
                    </button>
                    <button @click="closeOrderDetails" class="close-btn">
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
                    <div v-if="selectedOrder" class="receipt-info">
                        <div class="order-info-header">
                            <strong>Order #{{ selectedOrder.order_id }}</strong>
                            <span class="order-date">{{ formatDate(selectedOrder.created_at) }}</span>
                        </div>
                        <div v-if="selectedOrder.gcash_reference" class="gcash-ref">
                            <i class="fab fa-google-pay"></i>
                            <span>Ref: {{ selectedOrder.gcash_reference }}</span>
                        </div>
                    </div>
                    <div class="receipt-image-wrapper">
                        <img 
                            v-if="receiptImageUrl"
                            :src="receiptImageUrl" 
                            alt="Payment Receipt"
                            class="receipt-modal-image"
                            @error="handleReceiptImageError"
                        />
                        <div v-else class="no-receipt">
                            <i class="fas fa-image"></i>
                            <p>Receipt image not available</p>
                        </div>
                    </div>
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
import { apiMixin } from '../../mixins/apiMixin.js'

export default {
    name: 'AcceptedOrders',
    mixins: [apiMixin],
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
            isMarkingReady: false,
            // Receipt functionality
            showReceiptInModal: false,
            showReceiptModal: false,
            receiptImageUrl: '',
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
                    order.customer_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    order.payment_method.toLowerCase().includes(this.searchQuery.toLowerCase());
                
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
        visiblePages() {
            const pages = [];
            const start = Math.max(2, this.currentPage - 2);
            const end = Math.min(this.totalPages - 1, this.currentPage + 2);
            
            for (let page = start; page <= end; page++) {
                if (page !== 1 && page !== this.totalPages) {
                    pages.push(page);
                }
            }
            
            return pages;
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
        },
        statusCounts() {
            const counts = {};
            
            // Initialize counts for all status filters
            this.statusFilters.forEach(filter => {
                if (filter.value === '') {
                    counts[''] = this.acceptedOrders.length; // All orders count
                } else {
                    counts[filter.value] = 0;
                }
            });
            
            // Count orders by status with special handling for "past-due"
            this.acceptedOrders.forEach(order => {
                // Handle "past-due" filter - orders that are past their estimated time
                if (counts.hasOwnProperty('past-due')) {
                    if (this.isPastDue(order.estimatedPickupTime) && 
                        order.status !== 'ready for pickup' && 
                        order.status !== 'paid') {
                        counts['past-due']++;
                    }
                }
                
                // Handle individual status counts
                if (counts.hasOwnProperty(order.status)) {
                    counts[order.status]++;
                }
            });
            
            return counts;
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
            
            this.isMarkingReady = true;
            try {
                await this.updateOrderStatus(this.selectedOrder.order_id, 'ready for pickup');
                this.selectedOrder = null;
                this.checkedProducts = [];
            } catch (error) {
                console.error('Error marking order as ready:', error);
            } finally {
                this.isMarkingReady = false;
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
        // Receipt functionality methods
        toggleReceiptDisplay() {
            this.showReceiptInModal = !this.showReceiptInModal;
            if (this.showReceiptInModal && this.selectedOrder && this.selectedOrder.receipt_filename) {
                this.loadReceiptImage();
            }
        },
        async loadReceiptImage() {
            if (!this.selectedOrder || !this.selectedOrder.receipt_filename) {
                this.receiptImageUrl = '';
                return;
            }
            
            try {
                // Use the same approach as admin - load receipt from database with proper authentication
                if (this.selectedOrder.payment_intent_id) {
                    console.log(`Loading receipt image for payment ID: ${this.selectedOrder.payment_intent_id}`);
                    const token = localStorage.getItem('token');
                    
                    const response = await this.$fetch(`/api/payment/receipt-db/${this.selectedOrder.payment_intent_id}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        this.receiptImageUrl = URL.createObjectURL(blob);
                        console.log('Receipt image loaded successfully as blob');
                        return;
                    } else {
                        console.error('Failed to load receipt image from database:', response.status, response.statusText);
                    }
                }
                
                // Fallback: try the direct file access approach
                let imageUrl = `${this.API_BASE_URL}/uploads/gcash-receipts/${this.selectedOrder.receipt_filename}`;
                let response = await fetch(imageUrl);
                
                if (response.ok) {
                    this.receiptImageUrl = imageUrl;
                    return;
                }
                
                // If the original filename doesn't work, try to find the actual file
                console.log('Original filename not found, trying to find actual file...');
                
                const originalFilename = this.selectedOrder.receipt_filename;
                
                // Check if filename already has the prefix
                if (originalFilename.startsWith('receipt_')) {
                    // Filename already has prefix, no fallback needed
                    console.error('Failed to load receipt image:', response.status);
                    this.receiptImageUrl = '';
                    return;
                }
                
                // For legacy records, try to find files that end with this original filename
                const token = localStorage.getItem('token');
                const searchResponse = await this.$fetch(`/api/payment/find-receipt-file/${encodeURIComponent(originalFilename)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (searchResponse.ok) {
                    const result = await searchResponse.json();
                    if (result.actualFilename) {
                        imageUrl = `${this.API_BASE_URL}/uploads/gcash-receipts/${result.actualFilename}`;
                        const finalResponse = await fetch(imageUrl);
                        if (finalResponse.ok) {
                            this.receiptImageUrl = imageUrl;
                            return;
                        }
                    }
                }
                
                console.error('Failed to load receipt image after trying all fallbacks:', response.status);
                this.receiptImageUrl = '';
                
            } catch (error) {
                console.error('Error loading receipt image:', error);
                this.receiptImageUrl = '';
            }
        },
        openReceiptImageModal() {
            this.showReceiptModal = true;
        },
        closeReceiptModal() {
            this.showReceiptModal = false;
        },
        handleReceiptImageError() {
            console.error('Failed to load receipt image');
            this.receiptImageUrl = '';
        },
        cleanupReceiptImage() {
            if (this.receiptImageUrl && this.receiptImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(this.receiptImageUrl);
            }
            this.receiptImageUrl = '';
        },
        closeOrderDetails() {
            this.cleanupReceiptImage();
            this.selectedOrder = null;
            this.showReceiptInModal = false;
        },
        async viewReceipt(order) {
            // Set the selected order if not already set
            if (!this.selectedOrder || this.selectedOrder.order_id !== order.order_id) {
                this.selectedOrder = order;
            }
            
            try {
                // Load the receipt image for this order
                if (order.payment_intent_id) {
                    await this.loadReceiptImage();
                }
                
                // Open the receipt modal
                this.openReceiptImageModal();
            } catch (error) {
                console.error('Error viewing receipt:', error);
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
                // Use the actual paid_amount from payment_intents table
                return order.paid_amount || 0;
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
                    
                    // Reset receipt display states
                    this.showReceiptInModal = false;
                    this.receiptImageUrl = '';
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
    background-color: white !important;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    color: #2c3e50 !important;
}

.filter-btn:hover {
    background-color: #f8f9fa !important;
    border-color: #d1d5db;
    transform: translateY(-1px);
}

.filter-btn.active {
    background-color: #3b82f6 !important;
    border-color: #3b82f6;
    color: white !important;
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.filter-btn.active:hover {
    background-color: #2563eb !important;
    border-color: #2563eb;
}

/* Override active state for specific status filters */
.filter-btn.preparing.active {
    background-color: #2196f3 !important;
    border-color: #2196f3 !important;
    box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2) !important;
}

.filter-btn.preparing.active:hover {
    background-color: #1976d2 !important;
    border-color: #1976d2 !important;
}

.filter-btn.ready-for-pickup.active {
    background-color: #4caf50 !important;
    border-color: #4caf50 !important;
    color: white !important;
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2) !important;
}

.filter-btn.ready-for-pickup.active:hover {
    background-color: #45a049 !important;
    border-color: #45a049 !important;
}

.filter-btn.paid.active {
    background-color: #4caf50 !important;
    border-color: #4caf50 !important;
    color: white !important;
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2) !important;
}

.filter-btn.paid.active:hover {
    background-color: #45a049 !important;
    border-color: #45a049 !important;
}

.status-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
    padding: 0 0.4rem;
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.filter-btn.active .status-count {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border-color: rgba(255, 255, 255, 0.3);
    font-weight: 700;
}

/* Override active state for specific status filters */
.filter-btn.preparing.active {
    background-color: #2196f3 !important;
    border-color: #2196f3 !important;
    box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2) !important;
}

.filter-btn.preparing.active:hover {
    background-color: #1976d2 !important;
    border-color: #1976d2 !important;
}

.filter-btn.ready-for-pickup.active {
    background-color: #4caf50 !important;
    border-color: #4caf50 !important;
    color: white !important;
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2) !important;
}

.filter-btn.ready-for-pickup.active:hover {
    background-color: #45a049 !important;
    border-color: #45a049 !important;
}

.filter-btn.paid.active {
    background-color: #4caf50 !important;
    border-color: #4caf50 !important;
    color: white !important;
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2) !important;
}

.filter-btn.paid.active:hover {
    background-color: #45a049 !important;
    border-color: #45a049 !important;
}

/* Status-specific filter button styles */
.filter-btn.preparing {
    background-color: white !important;
    color: #2c3e50 !important;
    border: 1px solid #e2e8f0;
}

.filter-btn.preparing:hover {
    background-color: #e3f2fd !important;
    color: #1565c0 !important;
}

.filter-btn.ready-for-pickup {
    background-color: white !important;
    color: #2c3e50 !important;
    border: 1px solid #e2e8f0;
}

.filter-btn.ready-for-pickup:hover {
    background-color: #d1e7dd !important;
    color: #0f5132 !important;
}

.filter-btn.paid {
    background-color: white !important;
    color: #2c3e50 !important;
    border: 1px solid #e2e8f0;
}

.filter-btn.paid:hover {
    background-color: #d1e7dd !important;
    color: #0f5132 !important;
}

.filter-btn.past-due {
    background-color: white !important;
    color: #2c3e50 !important;
    border: 1px solid #e2e8f0;
}

.filter-btn.past-due:hover {
    background-color: #ffebee !important;
    color: #c62828 !important;
}

.filter-btn.past-due.active {
    background-color: #ff9800 !important;
    color: white !important;
}

.filter-btn.all-status {
    background-color: white !important;
    color: #2c3e50 !important;
    border: 1px solid #e2e8f0;
}

.filter-btn.all-status:hover {
    background-color: #f8f9fa !important;
    color: #2c3e50 !important;
}

.filter-btn.all-status.active {
    background-color: #6c757d !important;
    color: white !important;
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

.status-select.preparing {
    background-color: #cfe2ff;
    color: #084298;
}

.status-select.ready-for-pickup {
    background-color: #d1e7dd;
    color: #0f5132;
    font-weight: 500;
}

.status-select.paid {
    background-color: #d1e7dd;
    color: #0f5132;
    font-weight: 500;
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

/* Status-specific badge colors */
.status-badge.pending {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeeba;
}

.status-badge.pending-pickup,
.status-badge.pending_pickup {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeeba;
}

.status-badge.pending-delivery,
.status-badge.pending_delivery {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeeba;
}

.status-badge.paid-using-gcash {
    background-color: #cfe2ff;
    color: #084298;
    border: 1px solid #b6d4fe;
}

.status-badge.preparing {
    background-color: #cfe2ff;
    color: #084298;
    border: 1px solid #b6d4fe;
}

.status-badge.ready-for-pickup {
    background-color: #d1e7dd;
    color: #0f5132;
    border: 1px solid #badbcc;
}

.status-badge.paid {
    background-color: #d1e7dd;
    color: #0f5132;
    border: 1px solid #badbcc;
}

.status-badge.cancelled {
    background-color: #f8d7da;
    color: #842029;
    border: 1px solid #f5c2c7;
}

.status-badge.completed {
    background-color: #e7f1ff;
    color: #004085;
    border: 1px solid #b8daff;
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

/* Payment Verification Details Styles */
.payment-verification-details {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
}

.verification-details-content {
    margin-top: 0.5rem;
}

.verification-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    border-radius: 6px;
    font-weight: 500;
}

.verification-status.verified {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.verification-status.rejected {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.verification-status.pending {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.verification-status.unknown {
    background-color: #e2e3e5;
    color: #6c757d;
    border: 1px solid #ced4da;
}

.verification-date {
    display: block;
    font-size: 0.8rem;
    font-weight: normal;
    margin-top: 0.25rem;
    opacity: 0.8;
}

.verification-method-info {
    margin-top: 0.75rem;
}

.method-info p {
    margin: 0.5rem 0;
}

.reference-display {
    background-color: white;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #dee2e6;
    font-family: monospace;
}

/* Receipt section styles */
.receipt-section {
    margin-top: 0.75rem;
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
    border-color: rgba(25, 118, 210, 0.3);
}

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

.no-receipt {
    text-align: center;
    color: #6c757d;
    padding: 1rem;
}

.no-receipt i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    display: block;
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

.receipt-modal-image {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Payment Verification Styles */
.payment-verification {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
}

.verification-item {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.6rem;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.verification-item.verified {
    background-color: #d4edda;
    border-color: #c3e6cb;
}

.verification-item.rejected {
    background-color: #f8d7da;
    border-color: #f5c6cb;
}

.verification-item.pending {
    background-color: #fff3cd;
    border-color: #ffeaa7;
}

.verification-item.missing {
    background-color: #f8d7da;
    border-color: #f5c6cb;
}

.verification-text {
    font-weight: 500;
    color: #495057;
    font-size: 0.8rem;
}

.text-blue {
    color: #007bff !important;
}

.text-success {
    color: #28a745 !important;
}

.text-warning {
    color: #ffc107 !important;
}

.text-danger {
    color: #dc3545 !important;
}

.text-muted {
    color: #868e96 !important;
    font-style: italic;
}

.physical-order-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #f0fdf4;
    color: #166534;
    padding: 0.3rem 0.6rem;
    border-radius: 20px;
    font-size: 0.875rem;
    width: fit-content;
    border: 1px solid #dcfce7;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
}

.receipt-link {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid transparent;
}

.receipt-link:hover {
    color: #0056b3;
    text-decoration: none;
    border-bottom: 1px solid #0056b3;
}

.verification-item .receipt-link {
    color: #28a745;
    font-weight: 600;
}

.verification-item .receipt-link:hover {
    color: #1e7e34;
    border-bottom-color: #1e7e34;
}

.subtotal {
    color: #666;
    margin: 0.25rem 0;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.to-verify {
    background-color: #fff3cd;
    color: #856404;
}
</style>

