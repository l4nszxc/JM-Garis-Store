<template>
    <div class="admin-container">
        <AdminNavbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="admin-content">
            <div class="header">
                <h2>ALL ORDERS</h2>
                <div class="filters">
                    <div class="search-box">
                        <input 
                            type="text" 
                            v-model="searchQuery" 
                            placeholder="Search by order ID or customer name..."
                        >
                    </div>
                    <select v-model="selectedStatus" class="status-filter">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready for pickup">Ready for Pickup</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
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
                        <tr v-for="order in filteredOrders" :key="order.order_id">
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
                                <span v-if="order.staff_name" class="staff-badge">
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
                    </tbody>
                </table>
                <div v-if="filteredOrders.length === 0" class="no-results">
                    No orders found matching your search criteria
                </div>
            </div>
        </div>

        <div v-if="selectedOrder" class="modal-overlay">
        <div class="modal-content">
            <h2>Order Details</h2>
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

                <!-- Add price breakdown -->
                <div class="price-breakdown">
                    <p class="subtotal">
                        <i class="fas fa-receipt"></i> Subtotal: {{ formatPrice(selectedOrder.subtotal) }}
                    </p>
                    <p v-if="selectedOrder.discount_amount > 0" class="discount-amount">
                        <i class="fas fa-tag"></i> Discount: -{{ formatPrice(selectedOrder.discount_amount) }}
                    </p>
                    <p class="total-amount">
                        <i class="fas fa-peso-sign"></i> Total: {{ formatPrice(selectedOrder.total_amount) }}
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

        <!-- Logout Modal -->
        <LogoutModal 
            :show="showLogoutModal"
            @confirm="handleLogout"
            @cancel="showLogoutModal = false"
        />
    </div>

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
                class="confirm-btn"
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
            selectedStatus: '',
            showPaymentConfirmation: false,
            cashAmount: '',
            changeAmount: 0,
        }
    },
    computed: {
        isInsufficientCash() {
            return this.cashAmount < this.selectedOrder?.total_amount;
        },
        filteredOrders() {
            return this.orders.filter(order => {
                const matchesSearch = !this.searchQuery || 
                    order.order_id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    order.customer_name.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesStatus = !this.selectedStatus || 
                    order.status.toLowerCase() === this.selectedStatus.toLowerCase();
                
                return matchesSearch && matchesStatus;
            });
        }
    },
    methods: {
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
/* Replace entire style section with this updated version */
.admin-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px;
}

.admin-content {
    padding: 2rem;
    margin: 0 auto;
}

/* Header and Filters */
.header {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.header h2 {
    color: #2c3e50;
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
}

.filters {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.search-box {
    flex: 1;
}
.products-table {
    margin-top: 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow-x: auto;
    max-height: 400px; /* Fixed height for scrolling */
    overflow-y: auto;
}

.products-table table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}

.products-table thead {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f8fafc;
}

.products-table th {
    background-color: #f8fafc;
    padding: 1rem;
    font-weight: 600;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
}

.products-table td {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
}
.ready-for-pickup {
    background-color: #d4edda;
    color: #155724;
}
.products-table tfoot {
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 2px solid #e2e8f0;
}

.products-table tfoot td {
    padding: 1rem;
    background: white;
}
.search-box input {
    width: 98%;
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

.search-box input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.status-filter {
    width: 20%;
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
    background-color: white;
    cursor: pointer;
}

/* Table Styles */
.table-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: auto;
    max-height: calc(100vh - 200px);
}

table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}

thead {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f8fafc;
}

th {
    background-color: #f8fafc;
    font-weight: 600;
    color: #475569;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 1rem;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
}

td {
    padding: 1rem;
    color: #1e293b;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.95rem;
}

tbody tr:hover {
    background-color: #f8fafc;
}

/* Status Badges */
.status-badge {
    display: inline-block;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
}

.pending {
    background-color: #fff3cd;
    color: #856404;
}

.preparing {
    background-color: #cce5ff;
    color: #004085;
}

.paid {
    background-color: #d1e7dd;
    color: #0f5132;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.paid i {
    font-size: 0.875rem;
}

.cancelled {
    background-color: #f8d7da;
    color: #842029;
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
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    background: white;
    border-radius: 12px;
    padding: 2rem;
    width: 90%;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
}

.order-info {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.order-info p {
    margin: 0.5rem 0;
}

.product-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
}

/* Buttons */
.view-btn {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    transition: all 0.2s;
}

.view-btn:hover {
    background-color: #2563eb;
}

.close-btn {
    padding: 0.75rem 1.5rem;
    background-color: #6b7280;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.close-btn:hover {
    background-color: #4b5563;
}

/* No Results Message */
.no-results {
    padding: 3rem;
    text-align: center;
    color: #6b7280;
    font-size: 1rem;
}
.modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
}

.pay-btn {
    padding: 0.75rem 1.5rem;
    background-color: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-right: 1rem;
    transition: all 0.2s;
}

.pay-btn:hover {
    background-color: #059669;
}

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
.payment-details {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed black;
    font-size: 13px;
    line-height: 1.5;
}
.payment-items {
    max-height: 300px;
    overflow-y: auto;
    margin: 1rem 0;
}
.order-metadata {
    margin-top: 0.5rem;
    display: flex;
    gap: 1rem;
    color: #64748b;
    font-size: 0.875rem;
}
.order-items {
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 1.5rem;
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
.order-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f1f5f9;
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

.currency-symbol {
    position: absolute;
    left: 1rem;
    color: #64748b;
    font-weight: 500;
}
.breakdown-row.total {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e2e8f0;
    font-weight: 600;
    color: #1e293b;
    font-size: 1.1rem;
}
.order-id {
    font-weight: 500;
}
.payment-summary h3,
.payment-calculator h3 {
    margin: 0 0 1rem 0;
    color: #334155;
    font-size: 1.1rem;
    font-weight: 600;
}
.payment-body {
    padding: 1.5rem;
}
.payment-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 1.5rem;
    font-weight: 600;
}
.payment-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e2e8f0;
    align-items: center;
}
.payment-item-name {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-width: 60%;
}
.choice-pill {
    background-color: #eef6fd;
    color: #3498db;
    padding: 0.2rem 0.5rem;
    border-radius: 20px;
    font-size: 0.75rem;
    width: fit-content;
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
.subtotal-label, .discount-label, .total-label {
    text-align: right;
    font-weight: 600;
}

.discount-label {
    color: #4CAF50;
}


.discount-amount {
    color: #4CAF50;
    font-weight: 500;
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
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.confirm-pay-btn {
    padding: 0.75rem 1.5rem;
    background-color: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-right: 1rem;
}

.confirm-pay-btn:hover {
    background-color: #059669;
}
.cash-calculator {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
}

.cash-input {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.cash-input label {
    min-width: 100px;
    color: #2c3e50;
    font-weight: 500;
}

.cash-input input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.cash-input input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.change-amount {
    font-size: 1.1rem;
    font-weight: 600;
}
.payment-actions {
    padding: 1.5rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}
.change-amount.insufficient {
    background-color: #fee2e2;
    color: #dc2626;
}
.confirm-btn, .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}
.confirm-btn {
    background: #16a34a;
    color: white;
}

.confirm-btn:hover {
    background: #15803d;
}

.confirm-btn:disabled {
    background: #94a3b8;
    cursor: not-allowed;
}

.cancel-btn {
    background-color: #6b7280;
    color: white;
}

.cancel-btn:hover {
    background: #4b5563;
}
.confirm-pay-btn:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
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
/* Responsive Styles */
@media (max-width: 1200px) {
    .admin-content {
        padding: 1.5rem;
    }
    
    td, th {
        padding: 0.75rem;
    }
}

@media (max-width: 1024px) {
    .filters {
        flex-direction: column;
    }

    .search-box,
    .status-filter {
        width: 100%;
    }

    .table-container {
        overflow-x: auto;
    }

    table {
        min-width: 900px;
    }
}

@media (max-width: 768px) {
    .admin-container {
        padding-left: 60px;
    }

    .header {
        padding: 1rem;
    }

    .header h2 {
        font-size: 1.25rem;
    }

    .modal-content {
        width: 95%;
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .admin-content {
        padding: 1rem;
    }

    .header {
        margin-bottom: 1rem;
    }

    .table-container {
        border-radius: 8px;
    }

    th {
        font-size: 0.8rem;
    }

    td {
        font-size: 0.85rem;
    }
}

</style>