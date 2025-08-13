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
                                    <span :class="['status-badge', order.status.toLowerCase().replace(/ /g, '-')]">
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
                            <span :class="['status-badge', selectedOrder.status.toLowerCase().replace(/ /g, '-')]">
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

        <!-- Payment Modal -->
        <div v-if="showPaymentConfirmation" class="modal-overlay">
            <div class="modal-content payment-modal">
                <div class="payment-header">
                    <h2>Payment Details</h2>
                    <div class="order-metadata">
                        <span class="order-id">Order #{{ selectedOrder.order_id }}</span>
                        <span class="customer-name">{{ selectedOrder.customer_name }}</span>
                    </div>
                </div>

                <div class="payment-body">
                    <div class="payment-summary">
                        <h3>Order Summary</h3>
                        <div class="order-items">
                            <div v-for="item in selectedOrder.items" :key="item.product_id" class="order-item">
                                <div class="item-details">
                                    <span class="item-name">{{ item.original_name || item.name }}</span>
                                    <small v-if="item.choice_name" class="variant-tag">{{ item.choice_name }}</small>
                                </div>
                                <div class="item-pricing">
                                    <span class="quantity">× {{ item.quantity }}</span>
                                    <span class="amount">{{ formatPrice(item.price * item.quantity) }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="totals-breakdown">
                            <div class="breakdown-row">
                                <span>Subtotal</span>
                                <span>{{ formatPrice(selectedOrder.subtotal || selectedOrder.total_amount) }}</span>
                            </div>
                            <div v-if="selectedOrder.discount_amount" class="breakdown-row discount">
                                <span>Discount Applied</span>
                                <span>-{{ formatPrice(selectedOrder.discount_amount) }}</span>
                            </div>
                            <div class="breakdown-row total">
                                <span>Total Amount</span>
                                <span>{{ formatPrice(selectedOrder.total_amount) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="payment-calculator">
                        <h3>Payment Calculator</h3>
                        
                        <!-- Show payment breakdown for downpayment orders -->
                        <div v-if="selectedOrder.payment_type === 'downpayment'" class="payment-breakdown-info">
                            <div class="breakdown-item">
                                <span>Total Order Amount:</span>
                                <span>{{ formatPrice(selectedOrder.total_amount) }}</span>
                            </div>
                            <div class="breakdown-item">
                                <span>Downpayment Paid (25%):</span>
                                <span>{{ formatPrice(selectedOrder.total_amount * 0.25) }}</span>
                            </div>
                            <div class="breakdown-item remaining">
                                <span>Remaining Amount Due:</span>
                                <span>{{ formatPrice(getRemainingAmount(selectedOrder)) }}</span>
                            </div>
                        </div>
                        
                        <div class="calculator-input">
                            <label for="cashAmount">Cash Amount</label>
                            <div class="input-wrapper">
                                <span class="currency-symbol">₱</span>
                                <input 
                                    type="number" 
                                    id="cashAmount" 
                                    v-model="cashAmount"
                                    @input="calculateChange"
                                    :min="getAmountToPay(selectedOrder)"
                                    step="0.01"
                                    placeholder="Enter amount"
                                >
                            </div>
                            <small class="amount-due-note">
                                Amount due: {{ formatPrice(getAmountToPay(selectedOrder)) }}
                            </small>
                        </div>

                        <div class="calculator-result" :class="{ 'insufficient': isInsufficientCash }">
                            <span>Change</span>
                            <span class="change-amount">{{ formatPrice(changeAmount) }}</span>
                        </div>
                    </div>
                </div>

                <div class="payment-actions">
                    <button 
                        @click="processPayment" 
                        class="accept-btn"
                        :disabled="isInsufficientCash || !cashAmount"
                    >
                        <i class="fas fa-check-circle"></i>
                        Confirm Payment
                    </button>
                    <button @click="showPaymentConfirmation = false" class="cancel-btn">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showEmailSuccess" class="modal-overlay">
            <div class="modal-content email-success-modal">
                <div class="email-success-icon">
                    <i class="fas fa-envelope-circle-check"></i>
                </div>
                <h2>Receipt Sent!</h2>
                <p>A digital receipt has been emailed to <span class="customer-email">{{ selectedOrder?.email }}</span></p>
                <button @click="closeEmailSuccessModal" class="close-btn">
                    <i class="fas fa-check"></i> OK
                </button>
            </div>
        </div>

        <!-- Walk-in Customer Rewards Modal -->
        <div v-if="showWalkInRewardsModal" class="modal-overlay">
            <div class="modal-content walkin-rewards-modal">
                <div class="modal-header">
                    <h2>Customer Rewards</h2>
                    <p>Apply rewards to customer account for this walk-in purchase</p>
                </div>
                
                <div class="modal-body">
                    <div class="rewards-info">
                        <div class="order-summary">
                            <h3>Order Summary</h3>
                            <p><strong>Order ID:</strong> {{ selectedOrder?.order_id }}</p>
                            <p><strong>Total Amount:</strong> {{ formatPrice(selectedOrder?.total_amount) }}</p>
                            <p><strong>Points to Award:</strong> {{ calculatePointsToAward(selectedOrder?.total_amount) }} points</p>
                        </div>
                        
                        <div class="reward-method-selection">
                            <h3>Select Customer Identification Method</h3>
                            <div class="method-options">
                                <label class="method-option">
                                    <input 
                                        type="radio" 
                                        value="user_id" 
                                        v-model="selectedRewardMethod"
                                        name="rewardMethod"
                                    >
                                    <div class="method-card">
                                        <i class="fas fa-id-card"></i>
                                        <span>Enter User ID</span>
                                        <small>Customer provides their user ID number</small>
                                    </div>
                                </label>
                                
                                <label class="method-option">
                                    <input 
                                        type="radio" 
                                        value="qr_code" 
                                        v-model="selectedRewardMethod"
                                        name="rewardMethod"
                                    >
                                    <div class="method-card">
                                        <i class="fas fa-qrcode"></i>
                                        <span>Scan QR Code</span>
                                        <small>Scan customer's QR code from their app</small>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <!-- User ID Input Section -->
                        <div v-if="selectedRewardMethod === 'user_id'" class="user-id-section">
                            <div class="input-group">
                                <label>Customer User ID</label>
                                <input 
                                    type="number" 
                                    v-model="customerUserId"
                                    placeholder="Enter customer's user ID"
                                    class="user-id-input"
                                    @input="validateUserId"
                                >
                                <button 
                                    @click="lookupUser" 
                                    class="lookup-btn"
                                    :disabled="!customerUserId || lookingUpUser"
                                >
                                    <i class="fas fa-search" v-if="!lookingUpUser"></i>
                                    <i class="fas fa-spinner fa-spin" v-else></i>
                                    {{ lookingUpUser ? 'Looking up...' : 'Lookup User' }}
                                </button>
                            </div>
                            
                            <div v-if="foundUser" class="user-preview">
                                <div class="user-info">
                                    <i class="fas fa-user-check"></i>
                                    <div class="user-details">
                                        <h4>{{ foundUser.firstname }} {{ foundUser.lastname }}</h4>
                                        <p>@{{ foundUser.username }}</p>
                                        <p>{{ foundUser.email }}</p>
                                        <p>Current Points: {{ foundUser.points || 0 }}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div v-if="userLookupError" class="error-message">
                                <i class="fas fa-exclamation-triangle"></i>
                                {{ userLookupError }}
                            </div>
                        </div>
                        
                        <!-- QR Code Section -->
                        <div v-if="selectedRewardMethod === 'qr_code'" class="qr-code-section">
                            <div class="qr-scanner-container">
                                <h4>QR Code Scanner</h4>
                                <p>Ask the customer to show their QR code from the rewards section in their app</p>
                                
                                <!-- QR Scan Method Selection -->
                                <div class="qr-method-selection">
                                    <div class="qr-method-tabs">
                                        <button 
                                            @click="qrScanMethod = 'camera'"
                                            :class="['qr-tab', { active: qrScanMethod === 'camera' }]"
                                        >
                                            <i class="fas fa-camera"></i>
                                            Open Camera
                                        </button>
                                        <button 
                                            @click="qrScanMethod = 'upload'"
                                            :class="['qr-tab', { active: qrScanMethod === 'upload' }]"
                                        >
                                            <i class="fas fa-upload"></i>
                                            Upload QR
                                        </button>
                                        <button 
                                            @click="qrScanMethod = 'manual'"
                                            :class="['qr-tab', { active: qrScanMethod === 'manual' }]"
                                        >
                                            <i class="fas fa-keyboard"></i>
                                            Manual Input
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Camera Scanner -->
                                <div v-if="qrScanMethod === 'camera'" class="camera-scanner">
                                    <div v-if="!scanningQR" class="camera-placeholder">
                                        <i class="fas fa-camera"></i>
                                        <p>Click to start camera scanning</p>
                                        <button @click="startCameraScanning" class="start-camera-btn">
                                            <i class="fas fa-camera"></i>
                                            Start Camera
                                        </button>
                                    </div>
                                    <div v-else class="camera-view">
                                        <video ref="qrVideo" autoplay playsinline class="qr-video"></video>
                                        <div class="camera-overlay">
                                            <div class="scan-area"></div>
                                            <p>Position QR code within the frame</p>
                                        </div>
                                        <div class="camera-controls">
                                            <button @click="stopCameraScanning" class="stop-camera-btn">
                                                <i class="fas fa-stop"></i>
                                                Stop Camera
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Upload QR -->
                                <div v-if="qrScanMethod === 'upload'" class="upload-scanner">
                                    <div class="upload-area" @click="$refs.qrFileInput.click()" @dragover.prevent @drop.prevent="handleQRDrop">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                        <p>Click to upload or drag & drop QR code image</p>
                                        <p class="upload-hint">Supports: PNG, JPG, JPEG</p>
                                    </div>
                                    <input 
                                        ref="qrFileInput"
                                        type="file" 
                                        accept="image/*" 
                                        @change="handleQRUpload"
                                        style="display: none"
                                    >
                                    <div v-if="qrUploadFile" class="upload-preview">
                                        <div class="uploaded-image">
                                            <img :src="qrUploadFile.preview" alt="Uploaded QR Code">
                                            <div class="upload-info">
                                                <p>{{ qrUploadFile.name }}</p>
                                                <button @click="processUploadedQR" class="process-qr-btn">
                                                    <i class="fas fa-search"></i>
                                                    Scan QR Code
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Manual Input -->
                                <div v-if="qrScanMethod === 'manual'" class="manual-scanner">
                                    <div class="manual-qr-input">
                                        <label>Manual QR Code Input</label>
                                        <input 
                                            type="text" 
                                            v-model="qrCodeData"
                                            placeholder="Paste QR JSON data or enter user ID"
                                            class="qr-input"
                                            @input="processQRCode"
                                        >
                                        <small>Paste the complete JSON from your QR scanner, or enter just a user ID (e.g., 58)</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div v-if="qrFoundUser" class="user-preview">
                                <div class="user-info">
                                    <i class="fas fa-qrcode"></i>
                                    <div class="user-details">
                                        <h4>{{ qrFoundUser.firstname }} {{ qrFoundUser.lastname }}</h4>
                                        <p>@{{ qrFoundUser.username }}</p>
                                        <p>{{ qrFoundUser.email }}</p>
                                        <p>Current Points: {{ qrFoundUser.points || 0 }}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div v-if="qrLookupError" class="error-message">
                                <i class="fas fa-exclamation-triangle"></i>
                                {{ qrLookupError }}
                            </div>
                            
                            <!-- QR Code Generator for Testing -->
                            <div class="qr-generator-section">
                                <h4>QR Code Generator (For Testing)</h4>
                                <div class="generator-controls">
                                    <input 
                                        type="number" 
                                        v-model="testUserId" 
                                        placeholder="Enter User ID (default: 58)"
                                        min="1"
                                        class="test-user-input"
                                    >
                                    <button @click="generateTestQR" class="generate-qr-btn">
                                        <i class="fas fa-qrcode"></i> Generate QR
                                    </button>
                                </div>
                                <div v-if="generatedQR" class="generated-qr">
                                    <canvas ref="qrCanvas"></canvas>
                                    <p>QR Code for User ID: {{ testUserId }}</p>
                                    <small>Contains JSON: {"type":"user_identification","userId":{{ testUserId }},...}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button 
                        @click="processWalkInRewards" 
                        class="apply-rewards-btn"
                        :disabled="!canApplyRewards || processingRewards"
                    >
                        <i class="fas fa-gift" v-if="!processingRewards"></i>
                        <i class="fas fa-spinner fa-spin" v-else></i>
                        {{ processingRewards ? 'Processing...' : 'Apply Rewards' }}
                    </button>
                    <button @click="skipWalkInRewards" class="skip-btn">
                        <i class="fas fa-times"></i> Skip Rewards
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Walk-in Rewards Success Modal -->
        <div v-if="showWalkInRewardsSuccess" class="modal-overlay">
            <div class="modal-content rewards-success-modal">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Rewards Applied Successfully!</h2>
                <div class="success-details">
                    <p><strong>Customer:</strong> {{ successRewardData?.customerName }}</p>
                    <p><strong>Points Awarded:</strong> {{ successRewardData?.pointsAwarded }}</p>
                    <p><strong>New Total Points:</strong> {{ successRewardData?.newTotalPoints }}</p>
                </div>
                <p class="success-message">The customer has been notified about their new points!</p>
                <button @click="closeWalkInRewardsSuccess" class="close-btn">
                    <i class="fas fa-check"></i> Done
                </button>
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
            showEmailSuccess: false,
            selectedStatus: 'ready for pickup',
            defaultStatusFilter: 'ready for pickup',
            statusFilters: [
                { label: 'All Status', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Pending Pickup', value: 'pending_pickup' },
                { label: 'Pending Delivery', value: 'pending_delivery' },
                { label: 'Paid via GCash', value: 'paid using gcash' },
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
            successRewardData: null,
            
            // QR Scanner options
            qrScanMethod: 'manual', // 'camera', 'upload', 'manual'
            cameraStream: null,
            scanningQR: false,
            qrUploadFile: null,
            qrDetectionInterval: null,
            
            // QR Generator for testing
            testUserId: 58,
            generatedQR: false,
            
            rewardsSettings: {
                points_per_amount: 1,
                amount_threshold: 100,
                point_value: 0.50
            },
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
                
                const statusMatch = !this.selectedStatus || order.status === this.selectedStatus;
                
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
                        sendEmailReceipt: true
                    })
                });

                if (response.ok) {
                    // Print physical receipt first
                    this.printReceipt();
                    
                    await this.fetchOrders();
                    this.showPaymentConfirmation = false;
                    
                    // Check if this is a walk-in order (physical order) to show rewards modal
                    if (this.selectedOrder.is_physical_order) {
                        this.showWalkInRewardsModal = true;
                        // Reset rewards modal data
                        this.selectedRewardMethod = '';
                        this.customerUserId = '';
                        this.qrCodeData = '';
                        this.foundUser = null;
                        this.qrFoundUser = null;
                        this.userLookupError = '';
                        this.qrLookupError = '';
                        await this.fetchRewardsSettings();
                        
                        // Show email success modal if customer has email (after walk-in rewards)
                        if (this.selectedOrder.email) {
                            this.showEmailSuccess = true;
                        }
                    } else {
                        // For non-walk-in orders
                        if (this.selectedOrder.email) {
                            this.showEmailSuccess = true;
                        } else {
                            // Close the order details modal if no email success modal is shown
                            this.selectedOrder = null;
                        }
                    }
                } else {
                    throw new Error('Failed to process payment');
                }
            } catch (error) {
                console.error('Error processing payment:', error);
            }
        },
        closeEmailSuccessModal() {
            this.showEmailSuccess = false;
            // Only close the order details modal if we're not showing walk-in rewards
            if (!this.showWalkInRewardsModal) {
                this.selectedOrder = null;
            }
        },
        async printReceipt() {
            try {
                // Use await to resolve the Promise
                const receipt = await this.generateReceiptContent();
                
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
            }
        },
        async generateReceiptContent() {
            try {
                // Fetch receipt settings
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/admin/receipt-settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                let receiptSettings = {
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
                
                const date = new Date().toLocaleString();
                const items = this.selectedOrder.items
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
                            <p><strong>Order #:</strong> ${this.selectedOrder.order_id}</p>
                            <p><strong>Date:</strong> ${date}</p>
                            <p><strong>Customer:</strong> ${this.selectedOrder.customer_name}</p>
                            <p><strong>Payment Method:</strong> ${this.getPaymentMethodLabel(this.selectedOrder.payment_method)}</p>
                            ${this.selectedOrder.payment_type === 'downpayment' ? `
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
                                Subtotal: ${this.formatPrice(this.selectedOrder.subtotal)}
                            </div>
                            ${this.selectedOrder.discount_amount > 0 ? `
                            <div class="discount">
                                Discount: -${this.formatPrice(this.selectedOrder.discount_amount)}
                            </div>
                            ` : ''}
                            <div class="total">
                                Total Amount: ${this.formatPrice(this.selectedOrder.total_amount)}
                            </div>
                            ${this.selectedOrder.payment_type === 'downpayment' ? `
                            <div class="payment-breakdown">
                                <div style="margin-top: 8px; padding-top: 4px; border-top: 1px dashed black;">
                                    <div>Downpayment (25%): ${this.formatPrice(this.selectedOrder.total_amount * 0.25)}</div>
                                    <div>Remaining Amount: ${this.formatPrice(this.getAmountToPay(this.selectedOrder))}</div>
                                </div>
                            </div>
                            ` : ''}
                            <div class="payment-details">
                                ${this.selectedOrder.payment_type === 'downpayment' ? 
                                    `Amount Due: ${this.formatPrice(this.getAmountToPay(this.selectedOrder))}<br>` : 
                                    `Amount Due: ${this.formatPrice(this.selectedOrder.total_amount)}<br>`
                                }
                                Cash Amount: ${this.formatPrice(this.cashAmount)}
                                <br>
                                Change: ${this.formatPrice(this.changeAmount)}
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
                        <p>Order #: ${this.selectedOrder.order_id}</p>
                        <p>Total: ${this.formatPrice(this.selectedOrder.total_amount)}</p>
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
                    this.cashAmount = ''; // Reset cash amount when opening modal
                    this.changeAmount = 0; // Reset change amount
                    this.selectedOrder = {
                        ...orderData,
                        subtotal: orderData.subtotal || orderData.total_amount,
                        discount_amount: parseFloat(orderData.discount_amount) || 0,
                        email: orderData.email // Make sure email is included in the order data
                    };
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
            }
        },
        
        // Walk-in rewards methods
        calculatePointsToAward(totalAmount) {
            if (!totalAmount || !this.rewardsSettings) return 0;
            return Math.floor(totalAmount / this.rewardsSettings.amount_threshold) * this.rewardsSettings.points_per_amount;
        },
        
        async fetchRewardsSettings() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/admin/rewards/settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    this.rewardsSettings = await response.json();
                }
            } catch (error) {
                console.error('Error fetching rewards settings:', error);
            }
        },
        
        validateUserId() {
            this.userLookupError = '';
            this.foundUser = null;
        },
        
        async lookupUser() {
            if (!this.customerUserId) return;
            
            this.lookingUpUser = true;
            this.userLookupError = '';
            this.foundUser = null;
            
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch(`/api/admin/walk-in/lookup-user/${this.customerUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    this.foundUser = await response.json();
                } else {
                    const error = await response.json();
                    this.userLookupError = error.message || 'User not found';
                }
            } catch (error) {
                console.error('Error looking up user:', error);
                this.userLookupError = 'Error looking up user. Please try again.';
            } finally {
                this.lookingUpUser = false;
            }
        },
        
        async processQRCode() {
            if (!this.qrCodeData) {
                this.qrFoundUser = null;
                this.qrLookupError = '';
                return;
            }
            
            this.qrLookupError = '';
            this.qrFoundUser = null;
            
            try {
                let userId;
                const qrData = this.qrCodeData.trim();
                
                // Try to parse as JSON first (for the actual QR format)
                try {
                    const qrJson = JSON.parse(qrData);
                    if (qrJson.type === 'user_identification' && qrJson.userId) {
                        userId = parseInt(qrJson.userId);
                        console.log('Parsed QR JSON:', qrJson);
                    } else {
                        throw new Error('Invalid QR JSON format');
                    }
                } catch (jsonError) {
                    // If JSON parsing fails, try other formats
                    if (qrData.startsWith('JMG-USER-')) {
                        // Extract user ID from simple format
                        userId = parseInt(qrData.replace('JMG-USER-', ''));
                    } else if (!isNaN(parseInt(qrData))) {
                        // Accept plain user ID for backward compatibility
                        userId = parseInt(qrData);
                    } else {
                        this.qrLookupError = 'Invalid QR code format. Expected JSON with user identification or JMG-USER-{ID} format.';
                        return;
                    }
                }
                
                if (isNaN(userId) || userId <= 0) {
                    this.qrLookupError = 'Invalid user ID in QR code';
                    return;
                }
                
                console.log('Processing user ID:', userId);
                
                const token = localStorage.getItem('token');
                const response = await this.$fetch(`/api/admin/walk-in/lookup-user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    this.qrFoundUser = await response.json();
                    console.log('User found:', this.qrFoundUser);
                } else {
                    const error = await response.json();
                    this.qrLookupError = error.message || 'User not found';
                    console.error('User lookup error:', error);
                }
            } catch (error) {
                console.error('Error processing QR code:', error);
                this.qrLookupError = 'Error processing QR code. Please try again.';
            }
        },
        
        // Camera scanning methods
        async startCameraScanning() {
            try {
                this.scanningQR = true;
                this.qrLookupError = '';
                
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment', // Use back camera if available
                        width: { ideal: 300 },
                        height: { ideal: 300 }
                    } 
                });
                
                this.cameraStream = stream;
                this.$nextTick(() => {
                    if (this.$refs.qrVideo) {
                        this.$refs.qrVideo.srcObject = stream;
                        this.$refs.qrVideo.play();
                        // Start QR code detection
                        this.startQRDetection();
                    }
                });
            } catch (error) {
                console.error('Error accessing camera:', error);
                this.qrLookupError = 'Could not access camera. Please check permissions and try again.';
                this.scanningQR = false;
            }
        },
        
        stopCameraScanning() {
            if (this.cameraStream) {
                this.cameraStream.getTracks().forEach(track => track.stop());
                this.cameraStream = null;
            }
            if (this.qrDetectionInterval) {
                clearInterval(this.qrDetectionInterval);
                this.qrDetectionInterval = null;
            }
            this.scanningQR = false;
        },
        
        startQRDetection() {
            // Import jsQR dynamically
            import('jsqr').then((jsQRModule) => {
                const jsQR = jsQRModule.default;
                
                const detectQR = () => {
                    if (!this.scanningQR || !this.$refs.qrVideo) return;
                    
                    const video = this.$refs.qrVideo;
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    if (video.readyState === video.HAVE_ENOUGH_DATA) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        
                        if (code) {
                            console.log('QR Code detected:', code.data);
                            this.qrCodeData = code.data;
                            this.stopCameraScanning();
                            this.processQRCode();
                            return;
                        }
                    }
                };
                
                // Check for QR codes every 200ms
                this.qrDetectionInterval = setInterval(detectQR, 200);
            }).catch((error) => {
                console.error('Error loading jsQR:', error);
                this.qrLookupError = 'Error loading QR scanner library. Please try manual input or upload.';
                this.stopCameraScanning();
            });
        },
        
        // File upload methods
        handleQRUpload(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.qrUploadFile = {
                    file: file,
                    name: file.name,
                    preview: URL.createObjectURL(file)
                };
            } else {
                this.qrLookupError = 'Please select a valid image file (PNG, JPG, JPEG)';
            }
        },
        
        handleQRDrop(event) {
            event.preventDefault();
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    this.qrUploadFile = {
                        file: file,
                        name: file.name,
                        preview: URL.createObjectURL(file)
                    };
                } else {
                    this.qrLookupError = 'Please select a valid image file (PNG, JPG, JPEG)';
                }
            }
        },
        
        async processUploadedQR() {
            if (!this.qrUploadFile) return;
            
            try {
                this.qrLookupError = '';
                
                // Import jsQR dynamically
                const jsQRModule = await import('jsqr');
                const jsQR = jsQRModule.default;
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    try {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        
                        if (code) {
                            console.log('QR Code found in uploaded image:', code.data);
                            this.qrCodeData = code.data;
                            this.processQRCode();
                        } else {
                            this.qrLookupError = 'No QR code found in the uploaded image. Please upload a clear image with a visible QR code.';
                        }
                    } catch (error) {
                        console.error('Error processing QR image:', error);
                        this.qrLookupError = 'Error processing the uploaded image. Please try again.';
                    }
                };
                
                img.onerror = () => {
                    this.qrLookupError = 'Error loading the uploaded image. Please try a different image.';
                };
                
                img.src = this.qrUploadFile.preview;
                
            } catch (error) {
                console.error('Error processing uploaded QR:', error);
                this.qrLookupError = 'Error loading QR scanner library. Please try manual input.';
            }
        },
        
        async processWalkInRewards() {
            const targetUser = this.selectedRewardMethod === 'user_id' ? this.foundUser : this.qrFoundUser;
            if (!targetUser || !this.selectedOrder) return;
            
            this.processingRewards = true;
            
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/admin/walk-in/process-rewards', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: targetUser.id,
                        orderId: this.selectedOrder.order_id,
                        totalAmount: this.selectedOrder.total_amount
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.successRewardData = {
                        customerName: `${targetUser.firstname} ${targetUser.lastname}`,
                        pointsAwarded: result.pointsAwarded,
                        newTotalPoints: result.newTotalPoints
                    };
                    
                    this.showWalkInRewardsModal = false;
                    this.showWalkInRewardsSuccess = true;
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to process rewards');
                }
            } catch (error) {
                console.error('Error processing walk-in rewards:', error);
                alert('Error processing rewards. Please try again.');
            } finally {
                this.processingRewards = false;
            }
        },
        
        skipWalkInRewards() {
            // Cleanup camera if active
            this.stopCameraScanning();
            
            // Clear upload file and preview
            if (this.qrUploadFile && this.qrUploadFile.preview) {
                URL.revokeObjectURL(this.qrUploadFile.preview);
            }
            this.qrUploadFile = null;
            
            // Reset QR scan method
            this.qrScanMethod = 'manual';
            this.qrCodeData = '';
            this.qrFoundUser = null;
            this.qrLookupError = '';
            
            this.showWalkInRewardsModal = false;
            this.selectedOrder = null;
        },
        
        closeWalkInRewardsSuccess() {
            this.showWalkInRewardsSuccess = false;
            this.selectedOrder = null;
            this.successRewardData = null;
        },
        
        async generateTestQR() {
            if (!this.testUserId) return;
            
            try {
                // Import QRCode dynamically
                const QRCodeModule = await import('qrcode');
                const QRCode = QRCodeModule.default;
                
                // Create QR data that matches the actual format
                const qrData = JSON.stringify({
                    type: "user_identification",
                    userId: parseInt(this.testUserId),
                    username: `TestUser${this.testUserId}`,
                    accountId: `jmg-${this.testUserId}-${Date.now()}`,
                    storeId: "jm-garis-store",
                    version: "1.0",
                    createdAt: new Date().toISOString(),
                    hash: Math.random().toString(36).substring(2, 8)
                });
                
                console.log('Generating QR with data:', qrData);
                
                await this.$nextTick();
                if (this.$refs.qrCanvas) {
                    await QRCode.toCanvas(this.$refs.qrCanvas, qrData, {
                        width: 200,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    this.generatedQR = true;
                }
            } catch (error) {
                console.error('Error generating QR code:', error);
                alert('Error generating QR code: ' + error.message);
            }
        }
    },
    mounted() {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.username = decoded.username;
        }
        this.fetchOrders();
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

.filter-btn.active {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(5, 139, 16, 0.1);
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

/* Payment Modal Styles */
.payment-modal {
    max-width: 480px;
    padding: 0;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
}

.payment-header {
    background: #f8fafc;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.payment-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 1.5rem;
    font-weight: 600;
}

.order-metadata {
    margin-top: 0.5rem;
    display: flex;
    gap: 1rem;
    color: #64748b;
    font-size: 0.875rem;
}

.payment-body {
    padding: 1.5rem;
}

.payment-summary h3,
.payment-calculator h3 {
    margin: 0 0 1rem 0;
    color: #334155;
    font-size: 1.1rem;
    font-weight: 600;
}

.order-items {
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 1.5rem;
}

.order-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f1f5f9;
}

.item-details {
    flex: 1;
    margin-right: 1rem;
}

.item-name {
    display: block;
    color: #334155;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
}

.variant-tag {
    display: inline-block;
    background: #e0f2fe;
    color: #0369a1;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
}

.item-pricing {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #64748b;
    font-size: 0.9rem;
}

.totals-breakdown {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
}

.breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    color: #475569;
    font-size: 0.95rem;
}

.breakdown-row.discount {
    color: #16a34a;
}

.breakdown-row.total {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e2e8f0;
    font-weight: 600;
    color: #1e293b;
    font-size: 1.1rem;
}

.payment-calculator {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
}

.payment-breakdown-info {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
}

.breakdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    font-size: 0.9rem;
    color: #64748b;
}

.breakdown-item.remaining {
    font-weight: 600;
    color: #1e293b;
    border-top: 1px solid #e2e8f0;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
}

.downpayment-breakdown {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    background-color: #f0f9ff;
    padding: 1rem;
    border-radius: 6px;
}

.downpayment-info, .remaining-amount {
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
}

.downpayment-info {
    color: #0369a1;
    font-weight: 500;
}

.remaining-amount {
    color: #dc2626;
    font-weight: 600;
}

.amount-due-note {
    color: #64748b;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    display: block;
}

.calculator-input {
    margin-bottom: 1rem;
}

.calculator-input label {
    display: block;
    margin-bottom: 0.5rem;
    color: #475569;
    font-size: 0.9rem;
    font-weight: 500;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.calculator-input input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
}

.calculator-input input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.currency-symbol {
    position: absolute;
    left: 1rem;
    color: #64748b;
    font-weight: 500;
}

.calculator-result {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f1f5f9;
    border-radius: 8px;
    font-weight: 500;
}

.calculator-result.insufficient {
    background: #fef2f2;
    color: #dc2626;
}

.payment-actions {
    padding: 1.5rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
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
.email-success-modal {
    text-align: center;
    max-width: 400px;
    padding: 2rem;
}

.email-success-icon {
    font-size: 4rem;
    color: #4CAF50;
    margin-bottom: 1rem;
}

.email-success-modal h2 {
    color: #1e293b;
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
}

.email-success-modal p {
    color: #64748b;
    margin-bottom: 1.5rem;
    font-size: 1rem;
    line-height: 1.6;
}

.customer-email {
    font-weight: 600;
    color: #3b82f6;
}

.email-success-modal .close-btn {
    margin: 0 auto;
}
@media (max-width: 768px) {
    .sort-filter {
        width: 100%;
    }
    
    .sort-select {
        width: 100%;
    }
    .admin-container {
        padding-left: 60px;
    }

    .admin-content {
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

/* Walk-in Rewards Modal Styles */
.walkin-rewards-modal {
    max-width: 600px;
    width: 95%;
}

.walkin-rewards-modal .modal-header {
    text-align: center;
    padding: 2rem 2rem 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.walkin-rewards-modal .modal-header h2 {
    margin: 0 0 0.5rem 0;
    color: #1e293b;
    font-size: 1.5rem;
}

.walkin-rewards-modal .modal-header p {
    margin: 0;
    color: #64748b;
    font-size: 0.95rem;
}

.rewards-info {
    padding: 2rem;
}

.order-summary {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 1px solid #e2e8f0;
}

.order-summary h3 {
    margin: 0 0 1rem 0;
    color: #1e293b;
    font-size: 1.1rem;
}

.order-summary p {
    margin: 0.5rem 0;
    color: #475569;
}

.reward-method-selection h3 {
    margin: 0 0 1.5rem 0;
    color: #1e293b;
    font-size: 1.1rem;
}

.method-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
}

.method-option {
    cursor: pointer;
}

.method-option input[type="radio"] {
    display: none;
}

.method-card {
    padding: 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    text-align: center;
    transition: all 0.3s ease;
    background: white;
}

.method-card:hover {
    border-color: #3b82f6;
    background: #f8fafc;
}

.method-option input[type="radio"]:checked + .method-card {
    border-color: #10b981;
    background: #f0fdf4;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.method-card i {
    font-size: 2rem;
    color: #64748b;
    margin-bottom: 0.75rem;
    transition: color 0.3s ease;
}

.method-option input[type="radio"]:checked + .method-card i {
    color: #10b981;
}

.method-card span {
    display: block;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}

.method-card small {
    color: #64748b;
    font-size: 0.875rem;
}

.user-id-section,
.qr-code-section {
    margin-top: 1.5rem;
}

.input-group {
    display: flex;
    gap: 1rem;
    align-items: end;
    margin-bottom: 1rem;
}

.input-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
    font-size: 0.875rem;
}

.user-id-input,
.qr-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.user-id-input:focus,
.qr-input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.lookup-btn {
    padding: 0.75rem 1.5rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
}

.lookup-btn:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
}

.lookup-btn:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
}

.user-preview {
    margin-top: 1rem;
    padding: 1rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.user-info i {
    font-size: 2rem;
    color: #10b981;
}

.user-details h4 {
    margin: 0 0 0.25rem 0;
    color: #1e293b;
    font-size: 1.1rem;
}

.user-details p {
    margin: 0.125rem 0;
    color: #475569;
    font-size: 0.875rem;
}

.error-message {
    margin-top: 1rem;
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.qr-scanner-container {
    text-align: center;
}

.qr-scanner-container h4 {
    margin: 0 0 0.5rem 0;
    color: #1e293b;
}

.qr-scanner-container p {
    margin: 0 0 1rem 0;
    color: #64748b;
    font-size: 0.875rem;
}

.scanner-placeholder {
    padding: 2rem;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    background: #f9fafb;
}

.scanner-placeholder i {
    font-size: 3rem;
    color: #9ca3af;
    margin-bottom: 1rem;
}

.scanner-placeholder p {
    margin: 0.5rem 0;
    color: #6b7280;
}

.manual-qr-input {
    text-align: left;
}

.manual-qr-input label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
    font-size: 0.875rem;
}

/* QR Method Selection */
.qr-method-selection {
    margin-bottom: 1.5rem;
}

.qr-method-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    justify-content: center;
}

.qr-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    background: #f9fafb;
    color: #6b7280;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.qr-tab:hover {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #3b82f6;
}

.qr-tab.active {
    border-color: #3b82f6;
    background: #3b82f6;
    color: white;
}

/* Camera Scanner */
.camera-scanner {
    margin-bottom: 1rem;
}

.camera-placeholder {
    padding: 2rem;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    background: #f9fafb;
    text-align: center;
}

.camera-placeholder i {
    font-size: 3rem;
    color: #9ca3af;
    margin-bottom: 1rem;
}

.start-camera-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin: 1rem auto 0;
    transition: all 0.2s ease;
}

.start-camera-btn:hover {
    background: #2563eb;
}

.camera-view {
    position: relative;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
}

.qr-video {
    width: 100%;
    height: 300px;
    object-fit: cover;
    border-radius: 8px;
    background: #000;
}

.camera-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.scan-area {
    width: 200px;
    height: 200px;
    border: 3px solid #3b82f6;
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.1);
    margin-bottom: 1rem;
}

.camera-overlay p {
    color: white;
    background: rgba(0, 0, 0, 0.7);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    margin: 0;
}

.camera-controls {
    text-align: center;
    margin-top: 1rem;
}

.stop-camera-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin: 0 auto;
    transition: all 0.2s ease;
}

.stop-camera-btn:hover {
    background: #dc2626;
}

/* Upload Scanner */
.upload-scanner {
    margin-bottom: 1rem;
}

.upload-area {
    padding: 2rem;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    background: #f9fafb;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.upload-area:hover {
    border-color: #3b82f6;
    background: #eff6ff;
}

.upload-area i {
    font-size: 3rem;
    color: #9ca3af;
    margin-bottom: 1rem;
}

.upload-hint {
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0.5rem 0 0 0;
}

.upload-preview {
    margin-top: 1rem;
}

.uploaded-image {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
}

.uploaded-image img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
}

.upload-info {
    flex: 1;
    text-align: left;
}

.upload-info p {
    margin: 0 0 0.5rem 0;
    font-weight: 500;
    color: #374151;
}

.process-qr-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

.process-qr-btn:hover {
    background: #059669;
}

/* Manual Scanner */
.manual-scanner {
    margin-bottom: 1rem;
}

.manual-qr-input small {
    display: block;
    margin-top: 0.5rem;
    color: #6b7280;
    font-size: 0.75rem;
}

/* QR Generator Section */
.qr-generator-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.qr-generator-section h4 {
    margin: 0 0 1rem 0;
    color: #374151;
    font-size: 1rem;
}

.generator-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
}

.test-user-input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    width: 150px;
    font-size: 0.875rem;
}

.test-user-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.generate-qr-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background 0.2s;
}

.generate-qr-btn:hover {
    background: #2563eb;
}

.generated-qr {
    text-align: center;
    padding: 1rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
}

.generated-qr canvas {
    display: block;
    margin: 0 auto 1rem;
}

.generated-qr p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
}

.walkin-rewards-modal .modal-actions {
    padding: 1.5rem 2rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.apply-rewards-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.apply-rewards-btn:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
}

.apply-rewards-btn:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
}

.skip-btn {
    background: #6b7280;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.skip-btn:hover {
    background: #4b5563;
    transform: translateY(-1px);
}

/* Rewards Success Modal */
.rewards-success-modal {
    max-width: 450px;
    text-align: center;
    padding: 2rem;
}

.success-icon {
    font-size: 4rem;
    color: #10b981;
    margin-bottom: 1rem;
}

.rewards-success-modal h2 {
    margin: 0 0 1.5rem 0;
    color: #1e293b;
    font-size: 1.5rem;
}

.success-details {
    background: #f0fdf4;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border: 1px solid #bbf7d0;
}

.success-details p {
    margin: 0.5rem 0;
    color: #166534;
    font-size: 0.95rem;
}

.success-message {
    color: #64748b;
    font-size: 0.95rem;
    margin-bottom: 2rem;
}

@media (max-width: 768px) {
    .method-options {
        grid-template-columns: 1fr;
    }
    
    .input-group {
        flex-direction: column;
        align-items: stretch;
    }
    
    .walkin-rewards-modal .modal-actions {
        flex-direction: column;
    }
    
    .apply-rewards-btn,
    .skip-btn {
        width: 100%;
        justify-content: center;
    }
}

.pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 2rem;
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 8px;
}

.pagination-controls {
    display: flex;
    align-items: center;
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
</style>

