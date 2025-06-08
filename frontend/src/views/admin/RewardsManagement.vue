<template>
    <div class="admin-container">
      <AdminNavbar :username="username" @logout="showLogoutModal = true" />
      
      <div class="admin-content">
        <h1><i class="fas fa-gift"></i> Rewards Management</h1>
        
        <!-- Statistics Cards -->
        <div class="dashboard-cards">
          <div class="card">
            <i class="fas fa-medal"></i>
            <h3>Total Points Awarded</h3>
            <p class="number">{{ statistics.totalPointsAwarded || 0 }}</p>
          </div>
          
          <div class="card">
            <i class="fas fa-exchange-alt"></i>
            <h3>Total Points Redeemed</h3>
            <p class="number">{{ statistics.totalPointsRedeemed || 0 }}</p>
          </div>
          
          <div class="card">
            <i class="fas fa-layer-group"></i>
            <h3>Available Reward Tiers</h3>
            <p class="number">{{ rewardTiers.length }}</p>
          </div>
        </div>
        
        <!-- Reward Tiers Management -->
        <div class="section-card">
          <div class="section-header">
            <h2><i class="fas fa-trophy"></i> Reward Tiers</h2>
            <button @click="openTierModal()" class="action-button">
              <i class="fas fa-plus"></i> Add New Tier
            </button>
          </div>
          
          <div class="table-container">
            <table v-if="rewardTiers.length">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Points Required</th>
                  <th>Discount Amount</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tier in rewardTiers" :key="tier.id">
                  <td>{{ tier.name }}</td>
                  <td>{{ tier.points_required }}</td>
                  <td>₱{{ formatPrice(tier.discount_amount) }}</td>
                  <td>{{ tier.description }}</td>
                  <td class="actions">
                    <button @click="openTierModal(tier)" class="edit-btn">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click="confirmDeleteTier(tier.id)" class="delete-btn">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="no-data">
              <i class="fas fa-info-circle"></i>
              No reward tiers configured yet
            </p>
          </div>
        </div>
        
        <!-- Top Reward Users -->
        <div class="section-card">
          <div class="section-header">
            <h2><i class="fas fa-users"></i> Top Reward Users</h2>
          </div>
          
          <div class="table-container">
            <table v-if="statistics.topUsers && statistics.topUsers.length">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Total Points</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in statistics.topUsers" :key="user.id">
                  <td>{{ user.username }}</td>
                  <td>{{ user.total_points }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="no-data">
              <i class="fas fa-info-circle"></i>
              No user reward data available yet
            </p>
          </div>
        </div>
      </div>
      
      <!-- Tier Modal -->
      <div v-if="showTierModal" class="modal-overlay">
        <div class="modal-content">
          <h2>{{ editingTier ? 'Edit Reward Tier' : 'Add New Reward Tier' }}</h2>
          
          <div class="form-group">
            <label for="tier-name">Name</label>
            <input 
              id="tier-name"
              v-model="tierForm.name" 
              placeholder="e.g., Bronze Level"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="tier-points">Points Required</label>
            <input 
              id="tier-points"
              v-model="tierForm.points_required" 
              type="number" 
              min="1"
              placeholder="e.g., 100"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="tier-discount">Discount Amount (₱)</label>
            <input 
              id="tier-discount"
              v-model="tierForm.discount_amount" 
              type="number" 
              min="1" 
              step="0.01"
              placeholder="e.g., 50"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="tier-description">Description</label>
            <textarea 
              id="tier-description"
              v-model="tierForm.description"
              placeholder="e.g., Basic reward tier with ₱50 discount"
              rows="3"
            ></textarea>
          </div>
          
          <div class="modal-buttons">
            <button @click="closeTierModal" class="cancel-btn">Cancel</button>
            <button @click="saveTier" class="submit-btn">
              {{ editingTier ? 'Update' : 'Add' }} Tier
            </button>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-content delete-modal">
          <h2>Confirm Delete</h2>
          <p>
            Are you sure you want to delete this reward tier?
            This action cannot be undone.
          </p>
          <div class="modal-buttons">
            <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
            <button @click="deleteTier" class="delete-btn">Delete</button>
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
  import AdminNavbar from '../../components/AdminNavbar.vue';
  import LogoutModal from '../../components/LogoutModal.vue';
  
  export default {
    name: 'RewardsManagement',
    components: {
      AdminNavbar,
      LogoutModal
    },
    data() {
      return {
        username: '',
        showLogoutModal: false,
        rewardTiers: [],
        statistics: {
          totalPointsAwarded: 0,
          totalPointsRedeemed: 0,
          topUsers: []
        },
        showTierModal: false,
        showDeleteModal: false,
        editingTier: null,
        tierIdToDelete: null,
        tierForm: {
          name: '',
          points_required: '',
          discount_amount: '',
          description: ''
        }
      };
    },
    mounted() {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        this.username = decoded.username || 'Admin';
      }
      this.fetchRewardTiers();
      this.fetchRewardStatistics();
    },
    methods: {
      async fetchRewardTiers() {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:7904/api/admin/rewards/tiers', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            this.rewardTiers = await response.json();
          } else {
            console.error('Error fetching reward tiers');
          }
        } catch (error) {
          console.error('Error fetching reward tiers:', error);
        }
      },
      
      async fetchRewardStatistics() {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:7904/api/admin/rewards/statistics', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            this.statistics = await response.json();
          } else {
            console.error('Error fetching reward statistics');
          }
        } catch (error) {
          console.error('Error fetching reward statistics:', error);
        }
      },
      
      openTierModal(tier = null) {
        this.editingTier = tier;
        
        if (tier) {
          this.tierForm = {
            name: tier.name,
            points_required: tier.points_required,
            discount_amount: tier.discount_amount,
            description: tier.description
          };
        } else {
          this.tierForm = {
            name: '',
            points_required: '',
            discount_amount: '',
            description: ''
          };
        }
        
        this.showTierModal = true;
      },
      
      closeTierModal() {
        this.showTierModal = false;
        this.editingTier = null;
        this.tierForm = {
          name: '',
          points_required: '',
          discount_amount: '',
          description: ''
        };
      },
      
      async saveTier() {
        try {
          // Input validation
          if (!this.tierForm.name || !this.tierForm.points_required || !this.tierForm.discount_amount) {
            alert('Please fill all required fields');
            return;
          }
          
          const token = localStorage.getItem('token');
          const url = this.editingTier 
            ? `http://localhost:7904/api/admin/rewards/tiers/${this.editingTier.id}`
            : 'http://localhost:7904/api/admin/rewards/tiers';
          
          const method = this.editingTier ? 'PUT' : 'POST';
          
          const response = await fetch(url, {
            method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: this.tierForm.name,
              points_required: parseInt(this.tierForm.points_required),
              discount_amount: parseFloat(this.tierForm.discount_amount),
              description: this.tierForm.description
            })
          });
          
          if (response.ok) {
            // Success - close modal and refresh data
            this.closeTierModal();
            this.fetchRewardTiers();
          } else {
            const error = await response.json();
            alert(error.message || 'An error occurred');
          }
        } catch (error) {
          console.error('Error saving reward tier:', error);
          alert('An error occurred while saving reward tier');
        }
      },
      
      confirmDeleteTier(id) {
        this.tierIdToDelete = id;
        this.showDeleteModal = true;
      },
      
      async deleteTier() {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:7904/api/admin/rewards/tiers/${this.tierIdToDelete}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            // Success - close modal and refresh data
            this.showDeleteModal = false;
            this.tierIdToDelete = null;
            this.fetchRewardTiers();
          } else {
            const error = await response.json();
            alert(error.message || 'An error occurred while deleting');
          }
        } catch (error) {
          console.error('Error deleting reward tier:', error);
          alert('An error occurred while deleting reward tier');
        }
      },
      
      formatPrice(price) {
        return Number(price).toFixed(2);
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
    }
  };
  </script>
  
  <style scoped>
  .admin-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px; /* Match sidebar width */
  }
  
  .admin-content {
    padding: 2rem;
  }
  
  h1 {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
    color: #333;
    display: flex;
    align-items: center;
  }
  
  h1 i {
    margin-right: 0.5rem;
    color: #27ae60;
  }
  
  .dashboard-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .card i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #27ae60;
  }
  
  .card h3 {
    font-size: 1rem;
    color: #666;
    margin-bottom: 0.5rem;
  }
  
  .card .number {
    font-size: 1.8rem;
    font-weight: bold;
    color: #333;
  }
  
  .section-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
  }
  
  .section-header {
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .section-header h2 {
    font-size: 1.3rem;
    font-weight: 600;
    display: flex;
    align-items: center;
  }
  
  .section-header h2 i {
    margin-right: 0.5rem;
    color: #27ae60;
  }
  
  .action-button {
    background-color: #2980b9;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  
  .action-button:hover {
    background-color: #3498db;
  }
  
  .action-button i {
    margin-right: 0.4rem;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 0.8rem 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    font-weight: 600;
    color: #333;
    background-color: #f9f9f9;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .edit-btn, .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .edit-btn {
    color: #2980b9;
  }
  
  .edit-btn:hover {
    color: #3498db;
  }
  
  .delete-btn {
    color: #e74c3c;
  }
  
  .delete-btn:hover {
    color: #c0392b;
  }
  
  .no-data {
    padding: 2rem;
    text-align: center;
    color: #666;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .no-data i {
    font-size: 2rem;
    color: #ccc;
  }
  
  /* Modal styles */
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
  
  .delete-modal {
    max-width: 400px;
    text-align: center;
  }
  
  .delete-modal p {
    margin: 1rem 0;
    color: #555;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }
  
  input, textarea {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.8rem;
    margin-top: 1.5rem;
  }
  
  .submit-btn, .cancel-btn, .delete-btn {
    padding: 0.6rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .submit-btn {
    background-color: #27ae60;
    color: white;
  }
  
  .submit-btn:hover {
    background-color: #219a52;
  }
  
  .cancel-btn {
    background-color: #95a5a6;
    color: white;
  }
  
  .cancel-btn:hover {
    background-color: #7f8c8d;
  }
  
  .delete-btn {
    background-color: #e74c3c;
    color: white;
  }
  
  .delete-btn:hover {
    background-color: #c0392b;
  }
  </style>