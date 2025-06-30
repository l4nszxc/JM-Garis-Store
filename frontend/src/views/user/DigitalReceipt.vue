<template>
  <div class="receipt-container">
    <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="receipt-content">
      <div class="receipt-header-section">
        <h1><i class="fas fa-receipt"></i> Digital Receipt</h1>
        <button @click="goBack" class="back-btn">
          <i class="fas fa-arrow-left"></i> Back to Order History
        </button>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading receipt...</p>
      </div>

      <div v-else-if="order && receiptSettings" class="receipt-wrapper">
        <div class="receipt-preview">
          <div class="preview-content">
            <div class="receipt-header">
              <h4>{{ receiptSettings.storeName || 'JM Garis Store' }}</h4>
              <p v-if="receiptSettings.storeTagline">{{ receiptSettings.storeTagline }}</p>
              <p v-if="receiptSettings.storeAddress">{{ receiptSettings.storeAddress }}</p>
              <p v-if="receiptSettings.contactNumber">Tel: {{ receiptSettings.contactNumber }}</p>
              <div class="receipt-divider"></div>
            </div>
            
            <div class="receipt-sample">
              <div class="receipt-details">
                <p><strong>Order #:</strong> {{ order.order_id }}</p>
                <p><strong>Date:</strong> {{ formatDate(order.created_at) }}</p>
                <p><strong>Customer:</strong> {{ order.customer_name || username }}</p>
              </div>
              
              <div class="receipt-items">
                <div v-for="item in order.items" :key="item.product_id" class="receipt-item">
                  <p>{{ item.choice_name ? `${item.name} (${item.choice_name})` : item.name }}</p>
                  <p>{{ item.quantity }} × {{ formatPrice(item.price) }} = {{ formatPrice(item.price * item.quantity) }}</p>
                </div>
              </div>
              
              <div class="receipt-totals">
                <p>Subtotal: {{ formatPrice(order.subtotal) }}</p>
                <p v-if="order.discount_amount > 0">Discount: -{{ formatPrice(order.discount_amount) }}</p>
                <p><strong>Total: {{ formatPrice(order.total_amount) }}</strong></p>
                
                <div class="receipt-payment" v-if="order.cash_amount">
                  <p>Cash: {{ formatPrice(order.cash_amount) }}</p>
                  <p>Change: {{ formatPrice(order.change_amount || 0) }}</p>
                </div>
              </div>
              
              <div class="receipt-footer">
                <p>{{ formatThankYouMessage(receiptSettings.thankyouMessage) }}</p>
                <p v-if="receiptSettings.footerText">{{ receiptSettings.footerText }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="receipt-actions">
          <button @click="downloadReceipt" class="download-btn">
            <i class="fas fa-download"></i> Download Receipt
          </button>
        </div>
      </div>

      <div v-else class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Unable to load receipt. Please try again later.</p>
        <button @click="goBack" class="back-btn">
          <i class="fas fa-arrow-left"></i> Go Back
        </button>
      </div>
    </div>

    <LogoutModal 
      :show="showLogoutModal"
      @confirm="handleLogout"
      @cancel="showLogoutModal = false"
    />
  </div>
</template>

<script>
import Navbar from '../../components/Navbar.vue'
import LogoutModal from '../../components/LogoutModal.vue'

export default {
  name: 'DigitalReceipt',
  components: {
    Navbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      loading: true,
      order: null,
      receiptSettings: null
    }
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price).replace('PHP', '₱');
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    formatThankYouMessage(message) {
      if (!message) return 'Thank you for your purchase!';
      return message.replace(/\n/g, '\n');
    },

    goBack() {
      this.$router.push('/order-history');
    },

    async fetchOrderDetails() {
      try {
        const token = localStorage.getItem('token');
        const orderId = this.$route.params.orderId;
        
        // Use the same endpoint pattern as other components - fetch all orders and filter
        const response = await fetch('http://localhost:7904/api/orders/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const orders = await response.json();
          const foundOrder = orders.find(order => order.order_id.toString() === orderId.toString());
          
          if (foundOrder) {
            this.order = {
              ...foundOrder,
              subtotal: foundOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            };
          } else {
            throw new Error('Order not found');
          }
        } else {
          throw new Error('Failed to fetch order details');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        this.order = null;
      }
    },

    async fetchReceiptSettings() {
        try {
            // Fix: Change the endpoint URL to match the actual route
            const response = await fetch('http://localhost:7904/api/admin/receipt-settings/public');
            
            if (response.ok) {
            const data = await response.json();
            this.receiptSettings = data;
            } else {
            throw new Error('Failed to fetch receipt settings');
            }
        } catch (error) {
            console.error('Error fetching receipt settings:', error);
            // Use default settings on error
            this.receiptSettings = {
            storeName: 'JM Garis Store',
            storeTagline: 'Official Receipt',
            storeAddress: '',
            contactNumber: '',
            thankyouMessage: 'Thank you for your purchase!\nPlease come again!',
            footerText: ''
            };
        }
        },

    downloadReceipt() {
      if (!this.order || !this.receiptSettings) return;

      const receiptContent = this.generateReceiptHTML();
      
      // Create a blob with the HTML content
      const blob = new Blob([receiptContent], { type: 'text/html' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt_Order_${this.order.order_id}.html`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },

    generateReceiptHTML() {
      const items = this.order.items.map(item => {
        const displayName = item.choice_name 
          ? `${item.name} (${item.choice_name})`
          : item.name;
          
        return `
          <div class="receipt-item">
            <div class="item-name">${displayName}</div>
            <div class="item-calculation">${item.quantity} × ${this.formatPrice(item.price)} = ${this.formatPrice(item.price * item.quantity)}</div>
          </div>
        `;
      }).join('');

      const thankyouMessage = this.receiptSettings.thankyouMessage
        ? this.receiptSettings.thankyouMessage.replace(/\n/g, '<br>')
        : 'Thank you for your purchase!<br>Please come again!';

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt - Order #${this.order.order_id}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              max-width: 400px;
              margin: 20px auto;
              padding: 20px;
              background-color: #f5f5f5;
              color: #333;
              line-height: 1.4;
            }
            
            .receipt-container {
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .receipt-header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px dashed #ccc;
            }
            
            .receipt-header h1 {
              margin: 0 0 8px 0;
              font-size: 24px;
              font-weight: bold;
              color: #2c3e50;
            }
            
            .receipt-header p {
              margin: 4px 0;
              font-size: 14px;
              color: #666;
            }
            
            .receipt-details {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 1px solid #eee;
            }
            
            .receipt-details p {
              margin: 8px 0;
              font-size: 14px;
            }
            
            .receipt-items {
              margin-bottom: 20px;
            }
            
            .receipt-item {
              border-bottom: 1px dotted #ddd;
              padding: 12px 0;
            }
            
            .item-name {
              font-weight: 500;
              margin-bottom: 4px;
              font-size: 14px;
            }
            
            .item-calculation {
              text-align: right;
              color: #666;
              font-size: 13px;
            }
            
            .receipt-totals {
              margin-top: 25px;
              text-align: right;
              border-top: 2px solid #333;
              padding-top: 15px;
            }
            
            .receipt-totals p {
              margin: 8px 0;
              font-size: 14px;
            }
            
            .receipt-total {
              font-size: 18px !important;
              font-weight: bold !important;
              margin-top: 15px !important;
              color: #2c3e50;
            }
            
            .receipt-payment {
              margin-top: 15px;
              padding-top: 12px;
              border-top: 1px dashed #ccc;
            }
            
            .receipt-footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px dashed #ccc;
              font-size: 13px;
              line-height: 1.6;
            }
            
            .receipt-footer p {
              margin: 8px 0;
              color: #666;
            }
            
            .store-info {
              font-size: 12px;
              color: #888;
              margin-top: 15px;
            }
            
            @media print {
              body { 
                background-color: white;
                margin: 0;
                padding: 10px;
              }
              .receipt-container {
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h1>${this.receiptSettings.storeName}</h1>
              ${this.receiptSettings.storeTagline ? `<p>${this.receiptSettings.storeTagline}</p>` : ''}
              ${this.receiptSettings.storeAddress ? `<p>${this.receiptSettings.storeAddress}</p>` : ''}
              ${this.receiptSettings.contactNumber ? `<p>Tel: ${this.receiptSettings.contactNumber}</p>` : ''}
            </div>
            
            <div class="receipt-details">
              <p><strong>Order #:</strong> ${this.order.order_id}</p>
              <p><strong>Date:</strong> ${this.formatDate(this.order.created_at)}</p>
              <p><strong>Customer:</strong> ${this.order.customer_name || this.username}</p>
            </div>
            
            <div class="receipt-items">
              ${items}
            </div>
            
            <div class="receipt-totals">
              <p>Subtotal: ${this.formatPrice(this.order.subtotal)}</p>
              ${this.order.discount_amount > 0 ? `<p>Discount: -${this.formatPrice(this.order.discount_amount)}</p>` : ''}
              <p class="receipt-total">Total: ${this.formatPrice(this.order.total_amount)}</p>
              
              ${this.order.cash_amount ? `
                <div class="receipt-payment">
                  <p>Cash: ${this.formatPrice(this.order.cash_amount)}</p>
                  <p>Change: ${this.formatPrice(this.order.change_amount || 0)}</p>
                </div>
              ` : ''}
            </div>
            
            <div class="receipt-footer">
              <p>${thankyouMessage}</p>
              ${this.receiptSettings.footerText ? `<p class="store-info">${this.receiptSettings.footerText}</p>` : ''}
              <p class="store-info">Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;
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
        console.error('Error during logout:', error);
      } finally {
        this.showLogoutModal = false;
      }
    }
  },

  async mounted() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username;
    }

    // Check if order ID exists
    const orderId = this.$route.params.orderId;
    if (!orderId) {
      this.$router.push('/order-history');
      return;
    }

    // Fetch data
    await Promise.all([
      this.fetchOrderDetails(),
      this.fetchReceiptSettings()
    ]);

    // Check if order was found and is paid
    if (!this.order) {
      this.$router.push('/order-history');
      return;
    }

    if (this.order.status !== 'paid') {
      this.$router.push('/order-history');
      return;
    }

    this.loading = false;
  }
}
</script>

<style scoped>
.receipt-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.receipt-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.receipt-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.receipt-header-section h1 {
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
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

.back-btn:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.loading-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.receipt-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.receipt-preview {
  padding: 2rem;
}

.preview-content {
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 2rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.95rem;
  max-width: 400px;
  margin: 0 auto;
}

.receipt-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.receipt-header h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  font-weight: bold;
}

.receipt-header p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.receipt-divider {
  border-bottom: 1px dashed #ccc;
  margin: 1rem 0;
}

.receipt-details {
  margin-bottom: 1.5rem;
}

.receipt-details p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.receipt-items {
  margin-bottom: 1.5rem;
}

.receipt-item {
  border-bottom: 1px dotted #eee;
  padding: 0.75rem 0;
}

.receipt-item p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.receipt-item p:first-child {
  font-weight: 500;
}

.receipt-item p:last-child {
  text-align: right;
  color: #666;
}

.receipt-totals {
  margin-top: 1.5rem;
  text-align: right;
  border-top: 1px dashed #ccc;
  padding-top: 1rem;
}

.receipt-totals p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.receipt-totals p:last-of-type {
  font-size: 1.1rem;
  font-weight: bold;
  margin-top: 1rem;
}

.receipt-payment {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #ccc;
}

.receipt-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px dashed #ccc;
  white-space: pre-line;
}

.receipt-footer p {
  margin: 0.5rem 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.receipt-actions {
  padding: 1.5rem 2rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.download-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.download-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.error-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-container i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-container p {
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .receipt-content {
    padding: 1rem;
  }

  .receipt-header-section {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .receipt-header-section h1 {
    font-size: 1.5rem;
  }

  .preview-content {
    padding: 1.5rem;
    font-size: 0.9rem;
  }

  .receipt-actions {
    padding: 1rem;
  }
}
</style>