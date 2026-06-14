<template>
  <div class="admin-container">
    <AdminNavbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="admin-content">
      <h1><i class="fas fa-receipt"></i> Receipt Settings</h1>
      
      <div class="settings-card">
        <div class="settings-header">
          <h2>Receipt Information</h2>
          <p>Customize the details that appear on printed receipts.</p>
        </div>

        <form @submit.prevent="saveSettings" class="settings-form">
          <div v-if="successMessage" class="success-message">
            <i class="fas fa-check-circle"></i> {{ successMessage }}
          </div>
          
          <div v-if="errorMessage" class="error-message">
            <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
          </div>
          
          <div class="form-group">
            <label for="storeName">Store Name</label>
            <input 
              type="text" 
              id="storeName" 
              v-model="settings.storeName" 
              placeholder="Store Name"
              required
            />
          </div>

          <div class="form-group">
            <label for="storeTagline">Store Tagline</label>
            <input 
              type="text" 
              id="storeTagline" 
              v-model="settings.storeTagline" 
              placeholder="Store Tagline or Slogan"
            />
          </div>
          
          <div class="form-group">
            <label for="storeAddress">Store Address</label>
            <textarea 
              id="storeAddress" 
              v-model="settings.storeAddress" 
              placeholder="Store Address"
              rows="2"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="contactNumber">Contact Number</label>
            <input 
              type="text" 
              id="contactNumber" 
              v-model="settings.contactNumber" 
              placeholder="Contact Number"
            />
          </div>
          
          <div class="form-group">
            <label for="thankyouMessage">Thank You Message</label>
            <textarea 
              id="thankyouMessage" 
              v-model="settings.thankyouMessage" 
              placeholder="Thank You Message"
              rows="2"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="footerText">Footer Text</label>
            <input 
              type="text" 
              id="footerText" 
              v-model="settings.footerText" 
              placeholder="Footer Text"
            />
          </div>

          <div class="receipt-preview">
            <h3>Receipt Preview</h3>
            <div class="preview-content">
              <div class="receipt-header">
                <h4>{{ settings.storeName || 'JM Garis Store' }}</h4>
                <p v-if="settings.storeTagline">{{ settings.storeTagline }}</p>
                <p v-if="settings.storeAddress">{{ settings.storeAddress }}</p>
                <p v-if="settings.contactNumber">Tel: {{ settings.contactNumber }}</p>
                <div class="receipt-divider"></div>
              </div>
              
              <div class="receipt-sample">
                <div class="receipt-details">
                  <p><strong>Order #:</strong> 0000001</p>
                  <p><strong>Date:</strong> {{ currentDate }}</p>
                  <p><strong>Customer:</strong> Sample Customer</p>
                </div>
                
                <div class="receipt-items">
                  <div class="receipt-item">
                    <p>Sample Product</p>
                    <p>1 × ₱100.00 = ₱100.00</p>
                  </div>
                </div>
                
                <div class="receipt-totals">
                  <p>Subtotal: ₱100.00</p>
                  <p v-if="showDiscount">Discount: -₱10.00</p>
                  <p><strong>Total: ₱90.00</strong></p>
                  
                  <div class="receipt-payment">
                    <p>Cash: ₱100.00</p>
                    <p>Change: ₱10.00</p>
                  </div>
                </div>
                
                <div class="receipt-footer">
                  <p>{{ settings.thankyouMessage || 'Thank you for your purchase!' }}</p>
                  <p v-if="settings.footerText">{{ settings.footerText }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <label class="show-discount-toggle">
              <input type="checkbox" v-model="showDiscount">
              <span>Show sample discount in preview</span>
            </label>
            
            <div>
              <button type="button" @click="resetToDefaults" class="reset-btn">
                <i class="fas fa-undo"></i> Reset to Defaults
              </button>
              
              <button type="submit" class="save-btn" :disabled="isSaving">
                <i class="fas fa-save"></i> {{ isSaving ? 'Saving...' : 'Save Settings' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Confirmation Modal for Reset -->
    <div v-if="showResetModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Reset Receipt Settings</h3>
        <p>Are you sure you want to reset all receipt settings to default? This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="confirmReset" class="confirm-btn">Yes, Reset Settings</button>
          <button @click="showResetModal = false" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
    
    <!-- Toast Notification -->
    <div v-if="notification.show" class="toast-notification" :class="notification.type">
      <i :class="notification.icon"></i>
      <span>{{ notification.message }}</span>
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
  name: 'ReceiptSettings',
  components: {
    AdminNavbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      showResetModal: false,
      isSaving: false,
      successMessage: '',
      errorMessage: '',
      showDiscount: true,
      settings: {
        storeName: 'JM Garis Store',
        storeTagline: 'Official Receipt',
        storeAddress: '',
        contactNumber: '',
        thankyouMessage: 'Thank you for your purchase!\nPlease come again!',
        footerText: ''
      },
      defaultSettings: {
        storeName: 'JM Garis Store',
        storeTagline: 'Official Receipt',
        storeAddress: '',
        contactNumber: '',
        thankyouMessage: 'Thank you for your purchase!\nPlease come again!',
        footerText: ''
      },
      notification: {
        show: false,
        message: '',
        type: 'success',
        icon: 'fas fa-check-circle'
      }
    }
  },
  computed: {
    currentDate() {
      return new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },
  methods: {
    showToast(message, type = 'success') {
      // Set icon based on notification type
      let icon = 'fas fa-check-circle';
      if (type === 'error') {
        icon = 'fas fa-exclamation-circle';
      } else if (type === 'info') {
        icon = 'fas fa-info-circle';
      } else if (type === 'warning') {
        icon = 'fas fa-exclamation-triangle';
      }

      // Set notification data
      this.notification = {
        show: true,
        message,
        type,
        icon
      };

      // Auto hide after 5 seconds
      setTimeout(() => {
        this.notification.show = false;
      }, 5000);
    },

    async saveSettings() {
      try {
        this.isSaving = true;
        this.successMessage = '';
        this.errorMessage = '';
        
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/admin/receipt-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.settings)
        });
        
        if (response.ok) {
          this.showToast('Receipt settings saved successfully', 'success');
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Error saving receipt settings');
        }
      } catch (error) {
        this.showToast('Failed to save receipt settings', 'error');
        console.error('Error saving receipt settings:', error);
      } finally {
        this.isSaving = false;
      }
    },
    
    resetToDefaults() {
      this.showResetModal = true;
    },
    
    confirmReset() {
      this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
      this.showResetModal = false;
      this.successMessage = 'Receipt settings reset to defaults';
      this.showToast('Receipt settings reset to defaults', 'info');
      setTimeout(() => {
        this.successMessage = '';
      }, 5000);
    },
    
    async fetchSettings() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/admin/receipt-settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Only update settings if we got valid data back
          if (data && Object.keys(data).length > 0) {
            this.settings = { ...this.settings, ...data };
          }
        }
      } catch (error) {
        console.error('Error fetching receipt settings:', error);
      }
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
    }
  },
  mounted() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username;
    }
    this.fetchSettings();
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

.settings-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 2rem;
}

.settings-header {
  margin-bottom: 2rem;
}

.settings-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.settings-header p {
  margin-top: 0.5rem;
  color: #64748b;
}

.settings-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #334155;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.receipt-preview {
  grid-column: 2;
  grid-row: 1 / span 6;
}

.receipt-preview h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.preview-content {
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1.5rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  min-height: 400px;
}

.receipt-header {
  text-align: center;
  margin-bottom: 1rem;
}

.receipt-header h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.receipt-header p {
  margin: 0.25rem 0;
}

.receipt-divider {
  border-bottom: 1px dashed #ccc;
  margin: 1rem 0;
}

.receipt-details {
  margin-bottom: 1rem;
}

.receipt-details p {
  margin: 0.25rem 0;
}

.receipt-items {
  margin-bottom: 1rem;
}

.receipt-item {
  border-bottom: 1px dotted #eee;
  padding: 0.5rem 0;
}

.receipt-item p {
  margin: 0.25rem 0;
}

.receipt-totals {
  margin-top: 1rem;
  text-align: right;
}

.receipt-totals p {
  margin: 0.25rem 0;
}

.receipt-payment {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #ccc;
}

.receipt-footer {
  text-align: center;
  margin-top: 2rem;
  white-space: pre-line;
}

.receipt-footer p {
  margin: 0.25rem 0;
}

.form-actions {
  grid-column: 1 / span 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.show-discount-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.show-discount-toggle input {
  width: 16px;
  height: 16px;
}

.save-btn,
.reset-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.save-btn:hover {
  background-color: #45a049;
}

.save-btn:disabled {
  background-color: #a8d5aa;
  cursor: not-allowed;
}

.reset-btn {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e2e8f0;
  margin-right: 1rem;
}

.reset-btn:hover {
  background-color: #e9ecef;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-top: 0;
  color: #2c3e50;
}

.modal-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.confirm-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.confirm-btn {
  background-color: #dc3545;
  color: white;
  border: none;
}

.cancel-btn {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e2e8f0;
}

/* Toast notification styles */
.toast-notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  max-width: 350px;
  z-index: 1100;
  animation: slide-in 0.3s ease-out;
}

.toast-notification.success {
  background-color: #d4edda;
  color: #155724;
  border-left: 4px solid #28a745;
}

.toast-notification.error {
  background-color: #f8d7da;
  color: #721c24;
  border-left: 4px solid #dc3545;
}

.toast-notification.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border-left: 4px solid #17a2b8;
}

.toast-notification.warning {
  background-color: #fff3cd;
  color: #856404;
  border-left: 4px solid #ffc107;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 992px) {
  .settings-form {
    grid-template-columns: 1fr;
  }
  
  .receipt-preview {
    grid-column: 1;
    grid-row: auto;
  }
  
  .form-actions {
    grid-column: 1;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .admin-container {
    padding-left: 60px;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .settings-card {
    padding: 1.5rem;
  }
  
  .toast-notification {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style>

