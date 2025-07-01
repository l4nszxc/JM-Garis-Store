<template>
  <div class="admin-container">
    <AdminNavbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="admin-content">
      <h1><i class="fas fa-flag"></i> Customer Reports</h1>

      <div class="reports-controls">
        <!-- Report Type Tabs -->
        <div class="report-tabs">
          <button 
            @click="activeTab = 'orders'" 
            :class="['tab-btn', activeTab === 'orders' ? 'active' : '']"
          >
            <i class="fas fa-shopping-bag"></i> Order Reports
          </button>
          <button 
            @click="activeTab = 'products'" 
            :class="['tab-btn', activeTab === 'products' ? 'active' : '']"
          >
            <i class="fas fa-box"></i> Product Reports
          </button>
        </div>

        <!-- Filters Section -->
        <div class="filters">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              :placeholder="activeTab === 'orders' ? 'Search by order ID or description...' : 'Search by product name or description...'"
            >
          </div>
          
          <div class="status-filter">
            <select v-model="selectedStatus">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <button 
            @click="clearFilters" 
            class="clear-btn" 
            v-if="hasActiveFilters"
          >
            <i class="fas fa-times"></i> Clear Filters
          </button>
        </div>
      </div>

      <!-- Order Reports Table -->
      <div v-if="activeTab === 'orders'" class="reports-table-container">
        <table v-if="filteredOrderReports.length > 0" class="reports-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Issue Type</th>
              <th>Date Reported</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in filteredOrderReports" :key="report.id">
              <td>#{{ report.id }}</td>
              <td>{{ report.order_id }}</td>
              <td>{{ report.username }}</td>
              <td>
                <span class="issue-badge" :class="getIssueClass(report.issue_type)">
                  {{ formatIssueType(report.issue_type) }}
                </span>
              </td>
              <td>{{ formatDate(report.created_at) }}</td>
              <td>
                <span class="status-badge" :class="report.status">{{ formatStatus(report.status) }}</span>
              </td>
              <td>
                <button @click="viewOrderReport(report)" class="view-btn">
                  <i class="fas fa-eye"></i> View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-results">
          <i class="fas fa-search"></i>
          <p>No order reports found</p>
          <p v-if="hasActiveFilters" class="help-text">Try adjusting your filters</p>
        </div>
      </div>

      <!-- Product Reports Table -->
      <div v-else class="reports-table-container">
        <table v-if="filteredProductReports.length > 0" class="reports-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Issue Type</th>
              <th>Date Reported</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in filteredProductReports" :key="report.id">
              <td>#{{ report.id }}</td>
              <td class="product-cell">
                <div class="product-info">
                  <img 
                    :src="report.image || '/img/placeholder.jpg'" 
                    :alt="report.name"
                    class="product-thumbnail"
                    @error="handleImageError"
                  >
                  <span>{{ report.name }}</span>
                </div>
              </td>
              <td>{{ report.username }}</td>
              <td>
                <span class="issue-badge" :class="getIssueClass(report.issue_type)">
                  {{ formatIssueType(report.issue_type) }}
                </span>
              </td>
              <td>{{ formatDate(report.created_at) }}</td>
              <td>
                <span class="status-badge" :class="report.status">{{ formatStatus(report.status) }}</span>
              </td>
              <td>
                <button @click="viewProductReport(report)" class="view-btn">
                  <i class="fas fa-eye"></i> View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-results">
          <i class="fas fa-search"></i>
          <p>No product reports found</p>
          <p v-if="hasActiveFilters" class="help-text">Try adjusting your filters</p>
        </div>
      </div>
    </div>

    <!-- Order Report Detail Modal -->
    <div v-if="showOrderReportModal && selectedReport" class="modal-overlay">
      <div class="modal-content report-modal">
        <div class="modal-header">
          <h2>Order Report Details</h2>
          <button @click="closeOrderModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="report-details">
          <div class="details-grid">
            <div class="detail-item">
              <span class="label">Report ID:</span>
              <span class="value">#{{ selectedReport.id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Order ID:</span>
              <span class="value">{{ selectedReport.order_id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Customer:</span>
              <span class="value">{{ selectedReport.username }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Date Reported:</span>
              <span class="value">{{ formatDateLong(selectedReport.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Issue Type:</span>
              <span class="value issue-badge" :class="getIssueClass(selectedReport.issue_type)">
                {{ formatIssueType(selectedReport.issue_type) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Status:</span>
              <span class="value">
                <select v-model="reportStatus" class="status-select">
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </span>
            </div>
          </div>
          
          <div class="description-box">
            <h3>Customer Description</h3>
            <p>{{ selectedReport.description }}</p>
          </div>
          
          <div class="order-details" v-if="orderDetails">
            <h3>Order Information</h3>
            <div class="order-summary">
              <p><strong>Total Amount:</strong> {{ formatPrice(orderDetails.total_amount) }}</p>
              <p><strong>Order Status:</strong> {{ orderDetails.status }}</p>
              <p><strong>Order Date:</strong> {{ formatDateLong(orderDetails.created_at) }}</p>
            </div>
            
            <div class="order-items">
              <h4>Order Items</h4>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in orderDetails.items" :key="item.product_id">
                    <td>
                      <div class="product-info">
                        <img :src="item.image" :alt="item.name" class="product-thumbnail" @error="handleImageError">
                        <span>
                          {{ item.original_name || item.name }}
                          <span class="variant" v-if="item.choice_name">({{ item.choice_name }})</span>
                        </span>
                      </div>
                    </td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ formatPrice(item.price) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="admin-response">
            <h3>Admin Response</h3>
            <textarea 
              v-model="adminResponse" 
              rows="4" 
              placeholder="Enter your response to this report..."
            ></textarea>
            
            <div class="response-actions">
              <button @click="updateOrderReport" class="submit-btn" :disabled="isSubmitting">
                <i class="fas fa-save"></i>
                <span v-if="isSubmitting">Saving...</span>
                <span v-else>Save Response</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Report Detail Modal -->
    <div v-if="showProductReportModal && selectedReport" class="modal-overlay">
      <div class="modal-content report-modal">
        <div class="modal-header">
          <h2>Product Report Details</h2>
          <button @click="closeProductModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="report-details">
          <div class="details-grid">
            <div class="detail-item">
              <span class="label">Report ID:</span>
              <span class="value">#{{ selectedReport.id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Reported Date:</span>
              <span class="value">{{ formatDateLong(selectedReport.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Customer:</span>
              <span class="value">{{ selectedReport.username }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Status:</span>
              <span class="value">
                <select v-model="reportStatus" class="status-select">
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </span>
            </div>
          </div>
          
          <div class="product-detail-box">
            <h3>Product Information</h3>
            <div class="product-detail-info">
              <img 
                :src="selectedReport.image || '/img/placeholder.jpg'" 
                :alt="selectedReport.name"
                class="product-detail-image"
                @error="handleImageError"
              >
              <div class="product-detail-content">
                <h4>{{ selectedReport.name }}</h4>
                <p class="product-id">Product ID: {{ selectedReport.product_id }}</p>
                <p class="issue-type">
                  <span class="issue-badge" :class="getIssueClass(selectedReport.issue_type)">
                    {{ formatIssueType(selectedReport.issue_type) }}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div class="description-box">
            <h3>Customer Description</h3>
            <p>{{ selectedReport.description }}</p>
          </div>
          
          <div class="admin-response">
            <h3>Admin Response</h3>
            <textarea 
              v-model="adminResponse" 
              rows="4" 
              placeholder="Enter your response to this report..."
            ></textarea>
            
            <div class="response-actions">
              <button @click="updateProductReport" class="submit-btn" :disabled="isSubmitting">
                <i class="fas fa-save"></i>
                <span v-if="isSubmitting">Saving...</span>
                <span v-else>Save Response</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Success Notification -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <i :class="notification.icon"></i>
        {{ notification.message }}
      </div>
      <button class="notification-close" @click="hideNotification">
        <i class="fas fa-times"></i>
      </button>
    </div>

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
  name: 'AdminReports',
  components: {
    AdminNavbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      activeTab: 'orders',
      orderReports: [],
      productReports: [],
      searchQuery: '',
      selectedStatus: '',
      selectedReport: null,
      orderDetails: null,
      showOrderReportModal: false,
      showProductReportModal: false,
      adminResponse: '',
      reportStatus: 'pending',
      isSubmitting: false,
      notification: {
        show: false,
        message: '',
        type: 'success',
        icon: 'fas fa-check-circle'
      }
    }
  },
  computed: {
    hasActiveFilters() {
      return this.searchQuery !== '' || this.selectedStatus !== '';
    },
    
    filteredOrderReports() {
      return this.orderReports.filter(report => {
        const searchMatch = !this.searchQuery || 
          report.order_id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          report.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          report.username.toLowerCase().includes(this.searchQuery.toLowerCase());
        
        const statusMatch = !this.selectedStatus || report.status === this.selectedStatus;
        
        return searchMatch && statusMatch;
      });
    },
    
    filteredProductReports() {
      return this.productReports.filter(report => {
        const searchMatch = !this.searchQuery || 
          report.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          report.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          report.username.toLowerCase().includes(this.searchQuery.toLowerCase());
        
        const statusMatch = !this.selectedStatus || report.status === this.selectedStatus;
        
        return searchMatch && statusMatch;
      });
    }
  },
  methods: {
    async fetchOrderReports() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/order-reports', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          this.orderReports = await response.json();
        }
      } catch (error) {
        console.error('Error fetching order reports:', error);
      }
    },
    
    async fetchProductReports() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/product-reports', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          this.productReports = await response.json();
        }
      } catch (error) {
        console.error('Error fetching product reports:', error);
      }
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }) + ', ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatDateLong(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) + ' at ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(price);
    },
    
    formatIssueType(issueType) {
      // Convert snake_case or hyphenated to Title Case
      return issueType
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    
    formatStatus(status) {
      switch(status) {
        case 'in_progress':
          return 'In Progress';
        default:
          return status.charAt(0).toUpperCase() + status.slice(1);
      }
    },
    
    getIssueClass(issueType) {
      switch(issueType) {
        case 'missing-items':
        case 'missing_items':
          return 'missing';
        case 'wrong-order':
        case 'wrong_order':
          return 'wrong';
        case 'quality-issue':
        case 'quality_issue':
        case 'inaccurate-info':
        case 'inaccurate_info':
          return 'quality';
        case 'misleading':
          return 'misleading';
        case 'incorrect-price':
        case 'incorrect_price':
          return 'price';
        default:
          return 'other';
      }
    },
    
    handleImageError(e) {
      e.target.src = '/img/placeholder.jpg';
    },
    
    clearFilters() {
      this.searchQuery = '';
      this.selectedStatus = '';
    },
    
    async viewOrderReport(report) {
      this.selectedReport = report;
      this.reportStatus = report.status;
      this.adminResponse = report.admin_response || '';
      
      // Fetch order details
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:7904/api/admin/orders/${report.order_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          this.orderDetails = await response.json();
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      }
      
      this.showOrderReportModal = true;
    },
    
    async viewProductReport(report) {
      this.selectedReport = report;
      this.reportStatus = report.status;
      this.adminResponse = report.admin_response || '';
      this.showProductReportModal = true;
    },
    
    closeOrderModal() {
      this.showOrderReportModal = false;
      this.selectedReport = null;
      this.orderDetails = null;
      this.adminResponse = '';
    },
    
    closeProductModal() {
      this.showProductReportModal = false;
      this.selectedReport = null;
      this.adminResponse = '';
    },
    
    async updateOrderReport() {
      if (this.isSubmitting) return;
      
      this.isSubmitting = true;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:7904/api/admin/order-reports/${this.selectedReport.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: this.reportStatus,
            admin_response: this.adminResponse
          })
        });
        
        if (response.ok) {
          // Update the local report data
          const updatedReport = this.orderReports.find(r => r.id === this.selectedReport.id);
          if (updatedReport) {
            updatedReport.status = this.reportStatus;
            updatedReport.admin_response = this.adminResponse;
            if (this.reportStatus === 'resolved' || this.reportStatus === 'rejected') {
              updatedReport.resolved_at = new Date().toISOString();
            }
          }
          
          this.showNotification('Report updated successfully', 'success', 'fas fa-check-circle');
          this.closeOrderModal();
        } else {
          throw new Error('Failed to update report');
        }
      } catch (error) {
        console.error('Error updating report:', error);
        this.showNotification('Failed to update report', 'error', 'fas fa-times-circle');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    async updateProductReport() {
      if (this.isSubmitting) return;
      
      this.isSubmitting = true;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:7904/api/admin/product-reports/${this.selectedReport.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: this.reportStatus,
            admin_response: this.adminResponse
          })
        });
        
        if (response.ok) {
          // Update the local report data
          const updatedReport = this.productReports.find(r => r.id === this.selectedReport.id);
          if (updatedReport) {
            updatedReport.status = this.reportStatus;
            updatedReport.admin_response = this.adminResponse;
            if (this.reportStatus === 'resolved' || this.reportStatus === 'rejected') {
              updatedReport.resolved_at = new Date().toISOString();
            }
          }
          
          this.showNotification('Report updated successfully', 'success', 'fas fa-check-circle');
          this.closeProductModal();
        } else {
          throw new Error('Failed to update report');
        }
      } catch (error) {
        console.error('Error updating report:', error);
        this.showNotification('Failed to update report', 'error', 'fas fa-times-circle');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    showNotification(message, type, icon) {
      this.notification = {
        show: true,
        message,
        type,
        icon
      };
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        this.hideNotification();
      }, 5000);
    },
    
    hideNotification() {
      this.notification.show = false;
    },
    
    async handleLogout() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/users/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
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
  async mounted() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username || 'Admin';
      
      // Fetch both types of reports
      await this.fetchOrderReports();
      await this.fetchProductReports();
    } else {
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.admin-container {
  font-family: 'Inter', Arial, sans-serif;
  min-height: 100vh;
  background-color: #f8fafc;
  padding-left: 250px; /* Match sidebar width */
}

.admin-content {
  padding: 2rem;
}

h1 {
  color: #1e293b;
  margin-bottom: 2rem;
  font-size: 1.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Reports Controls */
.reports-controls {
  margin-bottom: 2rem;
}

.report-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: #f1f5f9;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-btn:hover {
  background-color: #e2e8f0;
  color: #334155;
}

.tab-btn.active {
  background-color: #3b82f6;
  color: white;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  position: relative;
  min-width: 300px;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-box input {
  width: 95%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.status-filter select {
  padding: 0.75rem 2rem 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  background-color: white;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  cursor: pointer;
}

.status-filter select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-btn {
  padding: 0.75rem 1.25rem;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #64748b;
  font-size: 0.95rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-btn:hover {
  background-color: #f1f5f9;
  color: #334155;
}

/* Reports Table */
.reports-table-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table th {
  background-color: #f8fafc;
  text-align: left;
  padding: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reports-table td {
  padding: 1rem;
  border-top: 1px solid #f1f5f9;
  vertical-align: middle;
}

.reports-table tr:hover {
  background-color: #f9fafb;
}

.product-cell {
  max-width: 250px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.product-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.issue-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.issue-badge.missing {
  background-color: #fef3c7;
  color: #92400e;
}

.issue-badge.wrong {
  background-color: #fee2e2;
  color: #b91c1c;
}

.issue-badge.quality {
  background-color: #e0e7ff;
  color: #4338ca;
}

.issue-badge.misleading {
  background-color: #fae8ff;
  color: #a21caf;
}

.issue-badge.price {
  background-color: #dcfce7;
  color: #15803d;
}

.issue-badge.other {
  background-color: #f1f5f9;
  color: #475569;
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.in_progress {
  background-color: #e0f2fe;
  color: #0369a1;
}

.status-badge.resolved {
  background-color: #dcfce7;
  color: #15803d;
}

.status-badge.rejected {
  background-color: #fee2e2;
  color: #b91c1c;
}

.view-btn {
  padding: 0.5rem 1rem;
  border: none;
  background-color: #3b82f6;
  color: white;
  font-size: 0.875rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-btn:hover {
  background-color: #2563eb;
}

.no-results {
  padding: 3rem 0;
  text-align: center;
}

.no-results i {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.no-results p {
  color: #64748b;
  font-size: 1.15rem;
  margin: 0.5rem 0;
}

.no-results .help-text {
  font-size: 0.95rem;
  color: #94a3b8;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f1f5f9;
  color: #334155;
}

.report-details {
  padding: 1.5rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.value {
  font-size: 1rem;
  color: #1e293b;
  font-weight: 500;
}

.status-select {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #1e293b;
  background-color: white;
  width: 100%;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;
  cursor: pointer;
}

.description-box {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.description-box h3 {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  color: #334155;
}

.description-box p {
  color: #1e293b;
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.order-details, .product-detail-box {
  margin: 1.5rem 0;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
}

.order-details h3, .product-detail-box h3 {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  color: #334155;
}

.order-summary {
  margin-bottom: 1.5rem;
}

.order-summary p {
  margin: 0.5rem 0;
  color: #334155;
}

.order-items h4 {
  margin: 1.5rem 0 0.75rem;
  font-size: 1rem;
  color: #334155;
}

.order-items table {
  width: 100%;
  border-collapse: collapse;
}

.order-items th {
  background-color: #eef2f6;
  padding: 0.75rem;
  text-align: left;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.order-items td {
  padding: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.variant {
  color: #64748b;
  font-size: 0.875rem;
}

.product-detail-info {
  display: flex;
  gap: 1.5rem;
}

.product-detail-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.product-detail-content {
  flex: 1;
}

.product-detail-content h4 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: #1e293b;
}

.product-id {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #64748b;
}

.admin-response {
  margin: 1.5rem 0;
}

.admin-response h3 {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  color: #334155;
}

.admin-response textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  resize: vertical;
}

.admin-response textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.response-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-btn:hover {
  background-color: #2563eb;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Notification */
.notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 1001;
  width: 350px;
  animation: fadeIn 0.3s ease-out;
}

.notification.success {
  background-color: #dcfce7;
  color: #15803d;
}

.notification.error {
  background-color: #fee2e2;
  color: #b91c1c;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  flex: 1;
}

.notification-close {
  background: none;
  border: none;
  color: currentColor;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity 0.2s;
  padding: 0.25rem;
}

.notification-close:hover {
  opacity: 1;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-container {
    padding-left: 0;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .reports-controls {
    flex-direction: column;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .modal-content {
    width: 95%;
    padding: 1rem;
    margin: 1rem;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .product-detail-info {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>