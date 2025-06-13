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
                                        <template v-if="order.status === 'paid'">
                                            <i class="fas fa-check-circle"></i>
                                        </template>
                                        {{ order.status }}
                                    </span>
                                </td>
                                <td>{{ formatPrice(order.total_amount) }}</td>
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
                                <td colspan="7" class="no-data">
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
                            <span :class="['status-badge', selectedOrder.status.toLowerCase().replace(/ /g, '-')]">
                                {{ selectedOrder.status }}
                            </span>
                        </p>
                        <p><strong>Order Date:</strong> {{ formatDate(selectedOrder.created_at) }}</p>
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
                                    <td colspan="4" class="total-label">Total Amount:</td>
                                    <td class="total-amount">{{ formatPrice(selectedOrder.total_amount) }}</td>
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
                        <div class="calculator-input">
                            <label for="cashAmount">Cash Amount</label>
                            <div class="input-wrapper">
                                <span class="currency-symbol">₱</span>
                                <input 
                                    type="number" 
                                    id="cashAmount" 
                                    v-model="cashAmount"
                                    @input="calculateChange"
                                    :min="selectedOrder.total_amount"
                                    step="0.01"
                                    placeholder="Enter amount"
                                >
                            </div>
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
        }
    },
    computed: {
        isInsufficientCash() {
            return this.cashAmount < this.selectedOrder?.total_amount;
        },
        hasActiveFilters() {
            return this.searchQuery !== '' || 
                  this.dateFilter !== '' || 
                  this.selectedStatus !== this.defaultStatusFilter ||
                  this.sortOption !== this.defaultSortOption;
        },
        filteredOrders() {
            // First filter the orders based on existing criteria
            let filtered = this.orders.filter(order => {
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
        }
    },
    methods: {
        resetFilters() {
            this.searchQuery = '';
            this.dateFilter = '';
            this.selectedStatus = this.defaultStatusFilter;
            this.sortOption = this.defaultSortOption;
        },
        calculateChange() {
            if (!this.cashAmount || !this.selectedOrder) {
                this.changeAmount = 0;
                return;
            }
            this.changeAmount = parseFloat(this.cashAmount) - this.selectedOrder.total_amount;
        },
        async processPayment() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:7904/api/admin/orders/${this.selectedOrder.order_id}/pay`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cashAmount: parseFloat(this.cashAmount),
                        changeAmount: this.changeAmount
                    })
                });

                if (response.ok) {
                    // Print first, then update UI
                    this.printReceipt();
                    await this.fetchOrders();
                    this.showPaymentConfirmation = false;
                    this.selectedOrder = null;
                } else {
                    throw new Error('Failed to process payment');
                }
            } catch (error) {
                console.error('Error processing payment:', error);
            }
        },
        printReceipt() {
            try {
                const receipt = this.generateReceiptContent();
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
        generateReceiptContent() {
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

            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title></title>
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
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>JM Garis Store</h2>
                        <p>Official Receipt</p>
                    </div>
                    
                    <div class="details">
                        <p><strong>Order #:</strong> ${this.selectedOrder.order_id}</p>
                        <p><strong>Date:</strong> ${date}</p>
                        <p><strong>Customer:</strong> ${this.selectedOrder.customer_name}</p>
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
                        <div class="payment-details">
                            Cash Amount: ${this.formatPrice(this.cashAmount)}
                            <br>
                            Change: ${this.formatPrice(this.changeAmount)}
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Thank you for your purchase!</p>
                        <p>Please come again!</p>
                    </div>
                    
                    <div class="cut-line">
                        --------------------------------
                    </div>
                </body>
                </html>
            `;
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
        handleImageError(e) {
            e.target.src = '/img/placeholder.jpg';
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
        async fetchOrders() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/admin/orders', {
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
                const response = await fetch(`http://localhost:7904/api/admin/orders/${order.order_id}`, {
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
                        discount_amount: parseFloat(orderData.discount_amount) || 0
                    };
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
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

.pending {
    background-color: #fef3c7;
    color: #92400e;
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
</style>