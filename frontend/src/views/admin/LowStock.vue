<template>
  <div class="admin-container">
    <AdminNavbar 
      :username="username"
      @logout="showLogoutModal = true"
    />
    
    <div class="admin-content">
      <div class="header">
        <h2>LOW STOCK PRODUCTS</h2>
        <div class="filters">
          <div class="search-container">
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search products..."
              >
            </div>
            <div class="stock-filter">
              <select v-model="stockFilter" class="stock-select">
                <option value="all">All Low Stock</option>
                <option value="critical">Critical (≤ 10)</option>
                <option value="warning">Warning (≤ 20)</option>
                <option value="low">Low (≤ 30)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="table-container low-stock-table">
        <table v-if="filteredLowStock.length">
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
                <span v-else class="stock-badge" :class="getStockStatusClass(item.stock)">
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
        <p v-else class="no-data">
          <i class="fas fa-check-circle"></i>
          No products with low stock found
          <span class="help-text" v-if="searchQuery">Try changing your search criteria</span>
        </p>
      </div>
    </div>

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
        <div class="modal-buttons">
          <button @click="confirmSave" class="confirm-btn">
            <i class="fas fa-check"></i> Yes, Update Stock
          </button>
          <button @click="cancelSaveConfirmation" class="cancel-btn">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
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
      stockFilter: 'all'
    }
  },
  computed: {
    filteredLowStock() {
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
    }
  },
  methods: {
    getStockStatusClass(stock) {
      if (stock <= 10) return 'critical-stock';
      if (stock <= 20) return 'low-stock';
      return 'normal-stock';
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
          // Update choice stock - maintain existing price
          endpoint = `http://localhost:7904/api/products/choices/${this.itemToUpdate.choice_id}`;
          payload = { 
            stock: parseInt(this.editingStock),
            price: this.itemToUpdate.price,
            name: this.itemToUpdate.choice_name
          };
        } else {
          // Update regular product stock - maintain existing price
          endpoint = `http://localhost:7904/api/products/${this.itemToUpdate.id}`;
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
          // Update only the stock in the local data
          const index = this.lowStockItems.findIndex(item => {
            if (this.itemToUpdate.type === 'choice') {
              return item.choice_id === this.itemToUpdate.choice_id;
            } else {
              return item.id === this.itemToUpdate.id;
            }
          });
          
          if (index !== -1) {
            this.lowStockItems[index].stock = parseInt(this.editingStock);
            
            // Remove from list if it's no longer low stock
            if (this.editingStock > 30) {
              this.lowStockItems.splice(index, 1);
            }
          }
          
          this.editingId = null;
          this.editingStock = null;
          
          // Refresh data
          await this.fetchLowStockItems();
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update stock');
        }
      } catch (error) {
        console.error('Error updating stock:', error);
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
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/low-stock', {
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
      }
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
  margin: 0 auto;
}

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
  font-weight: 600;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-container {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.search-box {
  flex: 2;
}

.stock-filter {
  flex: 1;
}

input, select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

input:focus, select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  outline: none;
}

.low-stock-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-height: 600px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.low-stock-table::-webkit-scrollbar {
  width: 8px;
}

.low-stock-table::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 8px;
}

.low-stock-table::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 8px;
  border: 2px solid #f8fafc;
}

.low-stock-table::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

.low-stock-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: #f8fafc;
}

.low-stock-table table {
  border-spacing: 0;
  width: 100%;
}

th {
  background-color: #f8fafc;
  padding: 1rem;
  font-weight: 600;
  color: #475569;
  text-align: left;
  box-shadow: 0 1px 0 #e2e8f0;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

tr:hover {
  background-color: #f8fafc;
}

.stock-badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  min-width: 60px;
}

.critical-stock {
  color: #dc2626;
  background-color: #fee2e2;
}

.low-stock {
  color: #854d0e;
  background-color: #fef3c7;
}

.normal-stock {
  color: #475569;
  background-color: #f1f5f9;
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
  background-color: #3b82f6;
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
  background-color: #2563eb;
  transform: translateY(-1px);
}

.save-btn {
  background-color: #10b981;
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
  background-color: #059669;
  transform: translateY(-1px);
}

.stock-input {
  width: 80px;
  padding: 0.5rem;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

.stock-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.no-data {
  text-align: center;
  color: #64748b;
  padding: 3rem;
  font-size: 1rem;
}

.no-data i {
  font-size: 2rem;
  color: #94a3b8;
  margin-bottom: 1rem;
  display: block;
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
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

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.confirm-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  background-color: #059669;
}

.cancel-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: #dc2626;
}

@media (max-width: 1024px) {
  .search-container {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .admin-container {
    padding-left: 60px;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .header {
    padding: 1rem;
  }
  
  th, td {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .header h2 {
    font-size: 1.25rem;
  }
  
  .stock-badge {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
  
  .edit-btn, .save-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
  }
}
</style>