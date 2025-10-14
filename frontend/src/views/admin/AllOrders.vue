<template>
    <div class="admin-container">
        <AdminNavbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="admin-content">
            <h1><i class="fas fa-clipboard-list"></i> All Orders</h1>

            <div class="orders-section">
                <div class="search-filter">
                    <div class="status-filters">
                        <button 
                            v-for="status in statusFilters" 
                            :key="status.value"
                            @click="selectedStatus = status.value"
                            :class="['filter-btn', selectedStatus === status.value ? 'active' : '', status.value]"
                        >
                            {{ status.label }}
                            <span class="status-count">{{ getStatusCount(status.value) }}</span>
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
                                <th>Order Date</th>
                                <th>Staff Assigned</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in filteredOrders" :key="order.order_id" :class="{ 'past-due-row': order.isPastDue }">
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
                                    <div class="status-column">
                                        <span :class="['status-badge', order.status.toLowerCase().replace(/ /g, '-')]">
                                            <i v-if="order.status === 'pending'" class="fas fa-clock"></i>
                                            <i v-else-if="order.status === 'pending_pickup'" class="fas fa-hand-holding"></i>
                                            <i v-else-if="order.status === 'pending_delivery'" class="fas fa-truck"></i>
                                            <i v-else-if="order.status === 'paid using gcash'" class="fas fa-mobile-alt"></i>
                                            <i v-else-if="order.status === 'preparing'" class="fas fa-utensils"></i>
                                            <i v-else-if="order.status === 'ready for pickup'" class="fas fa-check-circle"></i>
                                            <i v-else-if="order.status === 'paid'" class="fas fa-check-double"></i>
                                            <i v-else-if="order.status === 'to verify'" class="fas fa-search"></i>
                                            <i v-else-if="order.status === 'cancelled'" class="fas fa-times-circle"></i>
                                            <i v-else class="fas fa-info-circle"></i>
                                            {{ getStatusDisplay(order.status) }}
                                        </span>
                                        <!-- GCash Verification Button for pending GCash payments (excluding "to verify" status) -->
                                        <div v-if="hasPendingGCashPayment(order) && order.status !== 'to verify'" class="gcash-verification">
                                            <button @click="showGCashVerification(order)" class="verify-gcash-btn">
                                                <i class="fab fa-google-pay"></i>
                                                Verify GCash
                                            </button>
                                        </div>
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
                                <td>
                                    <div class="action-buttons">
                                        <button @click="viewOrderDetails(order)" class="view-btn">
                                            <i class="fas fa-eye"></i> View Details
                                        </button>
                                        <button 
                                            v-if="order.is_physical_order && order.status === 'paid' && !order.rewards_applied"
                                            @click="openCustomerRewards(order)" 
                                            class="rewards-btn"
                                            title="Apply Customer Rewards"
                                        >
                                            <i class="fas fa-gift"></i> Customer Rewards
                                        </button>
                                        <button 
                                            v-if="order.is_physical_order && order.status === 'paid' && order.rewards_applied"
                                            class="rewards-redeemed-btn"
                                            title="Customer rewards have been applied"
                                            disabled
                                        >
                                            <i class="fas fa-check-circle"></i> Rewards Redeemed
                                        </button>
                                    </div>
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
                            <span :class="['status-badge', selectedOrder.status.toLowerCase().replace(/ /g, '-')]">
                                <i v-if="selectedOrder.status === 'pending'" class="fas fa-clock"></i>
                                <i v-else-if="selectedOrder.status === 'pending_pickup'" class="fas fa-hand-holding"></i>
                                <i v-else-if="selectedOrder.status === 'pending_delivery'" class="fas fa-truck"></i>
                                <i v-else-if="selectedOrder.status === 'paid using gcash'" class="fas fa-mobile-alt"></i>
                                <i v-else-if="selectedOrder.status === 'preparing'" class="fas fa-utensils"></i>
                                <i v-else-if="selectedOrder.status === 'ready for pickup'" class="fas fa-check-circle"></i>
                                <i v-else-if="selectedOrder.status === 'paid'" class="fas fa-check-double"></i>
                                <i v-else-if="selectedOrder.status === 'to verify'" class="fas fa-search"></i>
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
                        
                        <!-- GCash Payment Details for "to verify" status -->
                        <div v-if="selectedOrder.status === 'to verify' && selectedOrder.payment_method === 'gcash'" class="gcash-payment-details">
                            <div class="gcash-info-section">
                                <h4><i class="fab fa-google-pay"></i> GCash Payment Information</h4>
                                <div class="gcash-details-grid">
                                    <div class="gcash-detail-item">
                                        <label>Reference Number:</label>
                                        <span class="gcash-reference">{{ selectedOrder.gcash_reference || 'Loading...' }}</span>
                                    </div>
                                    <div class="gcash-detail-item">
                                        <label>Payment Amount:</label>
                                        <span class="gcash-amount">{{ formatPrice(selectedOrder.gcash_amount || selectedOrder.total_amount) }}</span>
                                    </div>
                                    <div class="gcash-detail-item">
                                        <label>Payment Type:</label>
                                        <span>{{ selectedOrder.payment_type === 'downpayment' ? 'Downpayment (25%)' : 'Full Payment' }}</span>
                                    </div>
                                    <div class="gcash-detail-item">
                                        <label>Submitted Date:</label>
                                        <span>{{ formatDate(selectedOrder.gcash_submitted_at || selectedOrder.created_at) }}</span>
                                    </div>
                                </div>
                                
                                <!-- Receipt Picture Display -->
                                <div v-if="selectedOrder.gcash_receipt_url" class="receipt-image-section">
                                    <label>Receipt Picture:</label>
                                    <div class="receipt-image-container">
                                        <img 
                                            :src="selectedOrder.gcash_receipt_url" 
                                            alt="GCash Receipt"
                                            class="receipt-image"
                                            @error="handleReceiptImageError"
                                            @click="showReceiptModal = true"
                                        >
                                        <div class="receipt-overlay">
                                            <i class="fas fa-search-plus"></i>
                                            <span>Click to view full size</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div v-else class="no-receipt-notice">
                                    <i class="fas fa-info-circle"></i>
                                    <span>No receipt image uploaded</span>
                                </div>
                            </div>
                        </div>
                        
                        <p v-if="selectedOrder.staff_name">
                            <strong>Staff Assigned:</strong> 
                            <span class="staff-badge">
                                <i class="fas fa-user"></i> {{ selectedOrder.staff_name }}
                            </span>
                        </p>
                        <p v-if="selectedOrder.status === 'cancelled'">
                            <strong>Cancellation Reason:</strong> {{ selectedOrder.cancel_reason }}
                        </p>

                        <div class="price-breakdown">
                            <p class="subtotal">
                                <i class="fas fa-receipt"></i> Subtotal: {{ formatPrice(selectedOrder.subtotal) }}
                            </p>
                            <p v-if="selectedOrder.discount_amount > 0" class="discount-amount">
                                <i class="fas fa-tag"></i> Discount: -{{ formatPrice(selectedOrder.discount_amount) }}
                            </p>
                            <p class="total-amount">
                                <i class="fas fa-dollar-sign"></i> 
                                <span v-if="selectedOrder.payment_type === 'downpayment'">Original Total:</span>
                                <span v-else>Total:</span>
                                {{ formatPrice(getOriginalTotal(selectedOrder)) }}
                            </p>
                            
                            <!-- Downpayment Information -->
                            <div v-if="selectedOrder.payment_type === 'downpayment'" class="downpayment-breakdown">
                                <p class="downpayment-info">
                                    <i class="fas fa-credit-card"></i> Downpayment (25%): {{ formatPrice(getDownpaymentAmount(selectedOrder)) }}
                                </p>
                                <p class="remaining-amount">
                                    <i class="fas fa-money-bill-wave"></i> Remaining Amount: {{ formatPrice(getRemainingAmount(selectedOrder)) }}
                                </p>
                            </div>
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
                                    <td>
                                        {{ item.original_name || item.name }}
                                        <div v-if="item.choice_name" class="choice-info">
                                            <i class="fas fa-tag"></i> Option: {{ item.choice_name }}
                                        </div>
                                    </td>
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
                                    <td colspan="4" class="total-label">
                                        <span v-if="selectedOrder.payment_type === 'downpayment'">Amount Due:</span>
                                        <span v-else>Total Amount:</span>
                                    </td>
                                    <td class="total-amount">
                                        <span v-if="selectedOrder.payment_type === 'downpayment'">
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
                    <!-- GCash Verification Button for "to verify" status -->
                    <button 
                        v-if="selectedOrder.status === 'to verify' && selectedOrder.payment_method === 'gcash'"
                        @click="showOrderGCashVerification" 
                        class="verify-gcash-modal-btn"
                        :disabled="processingOrderVerification"
                    >
                        <i class="fab fa-google-pay" v-if="!processingOrderVerification"></i>
                        <i class="fas fa-spinner fa-spin" v-else></i>
                        {{ processingOrderVerification ? 'Verifying...' : 'Verify GCash Payment' }}
                    </button>
                    
                    <button 
                        v-if="selectedOrder.status === 'ready for pickup'"
                        @click="showPaymentConfirmation = true" 
                        class="pay-btn"
                    >
                        <i class="fas fa-money-bill-wave"></i> Pay Order
                    </button>
                    <button @click="selectedOrder = null" class="close-btn">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>

        <!-- Receipt Image Modal -->
        <div v-if="showReceiptModal" class="modal-overlay" @click="showReceiptModal = false">
            <div class="modal-content receipt-modal" @click.stop>
                <div class="receipt-modal-header">
                    <h3>GCash Receipt</h3>
                    <button @click="showReceiptModal = false" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="receipt-modal-body">
                    <img 
                        :src="selectedOrder.gcash_receipt_url" 
                        alt="GCash Receipt Full Size"
                        class="full-receipt-image"
                        @error="handleReceiptImageError"
                    >
                </div>
            </div>
        </div>

        <!-- Order GCash Verification Confirmation Modal -->
        <div v-if="showOrderVerificationModal" class="modal-overlay">
            <div class="modal-content order-verification-modal">
                <div class="verification-header">
                    <h3>
                        <i class="fab fa-google-pay"></i>
                        Verify GCash Payment
                    </h3>
                </div>

                <div class="verification-content">
                    <div class="verification-info">
                        <p>Are you sure you want to verify this GCash payment?</p>
                        <div class="verification-details">
                            <p><strong>Order ID:</strong> {{ selectedOrder.order_id }}</p>
                            <p><strong>Reference Number:</strong> {{ selectedOrder.gcash_reference }}</p>
                            <p><strong>Amount:</strong> {{ formatPrice(selectedOrder.gcash_amount || selectedOrder.total_amount) }}</p>
                        </div>
                        <p class="verification-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            This action will change the order status from "To Verify" to "Pending" and cannot be undone.
                        </p>
                    </div>

                    <div class="verification-actions">
                        <button 
                            @click="verifyOrderGCashPayment(true)" 
                            class="verify-btn approve"
                            :disabled="processingOrderVerification"
                        >
                            <i class="fas fa-check-circle"></i>
                            <span v-if="processingOrderVerification">Approving...</span>
                            <span v-else>Approve Payment</span>
                        </button>
                        <button 
                            @click="verifyOrderGCashPayment(false)" 
                            class="verify-btn reject"
                            :disabled="processingOrderVerification"
                        >
                            <i class="fas fa-times-circle"></i>
                            <span v-if="processingOrderVerification">Rejecting...</span>
                            <span v-else>Reject Payment</span>
                        </button>
                        <button 
                            @click="showOrderVerificationModal = false" 
                            class="verify-btn cancel"
                            :disabled="processingOrderVerification"
                        >
                            <i class="fas fa-ban"></i>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Logout Modal -->
        <LogoutModal 
            :show="showLogoutModal"
            @confirm="handleLogout"
            @cancel="showLogoutModal = false"
        />
    </div>
</template>

<script>
import AdminNavbar from '../../components/AdminNavbar.vue'
import LogoutModal from '../../components/LogoutModal.vue'

export default {
    name: 'AllOrders',
    components: {
        AdminNavbar,
        LogoutModal
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            orders: [],
            selectedOrder: null,
            searchQuery: '',
            dateFilter: '',
            selectedStatus: 'ready for pickup',
            defaultStatusFilter: 'ready for pickup',
            statusFilters: [
                { label: 'All Status', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Verify GCash', value: 'verify_gcash' },
                { label: 'Pending Pickup', value: 'pending_pickup' },
                { label: 'Pending Delivery', value: 'pending_delivery' },
                { label: 'Preparing', value: 'preparing' },
                { label: 'Ready for Pickup', value: 'ready for pickup' },
                { label: 'Paid', value: 'paid' },
                { label: 'Cancelled', value: 'cancelled' }
            ],
            showPaymentConfirmation: false,
            cashAmount: '',
            changeAmount: 0,
            sortOption: '',
            defaultSortOption: '',
            // Walk-in rewards modal data
            showWalkInRewardsModal: false,
            showWalkInRewardsSuccess: false,
            selectedRewardMethod: '',
            customerUserId: '',
            qrCodeData: '',
            foundUser: null,
            qrFoundUser: null,
            userLookupError: '',
            qrLookupError: '',
            lookingUpUser: false,
            processingRewards: false,
            processingPayment: false,
            successRewardData: null,
            
            // Payment success modal
            showPaymentSuccessModal: false,
            processedOrder: null,
            paymentDetails: null,
            
            // QR Scanner options
            qrScanMethod: 'manual', // 'camera', 'upload', 'manual'
            cameraStream: null,
            scanningQR: false,
            qrUploadFile: null,
            
            // GCash verification modal
            showGCashVerificationModal: false,
            selectedGCashPayment: null,
            processingVerification: false,
            pendingGCashPayments: [],
            qrDetectionInterval: null,
            
            // QR Generator for testing
            testUserId: 58,
            generatedQR: false,
            
            // New data properties for order verification
            showOrderVerificationModal: false,
            processingOrderVerification: false,
            showReceiptModal: false,
            
            rewardsSettings: {
                points_per_amount: 1,
                amount_threshold: 100,
                point_value: 0.50
            },
            
            // Cache receipt settings to avoid repeated API calls
            cachedReceiptSettings: null,
            
            // Pagination
            currentPage: 1,
            itemsPerPage: 20
        }
    },
    computed: {
        isInsufficientCash() {
            if (!this.selectedOrder) return false;
            const amountToPay = this.getAmountToPay(this.selectedOrder);
            return this.cashAmount < amountToPay;
        },
        hasActiveFilters() {
            return this.searchQuery !== '' || 
                  this.dateFilter !== '' || 
                  this.selectedStatus !== this.defaultStatusFilter ||
                  this.sortOption !== this.defaultSortOption;
        },
        totalFilteredOrders() {
            // First filter the orders based on existing criteria
            return this.orders.filter(order => {
                const searchMatch = !this.searchQuery || 
                    order.order_id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    order.customer_name.toLowerCase().includes(this.searchQuery.toLowerCase());
                
                let statusMatch = true;
                if (this.selectedStatus) {
                    if (this.selectedStatus === 'verify_gcash') {
                        // Filter for orders that have pending GCash payments needing verification
                        statusMatch = this.hasPendingGCashPayment(order);
                    } else {
                        statusMatch = order.status === this.selectedStatus;
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
        canApplyRewards() {
            return (this.selectedRewardMethod === 'user_id' && this.foundUser) ||
                   (this.selectedRewardMethod === 'qr_code' && this.qrFoundUser);
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
        getStatusCount(statusValue) {
            if (!statusValue) {
                // For "All Status", return total count
                return this.orders.length;
            }
            
            if (statusValue === 'verify_gcash') {
                // Count orders that have pending GCash payments
                return this.orders.filter(order => this.hasPendingGCashPayment(order)).length;
            }
            
            // For regular statuses, count orders with that status
            return this.orders.filter(order => order.status === statusValue).length;
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
        getRemainingAmount(order) {
            if (order.payment_type === 'downpayment') {
                return order.remaining_amount || (order.total_amount * 0.75);
            }
            return order.total_amount;
        },
        getOriginalTotal(order) {
            if (order.payment_type === 'downpayment') {
                return order.original_total || order.total_amount;
            }
            return order.total_amount;
        },
        getDownpaymentAmount(order) {
            if (order.payment_type === 'downpayment') {
                const originalTotal = this.getOriginalTotal(order);
                return originalTotal * 0.25;
            }
            return 0;
        },
        getAmountToPay(order) {
            if (order.payment_type === 'downpayment') {
                return this.getRemainingAmount(order);
            }
            return order.total_amount;
        },
        calculateChange() {
            if (!this.cashAmount || !this.selectedOrder) {
                this.changeAmount = 0;
                return;
            }
            const amountToPay = this.getAmountToPay(this.selectedOrder);
            this.changeAmount = parseFloat(this.cashAmount) - amountToPay;
        },
        async processPayment() {
            this.processingPayment = true;
            
            try {
                const token = localStorage.getItem('token');
                const amountToPay = this.getAmountToPay(this.selectedOrder);
                
                const response = await this.$fetch(`/api/admin/orders/${this.selectedOrder.order_id}/pay`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cashAmount: parseFloat(this.cashAmount),
                        changeAmount: this.changeAmount,
                        amountToPay: amountToPay,
                        isDownpaymentPayment: this.selectedOrder.payment_type === 'downpayment',
                        sendEmailReceipt: false
                    })
                });

                if (response.ok) {
                    // Add detailed logging before storing the order
                    console.log('Before storing - selectedOrder:', this.selectedOrder);
                    console.log('Before storing - selectedOrder.items:', this.selectedOrder?.items);
                    console.log('Before storing - selectedOrder keys:', Object.keys(this.selectedOrder || {}));
                    
                    // Store the processed order data and payment details for the success modal BEFORE anything else
                    // Create a deep copy to ensure data integrity
                    try {
                        this.processedOrder = JSON.parse(JSON.stringify({
                            ...this.selectedOrder,
                            items: this.selectedOrder.items || [],
                            payment_status: 'paid',
                            processed_at: new Date().toISOString(),
                            cash_amount: parseFloat(this.cashAmount),
                            change_amount: this.changeAmount,
                            amount_paid: amountToPay
                        }));
                        
                        this.paymentDetails = {
                            cashAmount: parseFloat(this.cashAmount),
                            changeAmount: this.changeAmount,
                            amountToPay: amountToPay
                        };
                        
                        console.log('Successfully stored processedOrder:', this.processedOrder);
                        console.log('Items count in processedOrder:', this.processedOrder.items?.length || 0);
                        console.log('Sample item:', this.processedOrder.items?.[0] || 'No items');
                        
                    } catch (copyError) {
                        console.error('Error creating order copy:', copyError);
                        // Fallback to simple copy
                        this.processedOrder = {
                            ...this.selectedOrder,
                            items: Array.isArray(this.selectedOrder.items) ? [...this.selectedOrder.items] : [],
                            payment_status: 'paid',
                            processed_at: new Date().toISOString()
                        };
                    }
                    
                    // Update orders and UI immediately
                    await this.fetchOrders();
                    this.showPaymentConfirmation = false;
                    this.processingPayment = false;
                    
                    // Show success modal instead of printing receipt immediately
                    this.showPaymentSuccessModal = true;
                    
                    // Close the order details modal AFTER storing the data
                    this.selectedOrder = null;
                } else {
                    throw new Error('Failed to process payment');
                }
            } catch (error) {
                console.error('Error processing payment:', error);
                this.processingPayment = false;
                alert('Error processing payment. Please try again.');
            }
        },
        
        async printReceiptAsync() {
            // Print receipt in background without blocking UI
            setTimeout(async () => {
                try {
                    await this.printReceipt();
                    
                    // Clear the processed order data AFTER printing is complete
                    this.processedOrder = null;
                    this.paymentDetails = null;
                } catch (error) {
                    console.error('Error printing receipt:', error);
                    // Still clear the data even if printing fails
                    this.processedOrder = null;
                    this.paymentDetails = null;
                }
            }, 100); // Small delay to ensure UI updates first
        },
        
        closeSuccessModal() {
            this.showPaymentSuccessModal = false;
            
            // Print receipt after closing the success modal
            this.printReceiptAsync();
            
            // Clear the processed order data AFTER printing (moved to printReceiptAsync)
            // this.processedOrder = null;
            // this.paymentDetails = null;
        },
        
        // Method to refresh receipt settings cache
        refreshReceiptSettingsCache() {
            this.cachedReceiptSettings = null;
        },
        
        async printReceipt() {
            try {
                // Use await to resolve the Promise
                const receipt = await this.generateReceiptContent(this.processedOrder);
                
                if (!receipt) {
                    console.error('Receipt generation failed - no content returned');
                    alert('Error generating receipt. Please try again.');
                    return;
                }
                
                const printWindow = window.open('', '', 'width=300,height=600');
                
                if (!printWindow) {
                    alert('Please allow popups for receipt printing');
                    return;
                }

                printWindow.document.write(receipt);
                printWindow.document.close();
                
                printWindow.onload = function() {
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();
                        printWindow.close();
                    }, 250);
                };
            } catch (error) {
                console.error('Error printing receipt:', error);
                alert('Error printing receipt. Please try again.');
            }
        },
        async generateReceiptContent(orderData = null) {
            try {
                // Use the provided orderData or fall back to processedOrder or selectedOrder
                const order = orderData || this.processedOrder || this.selectedOrder;
                
                console.log('generateReceiptContent called with:', { orderData, processedOrder: this.processedOrder, selectedOrder: this.selectedOrder });
                console.log('Using order:', order);
                
                if (!order) {
                    console.error('No order data available for receipt generation');
                    return `
                        <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                            <h2>Receipt Generation Error</h2>
                            <p>No order data available</p>
                            <p>Please try again</p>
                        </body></html>
                    `;
                }
                
                if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
                    console.error('Order items not found or invalid:', order.items);
                    console.error('Full order object keys:', Object.keys(order));
                    
                    // Try to use a fallback receipt with basic order info
                    const date = new Date().toLocaleString();
                    return `
                        <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                            <h2>JM Garis Store</h2>
                            <h3>Official Receipt</h3>
                            <p>Date: ${date}</p>
                            <p>Order #: ${order.order_id || 'N/A'}</p>
                            <p>Customer: ${order.customer_name || 'Walk-in Customer'}</p>
                            <p>Total: ₱${this.formatPrice(order.total_amount || 0)}</p>
                            <p><strong>Items details unavailable</strong></p>
                            <p>Thank you for your purchase!</p>
                        </body></html>
                    `;
                }
                
                // Use cached settings or fetch new ones
                let receiptSettings = this.cachedReceiptSettings;
                
                if (!receiptSettings) {
                    const token = localStorage.getItem('token');
                    const response = await this.$fetch('/api/admin/receipt-settings', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    receiptSettings = {
                        storeName: 'JM Garis Store',
                        storeTagline: 'Official Receipt',
                        storeAddress: '',
                        contactNumber: '',
                        thankyouMessage: 'Thank you for your purchase!\nPlease come again!',
                        footerText: ''
                    };
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data && Object.keys(data).length > 0) {
                            receiptSettings = { ...receiptSettings, ...data };
                        }
                    }
                    
                    // Cache the settings
                    this.cachedReceiptSettings = receiptSettings;
                }
                
                const date = new Date().toLocaleString();
                const items = order.items
                    .map(item => {
                        const displayName = item.choice_name 
                            ? `${item.original_name || item.name} (${item.choice_name})`
                            : item.name;
                            
                        return `
                            <tr>
                                <td style="font-size: 12px; padding: 2px 0;">${displayName}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 12px; text-align: right; padding: 2px 0;">
                                    ${item.quantity} x ${this.formatPrice(item.price)} = ${this.formatPrice(item.price * item.quantity)}
                                </td>
                            </tr>
                        `;
                    }).join('');

                // Format the thank you message with line breaks
                const thankyouMessage = receiptSettings.thankyouMessage
                    ? receiptSettings.thankyouMessage.replace(/\n/g, '<br>')
                    : 'Thank you for your purchase!<br>Please come again!';

                return `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>${receiptSettings.storeName}</title>
                        <style>
                            @media print {
                                @page {
                                    margin: 0;
                                    size: 58mm auto;
                                }
                            }
                            body {
                                font-family: Arial, sans-serif;
                                width: 58mm;
                                margin: 0;
                                padding: 2mm;
                                font-size: 12px;
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 3px;
                                border-bottom: 1px dashed black;
                                padding-bottom: 3px;
                            }
                            .header h2 {
                                font-size: 16px;
                                margin: 0;
                                padding: 0;
                                font-weight: bold;
                            }
                            .header p {
                                font-size: 14px;
                                margin: 2px 0;
                            }
                            .details {
                                margin: 3px 0;
                                border-bottom: 1px dashed black;
                                padding-bottom: 3px;
                            }
                            .details p {
                                margin: 1px 0;
                                font-size: 12px;
                                line-height: 1.2;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin: 4px 0;
                            }
                            tr {
                                line-height: 1.2;
                            }
                            td {
                                padding: 1px 0;
                            }
                            .items-section {
                                border-bottom: 1px dashed black;
                                margin-bottom: 4px;
                                padding-bottom: 4px;
                            }
                            .total-section {
                                text-align: right;
                                font-size: 12px;
                                margin: 4px 0;
                            }
                            .subtotal, .discount, .total {
                                margin: 2px 0;
                            }
                            .total {
                                font-weight: bold;
                                font-size: 14px;
                                margin-top: 4px;
                                padding-top: 2px;
                                border-top: 1px dashed black;
                            }
                            .footer {
                                text-align: center;
                                font-size: 12px;
                                margin-top: 6px;
                            }
                            .footer p {
                                margin: 2px 0;
                            }
                            .spacing {
                                height: 48px;
                            }
                            .cut-line {
                                text-align: center;
                                font-size: 12px;
                                border-top: 1px dashed black;
                                margin-top: 4px;
                                padding-top: 4px;
                            }
                            .payment-details {
                                margin-top: 8px;
                                padding-top: 8px;
                                border-top: 1px dashed black;
                                font-size: 13px;
                                line-height: 1.5;
                            }
                            .store-address {
                                font-size: 11px;
                                margin: 2px 0;
                            }
                            .contact-number {
                                font-size: 11px;
                                margin: 2px 0;
                            }
                            .footer-text {
                                font-size: 10px;
                                margin-top: 4px;
                                color: #666;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2>${receiptSettings.storeName}</h2>
                            <p>${receiptSettings.storeTagline}</p>
                            ${receiptSettings.storeAddress ? `<p class="store-address">${receiptSettings.storeAddress}</p>` : ''}
                            ${receiptSettings.contactNumber ? `<p class="contact-number">${receiptSettings.contactNumber}</p>` : ''}
                        </div>
                        
                        <div class="details">
                            <p><strong>Order #:</strong> ${order.order_id}</p>
                            <p><strong>Date:</strong> ${date}</p>
                            <p><strong>Customer:</strong> ${order.customer_name}</p>
                            <p><strong>Payment Method:</strong> ${this.getPaymentMethodLabel(order.payment_method)}</p>
                            ${order.payment_type === 'downpayment' ? `
                            <p><strong>Payment Type:</strong> Remaining Balance Payment</p>
                            ` : ''}
                        </div>
                        
                        <div class="items-section">
                            <table>
                                <tbody>
                                    ${items}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="total-section">
                            <div class="subtotal">
                                Subtotal: ${this.formatPrice(orderData.subtotal)}
                            </div>
                            ${orderData.discount_amount > 0 ? `
                            <div class="discount">
                                Discount: -${this.formatPrice(orderData.discount_amount)}
                            </div>
                            ` : ''}
                            <div class="total">
                                Total Amount: ${this.formatPrice(order.total_amount)}
                            </div>
                            ${order.payment_type === 'downpayment' ? `
                            <div class="payment-breakdown">
                                <div style="margin-top: 8px; padding-top: 4px; border-top: 1px dashed black;">
                                    <div>Downpayment (25%): ${this.formatPrice(order.total_amount * 0.25)}</div>
                                    <div>Remaining Amount: ${this.formatPrice(this.getAmountToPay(order))}</div>
                                </div>
                            </div>
                            ` : ''}
                            <div class="payment-details">
                                ${order.payment_type === 'downpayment' ? 
                                    `Amount Due: ${this.formatPrice(this.getRemainingAmount(order))}<br>` : 
                                    `Amount Due: ${this.formatPrice(order.total_amount)}<br>`
                                }
                                Cash Amount: ${this.formatPrice(this.paymentDetails?.cashAmount || this.cashAmount)}
                                <br>
                                Change: ${this.formatPrice(this.paymentDetails?.changeAmount || this.changeAmount)}
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>${thankyouMessage}</p>
                            ${receiptSettings.footerText ? `<p class="footer-text">${receiptSettings.footerText}</p>` : ''}
                        </div>
                        
                        <div class="cut-line">
                            --------------------------------
                        </div>
                    </body>
                    </html>
                `;
            } catch (error) {
                console.error('Error generating receipt:', error);
                
                // Return a basic receipt if there's an error
                return `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Receipt</title>
                        <style>/* Basic styles */</style>
                    </head>
                    <body>
                        <h2>JM Garis Store</h2>
                        <p>Order #: ${order.order_id}</p>
                        <p>Total: ${this.formatPrice(order.total_amount)}</p>
                        <p>Thank you for your purchase!</p>
                    </body>
                    </html>
                `;
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
                'to verify': 'To Verify',
                'cancelled': 'Cancelled',
                'completed': 'Completed'
            };
            return displayMap[status.toLowerCase()] || status;
        },
        handleImageError(e) {
            e.target.src = '/img/placeholder.jpg';
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
        async fetchOrders() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/admin/orders', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    this.orders = await response.json();
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            }
        },
        async viewOrderDetails(order) {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch(`/api/admin/orders/${order.order_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const orderData = await response.json();
                    this.cashAmount = '';
                    this.changeAmount = 0;
                    this.selectedOrder = {
                        ...orderData,
                        subtotal: orderData.subtotal || orderData.total_amount,
                        discount_amount: parseFloat(orderData.discount_amount) || 0,
                        email: orderData.email
                    };
                    
                    // Fetch GCash details if order status is "to verify"
                    if (this.selectedOrder.status === 'to verify' && this.selectedOrder.payment_method === 'gcash') {
                        await this.fetchOrderGCashDetails();
                    }
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
            }
        },
        
        async fetchOrderGCashDetails() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch(`/api/admin/orders/${this.selectedOrder.order_id}/gcash-details`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const gcashDetails = await response.json();
                    // Update selectedOrder with GCash details
                    this.selectedOrder = {
                        ...this.selectedOrder,
                        gcash_reference: gcashDetails.gcash_reference,
                        gcash_amount: gcashDetails.amount,
                        gcash_receipt_url: gcashDetails.receipt_url,
                        gcash_submitted_at: gcashDetails.created_at,
                        payment_type: gcashDetails.payment_type || 'full'
                    };
                }
            } catch (error) {
                console.error('Error fetching GCash details:', error);
            }
        },
        
        showOrderGCashVerification() {
            this.showOrderVerificationModal = true;
        },
        
        async verifyOrderGCashPayment(isValid) {
            if (!this.selectedOrder) return;
            
            this.processingOrderVerification = true;
            
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch(`/api/admin/orders/${this.selectedOrder.order_id}/verify-gcash`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        isValid: isValid,
                        gcash_reference: this.selectedOrder.gcash_reference
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    // Show success message
                    alert(isValid ? 
                        'GCash payment verified successfully! Order status updated to Pending.' : 
                        'GCash payment has been rejected. Order status updated accordingly.'
                    );
                    
                    // Refresh orders and close modals
                    await this.fetchOrders();
                    this.showOrderVerificationModal = false;
                    this.selectedOrder = null;
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to verify payment');
                }
            } catch (error) {
                console.error('Error verifying GCash payment:', error);
                alert('Error verifying payment: ' + error.message);
            } finally {
                this.processingOrderVerification = false;
            }
        },
        
        handleReceiptImageError(e) {
            e.target.src = '/img/no-receipt-placeholder.jpg';
            e.target.style.filter = 'grayscale(100%)';
        },
        
        // Add missing methods
        async fetchPendingGCashPayments() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/admin/gcash-payments/pending', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    this.pendingGCashPayments = await response.json();
                } else {
                    this.pendingGCashPayments = [];
                }
            } catch (error) {
                console.error('Error fetching pending GCash payments:', error);
                this.pendingGCashPayments = [];
            }
        },
        
        hasPendingGCashPayment(order) {
            // Check if the order has a pending GCash payment that needs verification
            if (order.payment_method !== 'gcash') return false;
            
            // For orders with "to verify" status, they have pending GCash payments
            if (order.status === 'to verify') return true;
            
            // Check if there's a pending GCash payment for this order
            return this.pendingGCashPayments.some(payment => 
                payment.order_id === order.order_id && payment.status === 'pending'
            );
        },
        
        showGCashVerification(order) {
            // Set the selected order and show the verification modal
            this.selectedGCashPayment = order;
            this.showGCashVerificationModal = true;
        },
        
        handleSortChange() {
            // Reset to first page when sorting changes
            this.currentPage = 1;
        },
        
        handleDateFilterChange() {
            // Reset to first page when date filter changes
            this.currentPage = 1;
        },
        
        openCustomerRewards(order) {
            // Set the selected order for rewards and show the modal
            this.selectedOrder = order;
            this.showWalkInRewardsModal = true;
        },
        
        // ...existing methods...
    },
    mounted() {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.username = decoded.username;
        }
        this.fetchOrders();
        this.fetchPendingGCashPayments();
    },
    
    beforeUnmount() {
        // Cleanup camera stream when component is destroyed
        this.stopCameraScanning();
        
        // Clean up any upload file URLs
        if (this.qrUploadFile && this.qrUploadFile.preview) {
            URL.revokeObjectURL(this.qrUploadFile.preview);
        }
    }
}
</script>

<style scoped>
.admin-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px;
}

.admin-content {
    padding: 2rem;
}

.admin-content h1 {
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

.filter-btn.verify_gcash {
    background-color: #fef3e8;
    color: #c2410c;
}

.filter-btn.verify_gcash.active {
    background-color: #ea580c;
    color: white;
}

.filter-btn.active {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(5, 139, 16, 0.1);
}

.status-count {
    background-color: rgba(255, 255, 255, 0.9);
    color: #374151;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 8px;
    min-width: 18px;
    display: inline-block;
    text-align: center;
    line-height: 1.2;
}

.filter-btn.active .status-count {
    background-color: rgba(255, 255, 255, 0.95);
    color: #1f2937;
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

.pending {
    background-color: #fef3c7;
    color: #92400e;
}

.pending_pickup, .pending-pickup {
    background-color: #e0f2fe;
    color: #0277bd;
}

.pending_delivery, .pending-delivery {
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
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.cancelled {
    background-color: #fee2e2;
    color: #b91c1c;
}

.staff-info {
    font-size: 0.9rem;
    color: #2e7d32;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
}

.rewards-btn {
    background-color: #e67e22;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    transition: all 0.3s ease;
    white-space: nowrap;
}

.rewards-btn:hover {
    background-color: #d35400;
    transform: translateY(-1px);
}

.rewards-btn i {
    font-size: 0.9rem;
}

.rewards-redeemed-btn {
    background-color: #27ae60;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    cursor: not-allowed;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    white-space: nowrap;
    opacity: 0.9;
}

.rewards-redeemed-btn i {
    font-size: 0.9rem;
}

.no-data {
    text-align: center;
    padding: 2rem;
    color: #718096;
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

.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
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

.pay-btn {
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

.pay-btn:hover {
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

.accept-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
}

.accept-btn:disabled:hover {
    background-color: #94a3b8;
    transform: none;
}

.accept-btn .fa-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.cancel-btn {
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

.cancel-btn:hover {
    background-color: #5a6268;
}

.cancel-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.choice-info {
    font-size: 0.85rem;
    color: #3498db;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.4rem 0.7rem;
    border-radius: 4px;
    width: fit-content;
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

.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
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

.pay-btn {
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

.pay-btn:hover {
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

.accept-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
}

.accept-btn:disabled:hover {
    background-color: #94a3b8;
    transform: none;
}

.accept-btn .fa-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.cancel-btn {
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

.cancel-btn:hover {
    background-color: #5a6268;
}

.cancel-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.choice-info {
    font-size: 0.85rem;
    color: #3498db;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.4rem 0.7rem;
    border-radius: 4px;
    width: fit-content;
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

.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
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

.pay-btn {
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

.pay-btn:hover {
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

.accept-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
}

.accept-btn:disabled:hover {
    background-color: #94a3b8;
    transform: none;
}

.accept-btn .fa-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.cancel-btn {
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

.cancel-btn:hover {
    background-color: #5a6268;
}

.cancel-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.choice-info {
    font-size: 0.85rem;
    color: #3498db;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.4rem 0.7rem;
    border-radius: 4px;
    width: fit-content;
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

.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
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

.pay-btn {
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

.pay-btn:hover {
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

.accept-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
}

.accept-btn:disabled:hover {
    background-color: #94a3b8;
    transform: none;
}

.accept-btn .fa-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.cancel-btn {
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

.cancel-btn:hover {
    background-color: #5a6268;
}

.cancel-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.choice-info {
    font-size: 0.85rem;
    color: #3498db;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.4rem 0.7rem;
    border-radius: 4px;
    width: fit-content;
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

.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
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

.pay-btn {
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

.pay-btn:hover {
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

.accept-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
}

.accept-btn:disabled:hover {
    background-color: #94a3b8;
    transform: none;
}

.accept-btn .fa-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.cancel-btn {
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

.cancel-btn:hover {
    background-color: #5a6268;
}

.cancel-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.choice-info {
    font-size: 0.85rem;
    color: #3498db;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.4rem 0.7rem;
    border-radius: 4px;
    width: fit-content;
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

.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
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

.pay-btn {
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

.pay-btn:hover {
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

.accept-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
}

.accept-btn:disabled:hover {
    background-color: #94a3b8;
    transform: none;
}

.accept-btn .fa-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.cancel-btn {
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

.cancel-btn:hover {
    background-color: #5a6268;
}

.cancel-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.choice-info {
    font-size: 0.85rem;
    color: #3498db;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.4rem 0.7rem;
    border-radius: 4px;
    width: fit-content;
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

.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
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

.pay-btn {
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

.pay-btn:hover {
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

.accept-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
}

.accept-btn:disabled:hover {
    background-color: #94a3b8;
    transform: none;
}

.accept-btn .fa-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.cancel-btn {
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

.cancel-btn:hover {
    background-color: #5a6268;
}

.cancel-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.choice-info {
    font-size: 0.85rem;
    color: #3498db;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.4rem 0.7rem;
    border-radius: 4px;
    width: fit-content;
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

.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
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

.pay-btn {
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

.pay-btn:hover {
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

.accept-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
}

.accept-btn:disabled:hover {
    background-color: #94a3b8;
    transform: none;
}

.accept-btn .fa-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.cancel-btn {
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

.cancel-btn:hover {
    background-color: #5a6268;
}

.cancel-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.choice-info {
    font-size: 0.85rem;
    color: #3498db;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.4rem 0.7rem;
    border-radius: 4px;
    width: fit-content;
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

.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
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

.pay-btn {
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

.pay-btn:hover {
    background-color: #45a049;
}

.close-btn {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    gap: 1rem;
}

.pagination-controls .btn {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.pagination-controls .btn:disabled {
    background-color: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
}

.pagination-controls .btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-info {
    font-size: 0.9rem;
    color: #64748b;
    margin: 0 1rem;
    white-space: nowrap;
}

.pagination-select {
    font-size: 0.9rem;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background-color: white;
    color: #374151;
    margin-left: 0.5rem;
}

@media (max-width: 768px) {
    .pagination-container {
        padding: 0.75rem;
    }
    
    .pagination-controls {
        gap: 0.5rem;
    }
    
    .pagination-controls .btn {
        min-width: 36px;
        height: 36px;
        font-size: 0.8rem;
    }
    
    .pagination-info {
        font-size: 0.8rem;
        margin: 0 0.5rem;
    }
}

/* Modern Pagination Styles */
.pagination {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 1rem;
}

.pagination-btn {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    padding: 0 0.75rem;
}

.pagination-btn:hover:not(:disabled) {
    background-color: #f8fafc;
    border-color: #3b82f6;
    color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.pagination-btn:disabled {
    background-color: #f1f5f9;
    border-color: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.pagination-btn.page-btn {
    min-width: 40px;
    padding: 0;
    font-weight: 600;
}

.pagination-btn.page-btn.active {
    background-color: #3b82f6;
    border-color: #3b82f6;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.pagination-btn.page-btn.active:hover {
    background-color: #2563eb;
    border-color: #2563eb;
    transform: translateY(-1px);
}

.pagination-ellipsis {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
    color: #94a3b8;
    font-weight: 600;
    pointer-events: none;
}

/* Responsive Pagination */
@media (max-width: 768px) {
    .pagination-container {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem 0.5rem;
    }
    
    .pagination {
        justify-content: center;
        margin-left: 0;
        flex-wrap: wrap;
        gap: 0.25rem;
    }
    
    .pagination-btn {
        min-width: 36px;
        height: 36px;
        font-size: 0.8rem;
        padding: 0 0.5rem;
    }
    
    .pagination-ellipsis {
        min-width: 36px;
        height: 36px;
    }
    
    .pagination-info {
        text-align: center;
        font-size: 0.8rem;
        order: -1;
    }
}

@media (max-width: 480px) {
    .pagination-btn {
        min-width: 32px;
        height: 32px;
        font-size: 0.75rem;
        padding: 0 0.25rem;
    }
    
    .pagination-ellipsis {
        min-width: 32px;
        height: 32px;
    }
    
    /* Hide some page numbers on very small screens */
    .pagination-btn.page-btn {
        display: none;
    }
    
    .pagination-btn.page-btn.active,
    .pagination-btn.page-btn:first-of-type,
    .pagination-btn.page-btn:last-of-type {
        display: flex;
    }
}

/* Payment Success Modal Styles */
.payment-success-modal {
    max-width: 500px;
    padding: 0;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.success-header {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 2rem;
    text-align: center;
    position: relative;
}

.success-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50% 50% 0 0;
    transform: scale(1.5);
}

.success-icon {
    position: relative;
    z-index: 1;
    margin-bottom: 1rem;
}

.success-icon i {
    font-size: 3rem;
    color: white;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    padding: 1rem;
    border: 3px solid rgba(255, 255, 255, 0.3);
}

.success-header h2 {
    position: relative;
    z-index: 1;
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    font-weight: 600;
}

.success-subtitle {
    position: relative;
    z-index: 1;
    margin: 0;
    font-size: 1rem;
    opacity: 0.9;
}

.success-body {
    padding: 2rem;
}

.order-summary-success h3 {
    margin: 0 0 1.5rem 0;
    color: #1f2937;
    font-size: 1.25rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #f3f4f6;
}

.order-summary-success h3 i {
    color: #10b981;
}

.order-info-success {
    background: #f9fafb;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.95rem;
}

.info-row:last-child {
    border-bottom: none;
}

.info-row .label {
    color: #6b7280;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.info-row .label i {
    color: #9ca3af;
    width: 16px;
    text-align: center;
}

.info-row .value {
    color: #1f2937;
    font-weight: 600;
    text-align: right;
}

.total-row {
    background: rgba(16, 185, 129, 0.1);
    margin: 0.75rem -1.5rem -1.5rem -1.5rem;
    padding: 1rem 1.5rem;
    border-top: 2px solid #10b981;
    border-bottom: none;
}

.total-row .label {
    color: #059669;
    font-weight: 600;
    font-size: 1.1rem;
}

.total-row .value {
    color: #059669;
    font-weight: 700;
    font-size: 1.2rem;
}

.payment-details {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
}

.success-actions {
    padding: 1.5rem 2rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    text-align: center;
}

.done-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 0.875rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.done-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.done-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.done-btn i {
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .payment-success-modal {
        margin: 1rem;
        max-width: calc(100% - 2rem);
    }
    
    .success-header {
        padding: 1.5rem;
    }
    
    .success-header h2 {
        font-size: 1.5rem;
    }
    
    .success-icon i {
        font-size: 2.5rem;
        padding: 0.75rem;
    }
    
    .success-body {
        padding: 1.5rem;
    }
    
    .order-info-success {
        padding: 1rem;
    }
    
    .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
        padding: 0.5rem 0;
    }
    
    .info-row .value {
        text-align: left;
        font-size: 1rem;
    }
    
    .total-row {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
}

/* GCash Verification Styles */
.status-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.gcash-verification {
    margin-top: 0.5rem;
}

.verify-gcash-btn {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border: none;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s ease;
    font-weight: 500;
}

.verify-gcash-btn:hover {
    background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

.verify-gcash-btn i {
    font-size: 0.7rem;
}

/* GCash Verification Modal */
.gcash-verification-modal {
    max-width: 600px;
    margin: 2rem auto;
}

.verification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border-radius: 12px 12px 0 0;
}

.verification-header h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
}

.verification-header .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 0.2s ease;
}

.verification-header .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.verification-content {
    padding: 2rem;
}

.payment-info {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.payment-info h4 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-item label {
    font-size: 0.875rem;
    color: #6c757d;
    font-weight: 500;
}

.info-item span {
    font-size: 0.95rem;
    color: #2c3e50;
    font-weight: 500;
}

.info-item .gcash-reference {
    background: #e3f2fd;
    color: #1976d2;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    border: 1px solid #bbdefb;
}

.info-item .amount {
    color: #28a745;
    font-weight: 700;
    font-size: 1.1rem;
}

.verification-actions {
    background: white;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    padding: 1.5rem;
}

.verification-actions h4 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    font-size: 1.1rem;
    font-weight: 600;
}

.verification-actions p {
    margin: 0 0 1.5rem 0;
    color: #6c757d;
    line-height: 1.5;
}

.verification-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.verify-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    min-width: 140px;
    justify-content: center;
}

.verify-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.verify-btn.approve {
    background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.verify-btn.approve:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e7e34 0%, #155724 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
}

.verify-btn.reject {
    background: linear-gradient(135deg, #dc3545 0%, #bd2130 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.verify-btn.reject:hover:not(:disabled) {
    background: linear-gradient(135deg, #bd2130 0%, #a71e2a 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
}

.verify-btn i {
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .gcash-verification-modal {
        margin: 1rem;
        max-width: calc(100% - 2rem);
    }
    
    .verification-header {
        padding: 1rem 1.5rem;
    }
    
    .verification-header h3 {
        font-size: 1.1rem;
    }
    
    .verification-content {
        padding: 1.5rem;
    }
    
    .info-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }
    
    .verification-buttons {
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .verify-btn {
        min-width: unset;
        width: 100%;
    }
}
</style>

