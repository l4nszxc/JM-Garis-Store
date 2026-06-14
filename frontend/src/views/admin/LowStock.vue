<template>
  <div class="admin-container">
    <AdminNavbar 
      :username="username"
      @logout="showLogoutModal = true"
    />
    
    <div class="admin-content">
      <div class="header-section">
        <h1><i class="fas fa-exclamation-triangle"></i> Low Stock Products</h1>
        <button @click="downloadExcel" class="download-btn" :disabled="!filteredLowStock.length || isLoading">
          <i class="fas fa-download"></i>
          Download Excel
        </button>
      </div>

      <div class="low-stock-section">
        <div class="search-filter">
          <div class="status-filters">
            <button 
              v-for="filter in stockFilters" 
              :key="filter.value"
              @click="stockFilter = filter.value"
              :class="['filter-btn', stockFilter === filter.value ? 'active' : '', filter.class]"
            >
              {{ filter.label }}
            </button>
          </div>
          
          <div class="filters-right">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search products or variants..."
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
          <!-- Loading skeleton -->
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading low stock data...</span>
            </div>
            <!-- Skeleton table -->
            <div class="skeleton-table">
              <div class="skeleton-header">
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
              </div>
              <div v-for="n in 5" :key="n" class="skeleton-row">
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
              </div>
            </div>
          </div>
          
          <!-- Actual data table -->
          <table v-else-if="filteredLowStock.length">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Stock Left</th>
                <th>Price</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredLowStock" :key="item.type === 'choice' ? `choice-${item.choice_id}` : `product-${item.id}`">
                <td>
                  {{ item.type === 'choice' ? 
                      `${item.product_name} (${item.choice_name})` : 
                      item.name }}
                  <span v-if="item.type === 'choice'" class="choice-badge">
                    <i class="fas fa-tag"></i> Variant
                  </span>
                </td>
                <td>
                  <div v-if="editingId === (item.type === 'choice' ? `choice-${item.choice_id}` : item.id)" class="stock-edit">
                    <input 
                      type="number" 
                      v-model="editingStock"
                      min="0"
                      @keyup.enter="saveStock(item)"
                      @keyup.esc="cancelEdit()"
                      :ref="el => { if (el) stockInput = el }"
                      class="stock-input"
                    >
                  </div>
                  <span v-else class="status-badge" :class="getStockStatusClass(item.stock)">
                    {{ item.stock }}
                  </span>
                </td>
                <td>₱{{ formatPrice(item.price) }}</td>
                <td>{{ item.category }}</td>
                <td>
                  <button v-if="editingId === (item.type === 'choice' ? `choice-${item.choice_id}` : item.id)" class="save-btn" @click="saveStock(item)">
                    <i class="fas fa-save"></i> Save
                  </button>
                  <button v-else @click="startEdit(item)" class="edit-btn">
                    <i class="fas fa-edit"></i> Edit Stock
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Pagination -->
          <div v-if="!isLoading && allFilteredLowStock.length > 0" class="pagination-container">
            <div class="pagination-info">
              Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, allFilteredLowStock.length) }} of {{ allFilteredLowStock.length }} items
            </div>
            <div class="pagination">
              <button 
                @click="prevPage" 
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              
              <template v-for="(page, index) in visiblePages" :key="index">
                <button
                  v-if="page === '...'"
                  class="pagination-btn pagination-ellipsis"
                  disabled
                >
                  {{ page }}
                </button>
                
                <button
                  v-else
                  @click="goToPage(page)"
                  :class="['pagination-btn', 'page-btn', { active: page === currentPage }]"
                >
                  {{ page }}
                </button>
              </template>
              
              <button 
                @click="nextPage" 
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <!-- No data state -->
          <div v-else-if="!isLoading" class="no-data">
            <i class="fas fa-check-circle"></i>
            <p>No products with low stock found</p>
            <span v-if="searchQuery" class="help-text">Try changing your search criteria</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showSaveConfirmation" class="modal-overlay">
      <div class="modal-content save-confirmation-modal">
        <h2>Confirm Stock Update</h2>
        <p>
          Are you sure you want to update the stock of 
          <span class="highlighted-text">
            {{ itemToUpdate?.type === 'choice' ? 
              `${itemToUpdate.product_name} (${itemToUpdate.choice_name})` : 
              itemToUpdate?.name }}
          </span> 
          to <span class="highlighted-text">{{ editingStock }}</span>?
        </p>
        <div class="modal-actions">
          <button @click="confirmSave" class="confirm-btn">
            <i class="fas fa-check"></i> Yes, Update Stock
          </button>
          <button @click="cancelSaveConfirmation" class="cancel-btn">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Notification -->
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
  name: 'LowStock',
  components: {
    AdminNavbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      editingId: null,
      editingStock: null,
      stockInput: null,
      showSaveConfirmation: false,
      itemToUpdate: null,
      lowStockItems: [],
      searchQuery: '',
      stockFilter: 'all',
      isLoading: false,
      currentPage: 1,
      itemsPerPage: 20,
      stockFilters: [
        { label: 'All Low Stock', value: 'all', class: '' },
        { label: 'Critical (≤ 10)', value: 'critical', class: 'critical' },
        { label: 'Warning (≤ 20)', value: 'warning', class: 'warning' },
        { label: 'Low (≤ 30)', value: 'low', class: 'low' }
      ],
      defaultStockFilter: 'all',
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
      return this.searchQuery !== '' || this.stockFilter !== this.defaultStockFilter;
    },
    allFilteredLowStock() {
      if (!this.lowStockItems.length) return [];
      
      return this.lowStockItems.filter(item => {
        // Filter by search query
        const searchMatch = this.searchQuery ? 
          (item.type === 'choice' 
            ? (item.product_name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
               item.choice_name.toLowerCase().includes(this.searchQuery.toLowerCase()))
            : item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
          ) : true;
        
        // Filter by stock level
        let stockMatch = true;
        if (this.stockFilter === 'critical') {
          stockMatch = item.stock <= 10;
        } else if (this.stockFilter === 'warning') {
          stockMatch = item.stock <= 20;
        } else if (this.stockFilter === 'low') {
          stockMatch = item.stock <= 30;
        }
        
        return searchMatch && stockMatch;
      });
    },
    filteredLowStock() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.allFilteredLowStock.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.allFilteredLowStock.length / this.itemsPerPage);
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;
      
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        } else if (current >= total - 3) {
          pages.push(1);
          pages.push('...');
          for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = current - 1; i <= current + 1; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        }
      }
      return pages;
    }
  },
  methods: {
    resetFilters() {
      this.searchQuery = '';
      this.stockFilter = this.defaultStockFilter;
      this.currentPage = 1;
    },
    
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
    
    getStockStatusClass(stock) {
      if (stock <= 10) return 'critical';
      if (stock <= 20) return 'warning';
      return 'low';
    },
    
    async downloadExcel() {
      if (!this.filteredLowStock.length) {
        this.showNotification('No low stock data available to download', 'warning', 'fas fa-exclamation-triangle');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          filter: this.stockFilter,
          search: this.searchQuery
        });
        
        const response = await this.$fetch(`/api/admin/download-low-stock?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          const today = new Date().toISOString().split('T')[0];
          const filename = `low_stock_report_${today}.xlsx`;
          link.download = filename;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.showNotification('Low stock report downloaded successfully', 'success', 'fas fa-download');
        } else {
          throw new Error('Download failed');
        }
      } catch (error) {
        console.error('Error downloading low stock report:', error);
        this.showNotification('Error downloading report', 'error', 'fas fa-times-circle');
      }
    },
    
    showNotification(message, type = 'success', icon = 'fas fa-check-circle') {
      this.notification = { show: true, message, type, icon };
      setTimeout(() => {
        this.hideNotification();
      }, 5000);
    },
    
    hideNotification() {
      this.notification.show = false;
    },
    
    startEdit(item) {
      this.editingId = item.type === 'choice' ? `choice-${item.choice_id}` : item.id;
      this.editingStock = item.stock;
      this.$nextTick(() => {
        if (this.stockInput) {
          this.stockInput.focus();
        }
      });
    },

    cancelEdit() {
      this.editingId = null;
      this.editingStock = null;
    },
    
    saveStock(item) {
      this.itemToUpdate = item;
      this.showSaveConfirmation = true;
    },
    
    cancelSaveConfirmation() {
      this.showSaveConfirmation = false;
      this.itemToUpdate = null;
    },
    
    async confirmSave() {
      try {
        if (!this.itemToUpdate || this.editingStock === null || this.editingStock === undefined) {
          console.error('Invalid stock quantity or item');
          return;
        }

        const token = localStorage.getItem('token');
        let endpoint, payload;
        
        if (this.itemToUpdate.type === 'choice') {
          endpoint = `${this.API_BASE_URL}/api/products/choices/${this.itemToUpdate.choice_id}`;
          payload = { 
            stock: parseInt(this.editingStock),
            price: this.itemToUpdate.price,
            name: this.itemToUpdate.choice_name
          };
        } else {
          endpoint = `${this.API_BASE_URL}/api/products/${this.itemToUpdate.id}`;
          payload = { 
            stock_quantity: parseInt(this.editingStock),
            price: this.itemToUpdate.price,
            name: this.itemToUpdate.name,
            description: this.itemToUpdate.description,
            category: this.itemToUpdate.category
          };
        }

        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const index = this.lowStockItems.findIndex(item => {
            if (this.itemToUpdate.type === 'choice') {
              return item.choice_id === this.itemToUpdate.choice_id;
            } else {
              return item.id === this.itemToUpdate.id;
            }
          });
          
          if (index !== -1) {
            this.lowStockItems[index].stock = parseInt(this.editingStock);
            
            if (this.editingStock > 30) {
              this.lowStockItems.splice(index, 1);
            }
          }
          
          this.editingId = null;
          this.editingStock = null;
          
          await this.fetchLowStockItems();
          window.dispatchEvent(new CustomEvent('stock-updated'));
          
          this.showNotification('Stock updated successfully', 'success', 'fas fa-check-circle');
        } else {
          // Handle non-JSON responses (like HTML error pages)
          let errorMessage = 'Failed to update stock';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If response is not JSON, try to get text
            try {
              const errorText = await response.text();
              if (errorText.includes('Not Found')) {
                errorMessage = 'Product not found. It may have been deleted.';
              } else if (errorText.includes('Unauthorized')) {
                errorMessage = 'You are not authorized to update this product.';
              }
            } catch (textError) {
              // Keep default error message
            }
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error updating stock:', error);
        this.showNotification('Error updating stock', 'error', 'fas fa-times-circle');
      } finally {
        this.showSaveConfirmation = false;
        this.itemToUpdate = null;
      }
    },
    
    formatPrice(price) {
      return parseFloat(price).toFixed(2);
    },
    
    async fetchLowStockItems() {
      try {
        this.isLoading = true;
        const token = localStorage.getItem('token');
        const response = await fetch(`${this.API_BASE_URL}/api/admin/low-stock`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.lowStockItems = data || [];
        }
      } catch (error) {
        console.error('Error fetching low stock items:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    async handleLogout() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${this.API_BASE_URL}/api/users/logout`, {
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
      await this.fetchLowStockItems();
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

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.admin-content h1 {
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.download-btn {
  padding: 0.75rem 1.25rem;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.download-btn:hover:not(:disabled) {
  background-color: #047857;
  transform: translateY(-1px);
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #9ca3af;
}

.low-stock-section {
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

.filter-btn.critical {
  background-color: #fee2e2;
  color: #dc2626;
}

.filter-btn.critical.active {
  background-color: #dc2626;
  color: white;
}

.filter-btn.warning {
  background-color: #fef3c7;
  color: #d97706;
}

.filter-btn.warning.active {
  background-color: #f59e0b;
  color: white;
}

.filter-btn.low {
  background-color: #e3f5e9;
  color: #0f7840;
}

.filter-btn.low.active {
  background-color: #38a169;
  color: white;
}

.filter-btn.active {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

tr:hover {
  background-color: #f8fafc;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

.critical {
  background-color: #fee2e2;
  color: #dc2626;
}

.warning {
  background-color: #fef3c7;
  color: #d97706;
}

.low {
  background-color: #e3f5e9;
  color: #0f7840;
}

.choice-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background-color: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  margin-left: 0.5rem;
}

.edit-btn {
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
  transition: all 0.2s;
}

.edit-btn:hover {
  background-color: #2980b9;
  transform: translateY(-1px);
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.save-btn:hover {
  background-color: #45a049;
  transform: translateY(-1px);
}

.stock-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
  background-color: #f0f9ff;
}

.stock-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.no-data {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-size: 1rem;
}

.no-data i {
  font-size: 3rem;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.no-data p {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.help-text {
  display: block;
  margin-top: 0.5rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

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
  max-width: 500px;
}

.save-confirmation-modal {
  max-width: 400px;
  text-align: center;
}

.save-confirmation-modal h2 {
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.save-confirmation-modal p {
  margin-bottom: 1.75rem;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
}

.highlighted-text {
  font-weight: 600;
  color: #3b82f6;
}

.modal-actions {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.confirm-btn {
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

.confirm-btn:hover {
  background-color: #45a049;
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

/* Notification */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 300px;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background-color: #dcfce7;
  color: #15803d;
}

.notification.error {
  background-color: #fee2e2;
  color: #b91c1c;
}

.notification.warning {
  background-color: #fef3c7;
  color: #d97706;
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

@keyframes slideIn {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

/* Loading styles */
.loading-container {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  color: #3b82f6;
  font-size: 1rem;
  font-weight: 500;
}

.loading-spinner i {
  font-size: 1.5rem;
}

.skeleton-table {
  width: 100%;
  border-collapse: collapse;
}

.skeleton-header {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.skeleton-row {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.skeleton-cell {
  height: 1rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-header .skeleton-cell {
  height: 1.25rem;
  background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
  background-size: 200% 100%;
}

.skeleton-cell:nth-child(1) { flex: 2; } /* Product name */
.skeleton-cell:nth-child(2) { flex: 1; } /* Stock */
.skeleton-cell:nth-child(3) { flex: 1; } /* Price */
.skeleton-cell:nth-child(4) { flex: 1; } /* Category */
.skeleton-cell:nth-child(5) { flex: 1; } /* Actions */

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Pagination Styles */
.pagination-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  gap: 1rem;
}

.pagination-info {
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
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
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f8fafc;
}

.pagination-btn.page-btn {
  min-width: 40px;
}

.pagination-btn.page-btn.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.pagination-btn.page-btn.active:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.pagination-ellipsis {
  border: none;
  background: transparent;
  cursor: default;
  padding: 0.5rem;
}

.pagination-ellipsis:hover {
  background: transparent;
  transform: none;
}

@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pagination-info {
    text-align: center;
  }
  
  .pagination {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .pagination-btn {
    padding: 0.4rem 0.6rem;
    min-width: 35px;
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) {
  .admin-container {
    padding-left: 60px;
  }

  .admin-content {
    padding: 1rem;
  }

  .header-section {
    flex-direction: column;
    align-items: stretch;
  }

  .download-btn {
    width: 100%;
    justify-content: center;
  }

  .search-filter {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters-right {
    flex-direction: column;
    width: 100%;
  }
  
  .search-box {
    width: 100%;
    max-width: 100%;
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
  
  th, td {
    padding: 0.75rem;
  }
}
</style>

