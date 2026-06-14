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
        
        const response = await this.$fetch('/api/orders/history', {
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
            const response = await this.$fetch('/api/admin/receipt-settings/public');
            
            if (response.ok) {
            const data = await response.json();
            this.receiptSettings = data;
            } else {
            throw new Error('Failed to fetch receipt settings');
            }
        } catch (error) {
            console.error('Error fetching receipt settings:', error);
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

    async downloadReceipt() {
      if (!this.order || !this.receiptSettings) return;

      try {
        // Use the existing visible receipt preview instead of generating new HTML
        const receiptPreview = document.querySelector('.preview-content');
        
        if (!receiptPreview) {
          throw new Error('Receipt preview not found');
        }

        // Import html2canvas dynamically
        const html2canvas = await import('html2canvas');
        
        // Add temporary styling to ensure proper rendering
        const originalStyles = {
          position: receiptPreview.style.position,
          visibility: receiptPreview.style.visibility,
          opacity: receiptPreview.style.opacity
        };

        // Ensure the element is visible and properly positioned
        receiptPreview.style.position = 'relative';
        receiptPreview.style.visibility = 'visible';
        receiptPreview.style.opacity = '1';

        // Wait for any pending DOM updates
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas.default(receiptPreview, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          width: receiptPreview.offsetWidth,
          height: receiptPreview.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
        });

        // Restore original styles
        Object.keys(originalStyles).forEach(key => {
          if (originalStyles[key]) {
            receiptPreview.style[key] = originalStyles[key];
          } else {
            receiptPreview.style.removeProperty(key);
          }
        });

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Receipt_Order_${this.order.order_id}.png`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
          } else {
            throw new Error('Generated image is empty');
          }
        }, 'image/png', 1.0);

      } catch (error) {
        console.error('Error generating receipt image:', error);
        
        // Alternative approach using a canvas-based receipt
        try {
          await this.generateCanvasReceipt();
        } catch (fallbackError) {
          console.error('Canvas fallback also failed:', fallbackError);
          alert('Failed to generate receipt image. Please try taking a screenshot instead.');
        }
      }
    },
    async downloadReceiptFallback() {
      // Fallback method using a visible element
      const existingPreview = document.querySelector('.preview-content');
      if (!existingPreview) {
        throw new Error('No preview element found');
      }

      const html2canvas = await import('html2canvas');
      
      const canvas = await html2canvas.default(existingPreview, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Receipt_Order_${this.order.order_id}.png`;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);
    },
    async generateCanvasReceipt() {
      // Create a canvas-based receipt as ultimate fallback
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 400;
      canvas.height = 600; // Will adjust based on content
      
      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set font and colors
      ctx.fillStyle = '#333333';
      ctx.font = '16px Courier New, monospace';
      ctx.textAlign = 'center';
      
      let y = 30;
      const lineHeight = 20;
      const margin = 20;
      
      // Store name
      ctx.font = 'bold 20px Courier New, monospace';
      ctx.fillText(this.receiptSettings.storeName, canvas.width / 2, y);
      y += lineHeight + 5;
      
      // Store tagline
      if (this.receiptSettings.storeTagline) {
        ctx.font = '14px Courier New, monospace';
        ctx.fillText(this.receiptSettings.storeTagline, canvas.width / 2, y);
        y += lineHeight;
      }
      
      // Store address
      if (this.receiptSettings.storeAddress) {
        ctx.fillText(this.receiptSettings.storeAddress, canvas.width / 2, y);
        y += lineHeight;
      }
      
      // Contact number
      if (this.receiptSettings.contactNumber) {
        ctx.fillText(`Tel: ${this.receiptSettings.contactNumber}`, canvas.width / 2, y);
        y += lineHeight;
      }
      
      // Divider
      y += 10;
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(margin, y);
      ctx.lineTo(canvas.width - margin, y);
      ctx.stroke();
      y += 20;
      
      // Order details
      ctx.textAlign = 'left';
      ctx.font = '14px Courier New, monospace';
      ctx.fillText(`Order #: ${this.order.order_id}`, margin, y);
      y += lineHeight;
      ctx.fillText(`Date: ${this.formatDate(this.order.created_at)}`, margin, y);
      y += lineHeight;
      ctx.fillText(`Customer: ${this.order.customer_name || this.username}`, margin, y);
      y += lineHeight + 10;
      
      // Items
      this.order.items.forEach(item => {
        const displayName = item.choice_name 
          ? `${item.name} (${item.choice_name})`
          : item.name;
        
        ctx.fillText(displayName, margin, y);
        y += lineHeight;
        
        const calculation = `${item.quantity} × ${this.formatPrice(item.price)} = ${this.formatPrice(item.price * item.quantity)}`;
        ctx.textAlign = 'right';
        ctx.fillText(calculation, canvas.width - margin, y);
        ctx.textAlign = 'left';
        y += lineHeight + 5;
      });
      
      // Totals
      y += 10;
      ctx.textAlign = 'right';
      ctx.fillText(`Subtotal: ${this.formatPrice(this.order.subtotal)}`, canvas.width - margin, y);
      y += lineHeight;
      
      if (this.order.discount_amount > 0) {
        ctx.fillText(`Discount: -${this.formatPrice(this.order.discount_amount)}`, canvas.width - margin, y);
        y += lineHeight;
      }
      
      ctx.font = 'bold 16px Courier New, monospace';
      ctx.fillText(`Total: ${this.formatPrice(this.order.total_amount)}`, canvas.width - margin, y);
      y += lineHeight + 10;
      
      // Payment info
      if (this.order.cash_amount) {
        ctx.font = '14px Courier New, monospace';
        ctx.fillText(`Cash: ${this.formatPrice(this.order.cash_amount)}`, canvas.width - margin, y);
        y += lineHeight;
        ctx.fillText(`Change: ${this.formatPrice(this.order.change_amount || 0)}`, canvas.width - margin, y);
        y += lineHeight;
      }
      
      // Thank you message
      y += 20;
      ctx.textAlign = 'center';
      ctx.font = '12px Courier New, monospace';
      const thankYouLines = this.receiptSettings.thankyouMessage.split('\n');
      thankYouLines.forEach(line => {
        ctx.fillText(line, canvas.width / 2, y);
        y += lineHeight;
      });
      
      // Footer
      if (this.receiptSettings.footerText) {
        y += 10;
        ctx.fillText(this.receiptSettings.footerText, canvas.width / 2, y);
        y += lineHeight;
      }
      
      // Generated timestamp
      y += 10;
      ctx.fillText(`Generated on: ${new Date().toLocaleString()}`, canvas.width / 2, y);
      
      // Adjust canvas height to fit content
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      finalCanvas.width = canvas.width;
      finalCanvas.height = y + 30;
      
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      finalCtx.drawImage(canvas, 0, 0);
      
      // Download the canvas as image
      finalCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Receipt_Order_${this.order.order_id}.png`;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);
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

    const orderId = this.$route.params.orderId;
    if (!orderId) {
      this.$router.push('/order-history');
      return;
    }

    await Promise.all([
      this.fetchOrderDetails(),
      this.fetchReceiptSettings()
    ]);

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

