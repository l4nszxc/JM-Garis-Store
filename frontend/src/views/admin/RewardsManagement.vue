<template>
  <div class="admin-container">
    <AdminNavbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="admin-content">
      <!-- Header -->
      <div class="header">
        <h1>Rewards & Loyalty Management</h1>
        <p>Manage customer rewards and loyalty programs</p>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-medal"></i>
          </div>
          <div class="stat-info">
            <h3>{{ formatNumber(statistics.totalPointsAwarded || 0) }}</h3>
            <p>Points Awarded</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-exchange-alt"></i>
          </div>
          <div class="stat-info">
            <h3>{{ formatNumber(statistics.totalPointsRedeemed || 0) }}</h3>
            <p>Points Redeemed</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-crown"></i>
          </div>
          <div class="stat-info">
            <h3>{{ formatNumber(loyaltyStatistics.activeMembers || 0) }}</h3>
            <p>Active Members</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-star"></i>
          </div>
          <div class="stat-info">
            <h3>{{ formatNumber(loyaltyStatistics.monthlyLoyaltyPoints || 0) }}</h3>
            <p>Bonus Points</p>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          :class="['tab-btn', { active: activeTab === 'settings' }]"
          @click="activeTab = 'settings'"
        >
          <i class="fas fa-cog"></i>
          Settings
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'rewards' }]"
          @click="activeTab = 'rewards'"
        >
          <i class="fas fa-gift"></i>
          Reward Tiers
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'loyalty' }]"
          @click="activeTab = 'loyalty'"
        >
          <i class="fas fa-crown"></i>
          Loyalty Tiers
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'users' }]"
          @click="activeTab = 'users'"
        >
          <i class="fas fa-users"></i>
          Top Users
        </button>
      </div>

      <!-- Rewards Settings -->
      <div v-if="activeTab === 'settings'" class="content-card">
        <div class="card-header">
          <div>
            <h2>Rewards System Settings</h2>
            <p>Configure how customers earn and redeem reward points</p>
          </div>
          <button @click="showSettingsModal = true" class="btn btn-primary">
            <i class="fas fa-edit"></i>
            Edit Settings
          </button>
        </div>
        
        <div class="settings-display">
          <div class="setting-card">
            <div class="setting-icon">
              <i class="fas fa-coins"></i>
            </div>
            <div class="setting-info">
              <h3>Points Earning</h3>
              <p class="setting-value">
                {{ rewardsSettings.points_per_amount }} point{{ rewardsSettings.points_per_amount !== 1 ? 's' : '' }} 
                per ₱{{ formatPrice(rewardsSettings.amount_threshold) }} spent
              </p>
              <p class="setting-description">How customers earn reward points from purchases</p>
            </div>
          </div>
          
          <div class="setting-card">
            <div class="setting-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="setting-info">
              <h3>Point Value</h3>
              <p class="setting-value">₱{{ formatPrice(rewardsSettings.point_value) }} per point</p>
              <p class="setting-description">Monetary value of each reward point</p>
            </div>
          </div>
          
          <div class="setting-card full-width">
            <div class="setting-icon">
              <i class="fas fa-info-circle"></i>
            </div>
            <div class="setting-info">
              <h3>Display Message</h3>
              <p class="setting-value">{{ rewardsSettings.description }}</p>
              <p class="setting-description">Message shown to customers about the rewards system</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Reward Tiers Management -->
      <div v-if="activeTab === 'rewards'" class="content-card">
        <div class="card-header">
          <div>
            <h2>Reward Tiers</h2>
            <p>Manage point redemption rewards</p>
          </div>
          <button @click="openRewardModal()" class="btn btn-primary">
            <i class="fas fa-plus"></i>
            Add Reward
          </button>
        </div>
        
        <div class="info-banner">
          <i class="fas fa-info-circle"></i>
          <span>{{ rewardsSettings.description }}</span>
        </div>
        
        <div v-if="rewardTiers.length" class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Reward</th>
                <th>Points</th>
                <th>Value</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tier in rewardTiers" :key="tier.id">
                <td>
                  <div class="reward-name">{{ tier.name }}</div>
                </td>
                <td>
                  <span class="points-badge">{{ tier.points_required }}</span>
                </td>
                <td>
                  <span class="value-display">₱{{ formatPrice(tier.discount_amount) }}</span>
                </td>
                <td class="description">{{ tier.description }}</td>
                <td>
                  <div class="action-buttons">
                    <button @click="openRewardModal(tier)" class="action-btn edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click="confirmDeleteReward(tier.id)" class="action-btn delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="empty-state">
          <i class="fas fa-gift"></i>
          <h3>No reward tiers configured</h3>
          <p>Create your first reward tier to get started</p>
          <button @click="openRewardModal()" class="btn btn-primary">
            <i class="fas fa-plus"></i>
            Add First Reward
          </button>
        </div>
      </div>

      <!-- Loyalty Tiers Management -->
      <div v-if="activeTab === 'loyalty'" class="content-card">
        <div class="card-header">
          <div>
            <h2>Loyalty Tiers</h2>
            <p>Manage customer loyalty levels and bonus rewards</p>
          </div>
          <button @click="openLoyaltyModal()" class="btn btn-primary">
            <i class="fas fa-plus"></i>
            Add Tier
          </button>
        </div>
        
        <div class="info-banner">
          <i class="fas fa-info-circle"></i>
          <span>Based on monthly spending • Tiers expire after 2 months of reduced spending</span>
        </div>
        
        <div v-if="loyaltyTiers.length" class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Spending Range</th>
                <th>Bonus</th>
                <th>Benefits</th>
                <th>Members</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tier in loyaltyTiers" :key="tier.id">
                <td>
                  <div class="tier-badge" :class="tier.name.toLowerCase()">
                    {{ getTierIcon(tier.name) }}
                    {{ tier.name }}
                  </div>
                </td>
                <td>
                  <div class="spend-range">
                    ₱{{ formatPrice(tier.min_spend) }}
                    {{ tier.max_spend ? ` - ₱${formatPrice(tier.max_spend)}` : '+' }}
                  </div>
                </td>
                <td>
                  <span class="bonus-badge">+{{ tier.bonus_percentage }}%</span>
                </td>
                <td>
                  <div class="benefits">
                    <span class="benefit-item">
                      <i class="fas fa-star"></i>
                      Bonus Points
                    </span>
                    <span v-if="tier.has_free_product" class="benefit-item">
                      <i class="fas fa-gift"></i>
                      Free Product
                    </span>
                  </div>
                </td>
                <td class="member-count">{{ getLoyaltyUserCount(tier.name) }}</td>
                <td>
                  <div class="action-buttons">
                    <button @click="openLoyaltyModal(tier)" class="action-btn edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click="confirmDeleteLoyalty(tier.id)" class="action-btn delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="empty-state">
          <i class="fas fa-crown"></i>
          <h3>No loyalty tiers configured</h3>
          <p>Create loyalty tiers to reward your best customers</p>
          <button @click="openLoyaltyModal()" class="btn btn-primary">
            <i class="fas fa-plus"></i>
            Add First Tier
          </button>
        </div>
      </div>

      <!-- Top Users -->
      <div v-if="activeTab === 'users'" class="content-card">
        <div class="card-header">
          <div>
            <h2>Top Reward Users</h2>
            <p>Customers with the most reward points</p>
          </div>
        </div>
        
        <div v-if="statistics.topUsers && statistics.topUsers.length" class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Customer</th>
                <th>Total Points</th>
                <th>Point Value</th>
                <th>Loyalty Tier</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(user, index) in statistics.topUsers" :key="user.id">
                <td>
                  <div class="rank-badge" :class="getRankClass(index)">
                    <i :class="getRankIcon(index)"></i>
                    {{ index + 1 }}
                  </div>
                </td>
                <td>
                  <div class="username">{{ user.username }}</div>
                </td>
                <td>
                  <div class="points-display">{{ formatNumber(user.total_points) }}</div>
                </td>
                <td>
                  <div class="value-display">₱{{ formatPrice(user.total_points * rewardsSettings.point_value) }}</div>
                </td>
                <td>
                  <div v-if="user.loyalty_tier" class="tier-badge" :class="user.loyalty_tier.toLowerCase()">
                    {{ getTierIcon(user.loyalty_tier) }}
                    {{ user.loyalty_tier }}
                  </div>
                  <div v-else class="no-tier">No Tier</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="empty-state">
          <i class="fas fa-users"></i>
          <h3>No reward data available</h3>
          <p>Customer reward data will appear here once they start earning points</p>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="modal-overlay" @click="closeSettingsModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Rewards Settings</h3>
          <button @click="closeSettingsModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Points per Amount Spent</label>
            <div class="form-row">
              <div class="form-group">
                <input 
                  v-model="settingsForm.points_per_amount" 
                  type="number" 
                  min="1"
                  placeholder="1"
                  class="form-input"
                />
                <small>Number of points earned</small>
              </div>
              <div class="form-group">
                <input 
                  v-model="settingsForm.amount_threshold" 
                  type="number" 
                  min="1"
                  step="0.01"
                  placeholder="100.00"
                  class="form-input"
                />
                <small>Amount spent (₱)</small>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Point Value (₱)</label>
            <input 
              v-model="settingsForm.point_value" 
              type="number" 
              min="0.01"
              step="0.01"
              placeholder="0.50"
              class="form-input"
            />
            <small>Monetary value of each point when redeemed</small>
          </div>
          
          <div class="form-group">
            <label>Display Description</label>
            <textarea 
              v-model="settingsForm.description"
              placeholder="Customers earn points per amount spent • They can redeem points for discounts"
              rows="3"
              class="form-input"
            ></textarea>
            <small>Message shown to customers about the rewards system</small>
          </div>
          
          <div class="settings-preview" v-if="settingsForm.points_per_amount && settingsForm.amount_threshold">
            <div class="preview-header">
              <i class="fas fa-eye"></i>
              <span>Preview</span>
            </div>
            <div class="preview-content">
              <p><strong>Earning:</strong> {{ settingsForm.points_per_amount }} point{{ settingsForm.points_per_amount != 1 ? 's' : '' }} per ₱{{ formatPrice(settingsForm.amount_threshold) }} spent</p>
              <p><strong>Value:</strong> Each point = ₱{{ formatPrice(settingsForm.point_value) }}</p>
              <p><strong>Example:</strong> ₱{{ formatPrice(settingsForm.amount_threshold * 5) }} purchase = {{ settingsForm.points_per_amount * 5 }} points = ₱{{ formatPrice(settingsForm.points_per_amount * 5 * settingsForm.point_value) }} value</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeSettingsModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveSettings" class="btn btn-primary">Save Settings</button>
        </div>
      </div>
    </div>

    <!-- Reward Modal -->
    <div v-if="showRewardModal" class="modal-overlay" @click="closeRewardModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingReward ? 'Edit Reward Tier' : 'Create New Reward' }}</h3>
          <button @click="closeRewardModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Reward Name</label>
            <input 
              v-model="rewardForm.name" 
              placeholder="e.g., Small Discount"
              class="form-input"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Points Required</label>
              <input 
                v-model="rewardForm.points_required" 
                type="number" 
                min="1"
                placeholder="e.g., 10"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label>Discount Amount (₱)</label>
              <input 
                v-model="rewardForm.discount_amount" 
                type="number" 
                min="1" 
                step="0.01"
                placeholder="e.g., 5"
                class="form-input"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="rewardForm.description"
              placeholder="e.g., ₱5 off your next purchase"
              rows="3"
              class="form-input"
            ></textarea>
          </div>
          
          <div class="conversion-preview" v-if="rewardForm.points_required && rewardForm.discount_amount">
            <i class="fas fa-calculator"></i>
            <span>
              Conversion: {{ rewardForm.points_required }} points = ₱{{ rewardForm.discount_amount }} 
              (₱{{ (rewardForm.points_required * rewardsSettings.point_value).toFixed(2) }} point value)
            </span>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeRewardModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveReward" class="btn btn-primary">
            {{ editingReward ? 'Update Reward' : 'Create Reward' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loyalty Modal -->
    <div v-if="showLoyaltyModal" class="modal-overlay" @click="closeLoyaltyModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingLoyalty ? 'Edit Loyalty Tier' : 'Create New Tier' }}</h3>
          <button @click="closeLoyaltyModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Tier Name</label>
            <input 
              v-model="loyaltyForm.name" 
              placeholder="e.g., Platinum"
              class="form-input"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Minimum Monthly Spend (₱)</label>
              <input 
                v-model="loyaltyForm.min_spend" 
                type="number" 
                min="0"
                step="100"
                placeholder="10000"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label>Maximum Monthly Spend (₱)</label>
              <input 
                v-model="loyaltyForm.max_spend" 
                type="number" 
                min="0"
                step="100"
                placeholder="Leave empty for unlimited"
                class="form-input"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label>Bonus Points Percentage (%)</label>
            <input 
              v-model="loyaltyForm.bonus_percentage" 
              type="number" 
              min="0"
              max="100"
              step="1"
              placeholder="5"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox"
                v-model="loyaltyForm.has_free_product"
              />
              Include monthly free product
            </label>
          </div>
          
          <div class="tier-preview" v-if="loyaltyForm.name && loyaltyForm.min_spend && loyaltyForm.bonus_percentage">
            <div class="preview-badge" :class="loyaltyForm.name.toLowerCase()">
              {{ loyaltyForm.name }}
            </div>
            <div class="preview-details">
              <span>₱{{ formatPrice(loyaltyForm.min_spend) }}{{ loyaltyForm.max_spend ? ` - ₱${formatPrice(loyaltyForm.max_spend)}` : '+' }} monthly</span>
              <span>+{{ loyaltyForm.bonus_percentage }}% bonus points</span>
              <span v-if="loyaltyForm.has_free_product">Monthly free product included</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeLoyaltyModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveLoyalty" class="btn btn-primary">
            {{ editingLoyalty ? 'Update Tier' : 'Create Tier' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal small-modal">
        <div class="modal-header">
          <h3>Confirm Deletion</h3>
        </div>
        
        <div class="modal-body">
          <div class="delete-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Are you sure you want to delete this {{ deleteType }}? This action cannot be undone.</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="confirmDelete" class="btn btn-danger">Delete</button>
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
      activeTab: 'settings',
      rewardTiers: [],
      loyaltyTiers: [],
      rewardsSettings: {
        points_per_amount: 1,
        amount_threshold: 100.00,
        point_value: 0.50,
        description: 'Customers earn 1 point per ₱100 spent • They can redeem points for discounts'
      },
      statistics: {
        totalPointsAwarded: 0,
        totalPointsRedeemed: 0,
        topUsers: []
      },
      loyaltyStatistics: {
        activeMembers: 0,
        monthlyLoyaltyPoints: 0,
        tierDistribution: []
      },
      // Settings Modal
      showSettingsModal: false,
      settingsForm: {
        points_per_amount: 1,
        amount_threshold: 100.00,
        point_value: 0.50,
        description: ''
      },
      // Reward Modal
      showRewardModal: false,
      editingReward: null,
      rewardForm: {
        name: '',
        points_required: '',
        discount_amount: '',
        description: ''
      },
      // Loyalty Modal
      showLoyaltyModal: false,
      editingLoyalty: null,
      loyaltyForm: {
        name: '',
        min_spend: '',
        max_spend: '',
        bonus_percentage: '',
        has_free_product: false
      },
      // Delete Modal
      showDeleteModal: false,
      deleteType: '',
      deleteId: null
    };
  },
  mounted() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username || 'Admin';
    }
    this.fetchAllData();
  },
  methods: {
    async fetchAllData() {
      await Promise.all([
        this.fetchRewardsSettings(),
        this.fetchRewardTiers(),
        this.fetchLoyaltyTiers(),
        this.fetchRewardStatistics(),
        this.fetchLoyaltyStatistics()
      ]);
    },

    async fetchRewardsSettings() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/rewards/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          this.rewardsSettings = await response.json();
        }
      } catch (error) {
        console.error('Error fetching rewards settings:', error);
      }
    },

    async fetchRewardTiers() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/rewards/tiers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          this.rewardTiers = await response.json();
        }
      } catch (error) {
        console.error('Error fetching reward tiers:', error);
      }
    },

    async fetchLoyaltyTiers() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/loyalty/tiers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          this.loyaltyTiers = await response.json();
        }
      } catch (error) {
        console.error('Error fetching loyalty tiers:', error);
      }
    },
    
    async fetchRewardStatistics() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/rewards/statistics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          this.statistics = await response.json();
        }
      } catch (error) {
        console.error('Error fetching reward statistics:', error);
      }
    },

    async fetchLoyaltyStatistics() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/loyalty/statistics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          this.loyaltyStatistics = await response.json();
        }
      } catch (error) {
        console.error('Error fetching loyalty statistics:', error);
      }
    },

    getLoyaltyUserCount(tierName) {
      const tier = this.loyaltyStatistics.tierDistribution?.find(t => t.tier_name === tierName);
      return tier ? tier.user_count : 0;
    },

    getTierIcon(tierName) {
      const icons = {
        'Bronze': '🥉',
        'Silver': '🥈',
        'Gold': '🥇',
        'Platinum': '💎'
      };
      return icons[tierName] || '👤';
    },

    getRankClass(index) {
      if (index === 0) return 'rank-1';
      if (index === 1) return 'rank-2';
      if (index === 2) return 'rank-3';
      return 'rank-other';
    },

    getRankIcon(index) {
      if (index === 0) return 'fas fa-crown';
      if (index === 1) return 'fas fa-medal';
      if (index === 2) return 'fas fa-award';
      return 'fas fa-user';
    },

    // Settings Modal Methods
    openSettingsModal() {
      this.settingsForm = { ...this.rewardsSettings };
      this.showSettingsModal = true;
    },

    closeSettingsModal() {
      this.showSettingsModal = false;
      this.settingsForm = {
        points_per_amount: 1,
        amount_threshold: 100.00,
        point_value: 0.50,
        description: ''
      };
    },

    async saveSettings() {
      try {
        if (!this.settingsForm.points_per_amount || !this.settingsForm.amount_threshold || !this.settingsForm.point_value) {
          alert('Please fill all required fields');
          return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/rewards/settings', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.settingsForm)
        });

        if (response.ok) {
          await this.fetchRewardsSettings();
          this.closeSettingsModal();
          alert('Rewards settings updated successfully');
        } else {
          const error = await response.json();
          alert(error.message || 'An error occurred');
        }
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('An error occurred while saving settings');
      }
    },
    
    // Reward Modal Methods
    openRewardModal(tier = null) {
      this.editingReward = tier;
      if (tier) {
        this.rewardForm = { ...tier };
      } else {
        this.rewardForm = {
          name: '',
          points_required: '',
          discount_amount: '',
          description: ''
        };
      }
      this.showRewardModal = true;
    },
    
    closeRewardModal() {
      this.showRewardModal = false;
      this.editingReward = null;
      this.rewardForm = {
        name: '',
        points_required: '',
        discount_amount: '',
        description: ''
      };
    },
    
    async saveReward() {
      try {
        if (!this.rewardForm.name || !this.rewardForm.points_required || !this.rewardForm.discount_amount) {
          alert('Please fill all required fields');
          return;
        }
        
        const token = localStorage.getItem('token');
        const url = this.editingReward 
          ? `http://localhost:7904/api/admin/rewards/tiers/${this.editingReward.id}`
          : 'http://localhost:7904/api/admin/rewards/tiers';
        
        const method = this.editingReward ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: this.rewardForm.name,
            points_required: parseInt(this.rewardForm.points_required),
            discount_amount: parseFloat(this.rewardForm.discount_amount),
            description: this.rewardForm.description
          })
        });
        
        if (response.ok) {
          this.closeRewardModal();
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

    // Loyalty Modal Methods
    openLoyaltyModal(tier = null) {
      this.editingLoyalty = tier;
      if (tier) {
        this.loyaltyForm = { ...tier };
      } else {
        this.loyaltyForm = {
          name: '',
          min_spend: '',
          max_spend: '',
          bonus_percentage: '',
          has_free_product: false
        };
      }
      this.showLoyaltyModal = true;
    },

    closeLoyaltyModal() {
      this.showLoyaltyModal = false;
      this.editingLoyalty = null;
      this.loyaltyForm = {
        name: '',
        min_spend: '',
        max_spend: '',
        bonus_percentage: '',
        has_free_product: false
      };
    },

    async saveLoyalty() {
      try {
        if (!this.loyaltyForm.name || !this.loyaltyForm.min_spend || !this.loyaltyForm.bonus_percentage) {
          alert('Please fill all required fields');
          return;
        }
        
        const token = localStorage.getItem('token');
        const url = this.editingLoyalty 
          ? `http://localhost:7904/api/admin/loyalty/tiers/${this.editingLoyalty.id}`
          : 'http://localhost:7904/api/admin/loyalty/tiers';
        
        const method = this.editingLoyalty ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: this.loyaltyForm.name,
            min_spend: parseFloat(this.loyaltyForm.min_spend),
            max_spend: this.loyaltyForm.max_spend ? parseFloat(this.loyaltyForm.max_spend) : null,
            bonus_percentage: parseFloat(this.loyaltyForm.bonus_percentage),
            has_free_product: this.loyaltyForm.has_free_product
          })
        });
        
        if (response.ok) {
          this.closeLoyaltyModal();
          this.fetchLoyaltyTiers();
          this.fetchLoyaltyStatistics();
        } else {
          const error = await response.json();
          alert(error.message || 'An error occurred');
        }
      } catch (error) {
        console.error('Error saving loyalty tier:', error);
        alert('An error occurred while saving loyalty tier');
      }
    },
    
    // Delete Methods
    confirmDeleteReward(id) {
      this.deleteType = 'reward tier';
      this.deleteId = id;
      this.showDeleteModal = true;
    },

    confirmDeleteLoyalty(id) {
      this.deleteType = 'loyalty tier';
      this.deleteId = id;
      this.showDeleteModal = true;
    },
    
    async confirmDelete() {
      try {
        const token = localStorage.getItem('token');
        const endpoint = this.deleteType === 'reward tier' ? 'rewards' : 'loyalty';
        
        const response = await fetch(`http://localhost:7904/api/admin/${endpoint}/tiers/${this.deleteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          this.showDeleteModal = false;
          this.deleteId = null;
          this.deleteType = '';
          
          if (endpoint === 'rewards') {
            this.fetchRewardTiers();
          } else {
            this.fetchLoyaltyTiers();
            this.fetchLoyaltyStatistics();
          }
        } else {
          const error = await response.json();
          alert(error.message || 'An error occurred while deleting');
        }
      } catch (error) {
        console.error('Error deleting:', error);
        alert('An error occurred while deleting');
      }
    },
    
    formatPrice(price) {
      return Number(price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    formatNumber(num) {
      return Number(num).toLocaleString('en-US');
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
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
  padding-left: 250px;
}

.admin-content {
  padding: 2rem;
  margin: 0 auto;
}

/* Header */
.header {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.header h1 {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 600;
}

.header p {
  color: #666;
  margin: 0;
  font-size: 1rem;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-info h3 {
  color: #333;
  margin: 0 0 0.25rem 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.stat-info p {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #333;
}

.tab-btn.active {
  background: #f8f9fa;
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Content Card */
.content-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.card-header {
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.card-header h2 {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.card-header p {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

/* Settings Display */
.settings-display {
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.setting-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.setting-card.full-width {
  grid-column: 1 / -1;
}

.setting-icon {
  width: 48px;
  height: 48px;
  background: #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.setting-info h3 {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.setting-value {
  color: #3b82f6;
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
}

.setting-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

/* Info Banner */
.info-banner {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #0369a1;
  font-size: 0.9rem;
}

.info-banner i {
  color: #0369a1;
}

/* Table */
.table-container {
  padding: 2rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.9rem;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.data-table tbody tr:hover {
  background-color: #f8fafc;
}

/* Table Content Styles */
.reward-name {
  font-weight: 500;
  color: #333;
}

.points-badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.875rem;
}

.value-display {
  font-weight: 600;
  color: #059669;
}

.description {
  color: #666;
  font-size: 0.9rem;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.875rem;
}

.tier-badge.bronze {
  background: #fef3c7;
  color: #92400e;
}

.tier-badge.silver {
  background: #f1f5f9;
  color: #475569;
}

.tier-badge.gold {
  background: #fef3c7;
  color: #92400e;
}

.tier-badge.platinum {
  background: #f3e8ff;
  color: #7c3aed;
}

.spend-range {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.bonus-badge {
  background: #dcfce7;
  color: #166534;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
}

.benefits {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

.benefit-item i {
  color: #10b981;
}

.member-count {
  font-weight: 600;
  color: #333;
  text-align: center;
}

.username {
  font-weight: 500;
  color: #333;
}

.points-display {
  font-weight: 600;
  color: #3b82f6;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.rank-badge.rank-1 {
  background: #fef3c7;
  color: #92400e;
}

.rank-badge.rank-2 {
  background: #f1f5f9;
  color: #475569;
}

.rank-badge.rank-3 {
  background: #fef2f2;
  color: #dc2626;
}

.rank-badge.rank-other {
  background: #f3f4f6;
  color: #6b7280;
}

.no-tier {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.875rem;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: all 0.2s;
}

.action-btn.edit {
  background-color: #3b82f6;
  color: white;
}

.action-btn.edit:hover {
  background-color: #2563eb;
}

.action-btn.delete {
  background-color: #ef4444;
  color: white;
}

.action-btn.delete:hover {
  background-color: #dc2626;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state i {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #374151;
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 2rem 0;
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

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal.small-modal {
  max-width: 400px;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 2rem;
}

.modal-footer {
  padding: 1rem 2rem 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* Form Styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

/* Preview Components */
.conversion-preview {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.conversion-preview i {
  color: #0369a1;
}

.conversion-preview span {
  color: #075985;
  font-size: 0.9rem;
}

.tier-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preview-details span {
  color: #64748b;
  font-size: 0.875rem;
}

/* Delete Warning */
.delete-warning {
  text-align: center;
  padding: 1rem;
}

.delete-warning i {
  font-size: 3rem;
  color: #f59e0b;
  margin-bottom: 1rem;
}

.delete-warning p {
  color: #374151;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-container {
    padding-left: 0;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .tab-navigation {
    flex-direction: column;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .table-container {
    overflow-x: auto;
  }
}
</style>