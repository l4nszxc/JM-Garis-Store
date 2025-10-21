<template>
    <div class="admin-container">
        <AdminNavbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="admin-content">
            <div class="dashboard-header">
                <h1><i class="fas fa-credit-card"></i> Payment Settings</h1>
                <div class="header-actions">
                    <span class="status-badge">Configuration Panel</span>
                </div>
            </div>

            <!-- Payment Settings Grid -->
            <div class="settings-grid">
                <!-- Payment Methods Status Cards -->
                <div class="status-cards-grid">
                    <div class="status-card gcash-card">
                        <div class="status-icon">
                            <i class="fab fa-cc-mastercard"></i>
                        </div>
                        <div class="status-content">
                            <h3>GCash Payment</h3>
                            <p class="status-value" :class="{ active: paymentSettings.gcash_enabled, inactive: !paymentSettings.gcash_enabled }">
                                {{ paymentSettings.gcash_enabled ? 'Active' : 'Inactive' }}
                            </p>
                            <p class="status-description">Online payment integration</p>
                        </div>
                    </div>
                    
                    <div class="status-card downpayment-card">
                        <div class="status-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="status-content">
                            <h3>Downpayment</h3>
                            <p class="status-value" :class="{ active: paymentSettings.downpayment_enabled, inactive: !paymentSettings.downpayment_enabled }">
                                {{ paymentSettings.downpayment_enabled ? paymentSettings.downpayment_percentage + '%' : 'Disabled' }}
                            </p>
                            <p class="status-description">Partial payment option</p>
                        </div>
                    </div>
                    
                    <div class="status-card cash-card">
                        <div class="status-icon">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div class="status-content">
                            <h3>Cash on Delivery</h3>
                            <p class="status-value active">Always Active</p>
                            <p class="status-description">Traditional payment method</p>
                        </div>
                    </div>
                </div>

                <!-- GCash Integration Section -->
                <div class="settings-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><i class="fab fa-cc-mastercard"></i> GCash Integration</h2>
                        <p class="section-description">Configure GCash payment options for customers</p>
                    </div>
                </div>

                <div class="setting-card">
                    <div class="setting-row">
                        <div class="setting-info">
                            <h3><i class="fas fa-mobile-alt"></i> Enable GCash Payments</h3>
                            <p>Allow customers to pay using manual GCash reference numbers</p>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    v-model="paymentSettings.gcash_enabled"
                                    @change="updateGCashSettings"
                                >
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-row" v-if="paymentSettings.gcash_enabled">
                        <div class="setting-info">
                            <h3><i class="fas fa-info-circle"></i> GCash Information</h3>
                            <p>Manual GCash payment processing is now active. Customers will provide reference numbers for verification.</p>
                        </div>
                        <div class="setting-control">
                            <div class="status-indicator active">
                                <i class="fas fa-check-circle"></i>
                                <span>Manual Processing</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Downpayment Section -->
            <div class="settings-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><i class="fas fa-percentage"></i> Downpayment Settings</h2>
                        <p class="section-description">Configure downpayment options for orders</p>
                    </div>
                </div>

                <div class="setting-card">
                    <div class="setting-row">
                        <div class="setting-info">
                            <h3><i class="fas fa-coins"></i> Enable Downpayment Option</h3>
                            <p>Allow customers to pay a percentage upfront and the rest on delivery</p>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    v-model="paymentSettings.downpayment_enabled"
                                    @change="updateDownpaymentSettings"
                                >
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-row" v-if="paymentSettings.downpayment_enabled">
                        <div class="setting-info">
                            <h3><i class="fas fa-calculator"></i> Downpayment Percentage</h3>
                            <p>Set the required downpayment percentage (1-99%)</p>
                        </div>
                        <div class="setting-control">
                            <div class="percentage-input-group">
                                <input 
                                    type="number" 
                                    v-model.number="paymentSettings.downpayment_percentage"
                                    @change="updateDownpaymentSettings"
                                    min="1" 
                                    max="99"
                                    class="percentage-input"
                                >
                                <span class="percentage-symbol">%</span>
                            </div>
                        </div>
                    </div>

                    <div class="setting-row" v-if="paymentSettings.downpayment_enabled">
                        <div class="setting-info">
                            <h3><i class="fas fa-dollar-sign"></i> Minimum Order Amount</h3>
                            <p>Minimum order value required for downpayment option</p>
                        </div>
                        <div class="setting-control">
                            <div class="amount-input-group">
                                <span class="currency-symbol">₱</span>
                                <input 
                                    type="number" 
                                    v-model.number="paymentSettings.min_order_amount"
                                    @change="updateDownpaymentSettings"
                                    min="1" 
                                    step="0.01"
                                    class="amount-input"
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment Methods Preview -->
            <div class="settings-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><i class="fas fa-eye"></i> Payment Methods Preview</h2>
                        <p class="section-description">Preview how payment options will appear to customers</p>
                    </div>
                </div>

                <div class="preview-card">
                    <h3>Available Payment Methods</h3>
                    <div class="payment-methods-preview">
                        <div class="payment-option-preview cash">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Cash on Delivery</span>
                            <small>Always Available</small>
                        </div>
                        <div 
                            class="payment-option-preview gcash" 
                            :class="{ disabled: !paymentSettings.gcash_enabled }"
                        >
                            <i class="fab fa-cc-mastercard"></i>
                            <span>GCash Payment</span>
                            <small>{{ paymentSettings.gcash_enabled ? 'Enabled' : 'Disabled' }}</small>
                        </div>
                        <div class="payment-option-preview hatid">
                            <i class="fas fa-motorcycle"></i>
                            <span>HATID Delivery</span>
                            <small>Always Available</small>
                        </div>
                    </div>
                    
                    <div v-if="paymentSettings.downpayment_enabled" class="downpayment-preview">
                        <h4><i class="fas fa-info-circle"></i> Downpayment Information</h4>
                        <div class="downpayment-info">
                            <p><strong>Percentage:</strong> {{ paymentSettings.downpayment_percentage }}%</p>
                            <p><strong>Minimum Order:</strong> ₱{{ paymentSettings.min_order_amount }}</p>
                            <p><strong>Example:</strong> For ₱1000 order → ₱{{ (1000 * paymentSettings.downpayment_percentage / 100).toFixed(2) }} downpayment</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Logout Modal -->
        <LogoutModal 
            v-if="showLogoutModal" 
            @confirm="logout" 
            @cancel="showLogoutModal = false" 
        />

        <!-- Success/Error Messages -->
        <div v-if="showMessage" class="message-toast" :class="messageType">
            <i :class="messageType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
            {{ message }}
        </div>
    </div>
</div>
</template>

<script>
import AdminNavbar from '../../components/AdminNavbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';
import { apiMixin } from '../../mixins/apiMixin.js';

export default {
    name: 'PaymentSettings',
    components: {
        AdminNavbar,
        LogoutModal
    },
    mixins: [apiMixin],
    data() {
        return {
            username: '',
            showLogoutModal: false,
            showMessage: false,
            message: '',
            messageType: 'success',
            paymentSettings: {
                gcash_enabled: true,
                downpayment_enabled: true,
                downpayment_percentage: 25,
                min_order_amount: 500
            }
        }
    },
    async mounted() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.$router.push('/login');
            return;
        }

        try {
            // Decode and check token
            const decoded = JSON.parse(atob(token.split('.')[1]));
            if (decoded.role !== 'admin') {
                this.$router.push('/home');
                return;
            }
            
            // Check token expiration
            const expirationTime = decoded.exp * 1000;
            if (Date.now() >= expirationTime) {
                localStorage.removeItem('token');
                localStorage.removeItem('userType');
                this.$router.push('/login');
                return;
            }

            this.username = decoded.username || 'Admin';
            await this.loadPaymentSettings();
        } catch (error) {
            console.error('Authentication error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            this.$router.push('/login');
        }
    },
    methods: {
        async loadPaymentSettings() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/admin/payment-settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                if (data.success) {
                    // Convert database values (1/0) to boolean (true/false)
                    this.paymentSettings = {
                        gcash_enabled: Boolean(data.settings.gcash_enabled),
                        downpayment_enabled: Boolean(data.settings.downpayment_enabled),
                        downpayment_percentage: Number(data.settings.downpayment_percentage),
                        min_order_amount: Number(data.settings.min_order_amount)
                    };
                }
            } catch (error) {
                console.error('Error loading payment settings:', error);
                this.showToast('Failed to load payment settings', 'error');
            }
        },

        async updateGCashSettings() {
            const previousState = this.paymentSettings.gcash_enabled;
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/admin/payment-settings/gcash', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        gcash_enabled: this.paymentSettings.gcash_enabled
                    })
                });
                
                const data = await response.json();
                if (response.ok && data.success) {
                    this.showToast(`GCash payment ${this.paymentSettings.gcash_enabled ? 'enabled' : 'disabled'} successfully`, 'success');
                } else {
                    throw new Error(data.message || 'Failed to update GCash settings');
                }
            } catch (error) {
                console.error('Error updating GCash settings:', error);
                this.showToast('Failed to update GCash settings', 'error');
                // Revert the change on error
                this.paymentSettings.gcash_enabled = previousState;
            }
        },

        async updateDownpaymentSettings() {
            const previousState = {
                enabled: this.paymentSettings.downpayment_enabled,
                percentage: this.paymentSettings.downpayment_percentage,
                minAmount: this.paymentSettings.min_order_amount
            };
            
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/admin/payment-settings/downpayment', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        downpayment_enabled: this.paymentSettings.downpayment_enabled,
                        downpayment_percentage: this.paymentSettings.downpayment_percentage,
                        min_order_amount: this.paymentSettings.min_order_amount
                    })
                });
                
                const data = await response.json();
                if (response.ok && data.success) {
                    this.showToast('Downpayment settings updated successfully', 'success');
                } else {
                    throw new Error(data.message || 'Failed to update downpayment settings');
                }
            } catch (error) {
                console.error('Error updating downpayment settings:', error);
                this.showToast('Failed to update downpayment settings', 'error');
                // Revert the changes on error
                this.paymentSettings.downpayment_enabled = previousState.enabled;
                this.paymentSettings.downpayment_percentage = previousState.percentage;
                this.paymentSettings.min_order_amount = previousState.minAmount;
            }
        },

        showToast(msg, type) {
            this.message = msg;
            this.messageType = type;
            this.showMessage = true;
            setTimeout(() => {
                this.showMessage = false;
            }, 3000);
        },

        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            localStorage.removeItem('username');
            this.$router.push('/login');
        }
    }
}
</script>

<style scoped>
/* Base Layout */
.admin-container {
    font-family: 'Inter', Arial, sans-serif;
    min-height: 100vh;
    background-color: #f8fafc;
    padding-left: 250px; /* Match sidebar width */
}

.admin-content {
    padding: 2rem;
    margin: 0 auto;
}

/* Dashboard Header */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.dashboard-header h1 {
    font-size: 1.75rem;
    color: #111827;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.dashboard-header h1 i {
    color: #4CAF50;
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.status-badge {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.3px;
}

/* Settings Grid */
.settings-grid {
    display: grid;
    gap: 2rem;
    margin-bottom: 2rem;
}

/* Status Cards Grid */
.status-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.status-card {
    display: flex;
    align-items: flex-start;
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    border-left: 4px solid #e2e8f0;
}

.status-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.status-card.gcash-card {
    border-left-color: #007bff;
}

.status-card.downpayment-card {
    border-left-color: #4CAF50;
}

.status-card.cash-card {
    border-left-color: #16a34a;
}

.status-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 54px;
    height: 54px;
    border-radius: 12px;
    margin-right: 1rem;
    flex-shrink: 0;
}

.gcash-card .status-icon {
    background-color: #eff6ff;
    color: #007bff;
}

.downpayment-card .status-icon {
    background-color: #f0f9ff;
    color: #4CAF50;
}

.cash-card .status-icon {
    background-color: #f0fdf4;
    color: #16a34a;
}

.status-icon i {
    font-size: 1.5rem;
}

.status-content {
    flex: 1;
}

.status-content h3 {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-content .status-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0.5rem 0 0.25rem;
    line-height: 1.2;
}

.status-value.active {
    color: #16a34a;
}

.status-value.inactive {
    color: #dc2626;
}

.status-content .status-description {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0.5rem 0 0;
}

/* Settings Sections */
.settings-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.settings-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.section-header {
    background: linear-gradient(135deg, #f8fffe 0%, #f1f9f1 100%);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e2e8f0;
    border-left: 4px solid #4CAF50;
}

.section-title h2 {
    color: #2d3748;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.section-title h2 i {
    color: #4CAF50;
}

.section-description {
    color: #64748b;
    margin: 0;
    font-size: 0.9rem;
}

/* Setting Cards */
.setting-card {
    padding: 0;
}

.setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.2s;
}

.setting-row:hover {
    background-color: #f8fafc;
}

.setting-row:last-child {
    border-bottom: none;
}

.setting-info h3 {
    color: #2d3748;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.setting-info h3 i {
    color: #64748b;
    font-size: 0.9rem;
}

.setting-info p {
    color: #64748b;
    margin: 0;
    font-size: 0.85rem;
}

/* Toggle Switch - Modern Design */
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e0;
    transition: 0.4s;
    border-radius: 34px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

input:checked + .slider:before {
    transform: translateX(26px);
}

/* Input Groups - Enhanced */
.percentage-input-group,
.amount-input-group {
    display: flex;
    align-items: center;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.percentage-input-group:focus-within,
.amount-input-group:focus-within {
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.percentage-input,
.amount-input {
    border: none;
    outline: none;
    padding: 0.75rem;
    font-size: 1rem;
    width: 80px;
    text-align: center;
    font-weight: 500;
}

.percentage-symbol,
.currency-symbol {
    background: #f8fafc;
    padding: 0.75rem;
    color: #4a5568;
    font-weight: 600;
}

.currency-symbol {
    border-right: 1px solid #e2e8f0;
}

.percentage-symbol {
    border-left: 1px solid #e2e8f0;
}

/* Config Button - Enhanced */
.config-btn {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

.config-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* Status Indicator */
.status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
}

.status-indicator.active {
    background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%);
    color: #28a745;
    border: 1px solid #c3e6cb;
}

.status-indicator.inactive {
    background: linear-gradient(135deg, #fef5e7 0%, #fff2e8 100%);
    color: #856404;
    border: 1px solid #ffeaa7;
}

.status-indicator i {
    font-size: 1rem;
}

/* Preview Card - Enhanced */
.preview-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    margin: 2rem;
    padding: 2rem;
    border-radius: 12px;
    border: 2px dashed #cbd5e0;
}

.preview-card h3 {
    color: #2d3748;
    margin: 0 0 1.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.payment-methods-preview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.payment-option-preview {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
    border: 2px solid #e2e8f0;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.payment-option-preview:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.payment-option-preview.disabled {
    opacity: 0.5;
    background: #f1f5f9;
}

.payment-option-preview i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #4CAF50;
}

.payment-option-preview.gcash i {
    color: #007bff;
}

.payment-option-preview.cash i {
    color: #16a34a;
}

.payment-option-preview.hatid i {
    color: #f59e0b;
}

.payment-option-preview.disabled i {
    color: #94a3b8;
}

.payment-option-preview span {
    display: block;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.25rem;
}

.payment-option-preview small {
    color: #64748b;
    font-size: 0.8rem;
}

.downpayment-preview {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 4px solid #4CAF50;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.downpayment-preview h4 {
    color: #2d3748;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}

.downpayment-preview h4 i {
    color: #4CAF50;
}

.downpayment-info p {
    margin: 0.5rem 0;
    color: #4a5568;
    font-size: 0.9rem;
}

/* Modal Styles - Enhanced */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.2);
    animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.modal-header h3 {
    margin: 0;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.close-btn:hover {
    background: #fee2e2;
    color: #dc2626;
}

.modal-body {
    padding: 2rem;
}

.config-form .form-group {
    margin-bottom: 1.5rem;
}

.config-form label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-input,
.form-select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.3s ease;
    font-size: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.modal-actions {
    display: flex;
    gap: 1rem;
    padding: 1.5rem 2rem;
    border-top: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.cancel-btn {
    flex: 1;
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.cancel-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(107, 114, 128, 0.3);
}

.modal-actions .save-btn {
    flex: 1;
    min-width: auto;
}

/* Message Toast - Enhanced */
.message-toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 1001;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-toast.success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.message-toast.error {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Responsive Design */
@media (max-width: 1024px) {
    .admin-container {
        padding-left: 0;
    }
    
    .admin-content {
        padding: 1rem;
    }
}

@media (max-width: 768px) {
    .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .status-cards-grid {
        grid-template-columns: 1fr;
    }
    
    .setting-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
    }
    
    .setting-control {
        width: 100%;
        display: flex;
        justify-content: flex-end;
    }
    
    .payment-methods-preview {
        grid-template-columns: 1fr;
    }
    
    .modal-content {
        width: 95%;
        margin: 1rem;
    }
    
    .modal-actions {
        flex-direction: column;
    }
    
    .message-toast {
        right: 1rem;
        left: 1rem;
        top: 1rem;
    }
}

@media (max-width: 480px) {
    .dashboard-header h1 {
        font-size: 1.5rem;
    }
    
    .section-header {
        padding: 1rem;
    }
    
    .setting-row {
        padding: 1rem;
    }
    
    .preview-card {
        margin: 1rem;
        padding: 1rem;
    }
}
</style>
