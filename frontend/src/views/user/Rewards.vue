<template>
  <div class="rewards-page min-h-screen bg-gray-100">
    <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading your rewards...</p>
    </div>

    <div v-else class="container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <div class="title-section">
            <h1>Rewards Center</h1>
            <p class="subtitle">Earn points with every purchase and unlock exclusive rewards</p>
          </div>
          
          <div class="points-display">
            <div class="points-card">
              <div class="points-number">{{ points }}</div>
              <div class="points-label">Available Points</div>
              <div class="points-value">Worth ₱{{ convertPointsToPeso(points) }}</div>
            </div>
            
            <!-- New Convertible Points Display -->
            <div class="conversion-card">
              <div class="conversion-number">₱{{ convertPointsToPeso(points) }}</div>
              <div class="conversion-label">Convertible Value</div>
              <div class="conversion-rate">Rate: 2 points = ₱1</div>
            </div>
          </div>
        </div>
        
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-number">{{ totalPointsEarned }}</div>
            <div class="stat-label">Total Earned</div>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <div class="stat-number">₱{{ convertPointsToPeso(totalPointsEarned) }}</div>
            <div class="stat-label">Total Value Earned</div>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <div class="stat-number">30:100</div>
            <div class="stat-label">Point Ratio</div>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <div class="stat-number">2:₱1</div>
            <div class="stat-label">Conversion Rate</div>
          </div>
        </div>
      </div>

      <!-- Point Conversion Summary Card -->
      <div class="conversion-summary-section" v-if="autoShowConversion">
        <div class="conversion-summary-header">
          <h2>💰 Point Conversion Summary</h2>
          <div class="auto-convert-toggle">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                v-model="autoShowConversion" 
                @change="toggleAutoConversion"
              >
              <span class="toggle-slider"></span>
              Auto-show conversion
            </label>
          </div>
        </div>
        
        <div class="conversion-grid">
          <div class="conversion-item">
            <div class="conversion-icon">🪙</div>
            <div class="conversion-details">
              <div class="conversion-amount">{{ points }} Points</div>
              <div class="conversion-desc">Your current balance</div>
            </div>
          </div>
          
          <div class="conversion-arrow">→</div>
          
          <div class="conversion-item">
            <div class="conversion-icon">💵</div>
            <div class="conversion-details">
              <div class="conversion-amount peso">₱{{ convertPointsToPeso(points) }}</div>
              <div class="conversion-desc">Equivalent cash value</div>
            </div>
          </div>
          
          <div class="conversion-item">
            <div class="conversion-icon">🎯</div>
            <div class="conversion-details">
              <div class="conversion-amount">{{ Math.floor(points / 10) }}</div>
              <div class="conversion-desc">Possible rewards</div>
            </div>
          </div>
        </div>
        
        <div class="conversion-info-box">
          <div class="info-row">
            <span class="info-label">Conversion Rate:</span>
            <span class="info-value">2 points = ₱1.00</span>
          </div>
          <div class="info-row">
            <span class="info-label">Minimum Redemption:</span>
            <span class="info-value">10 points (₱5.00)</span>
          </div>
          <div class="info-row">
            <span class="info-label">Next Milestone:</span>
            <span class="info-value">{{ getNextMilestone() }}</span>
          </div>
        </div>
      </div>

      <!-- Loyalty Status -->
      <div class="loyalty-section">
        <div class="loyalty-header">
          <h2>Loyalty Status</h2>
          <div class="tier-badge" :class="getTierClass(getCurrentTierName())">
            <span class="tier-icon">{{ getTierIcon(getCurrentTierName()) }}</span>
            {{ getCurrentTierName() }}
          </div>
        </div>
        
        <div class="loyalty-stats">
          <div class="loyalty-stat">
            <div class="loyalty-stat-value">+{{ getCurrentTierBonus() }}%</div>
            <div class="loyalty-stat-label">Bonus Points</div>
          </div>
          <div class="loyalty-stat">
            <div class="loyalty-stat-value">₱{{ formatNumber(loyaltyStatus?.current_month_spend || 0) }}</div>
            <div class="loyalty-stat-label">This Month</div>
          </div>
        </div>
        
        <div class="progress-section">
          <div class="progress-header">
            <span>Progress to Next Tier</span>
            <span class="progress-text">{{ getNextTierInfo() }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: getTierProgress() + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Tier Information -->
      <div class="tiers-section">
        <h2>Loyalty Tiers</h2>
        <div class="tiers-grid">
          <div class="tier-card" :class="{ active: isCurrentTier('Bronze') }">
            <div class="tier-header bronze">
              <div class="tier-icon">🥉</div>
              <div class="tier-info">
                <h3>Bronze</h3>
                <p>₱10K - ₱15K/month</p>
              </div>
              <div class="tier-bonus">+5%</div>
            </div>
            <ul class="tier-benefits">
              <li>+5% bonus points on purchases</li>
            </ul>
          </div>
          
          <div class="tier-card" :class="{ active: isCurrentTier('Silver') }">
            <div class="tier-header silver">
              <div class="tier-icon">🥈</div>
              <div class="tier-info">
                <h3>Silver</h3>
                <p>₱16K - ₱20K/month</p>
              </div>
              <div class="tier-bonus">+10%</div>
            </div>
            <ul class="tier-benefits">
              <li>+10% bonus points on purchases</li>
            </ul>
          </div>
          
          <div class="tier-card" :class="{ active: isCurrentTier('Gold') }">
            <div class="tier-header gold">
              <div class="tier-icon">🥇</div>
              <div class="tier-info">
                <h3>Gold</h3>
                <p>₱21K+/month</p>
              </div>
              <div class="tier-bonus">+15%</div>
            </div>
            <ul class="tier-benefits">
              <li>+15% bonus points on purchases</li>
              <li>Free product each month</li>
            </ul>
          </div>
        </div>
        
        <div class="tier-note">
          <i class="info-icon">ℹ️</i>
          <p>Tier status is based on monthly spending. Maintain spending for 2+ months to keep your tier.</p>
        </div>
      </div>

      <!-- Available Rewards -->
      <div class="rewards-section">
        <div class="section-header">
          <h2>Redeem Rewards</h2>
          <div class="conversion-info">2 points = ₱1 discount</div>
        </div>
        
        <div v-if="availableRewards.length" class="rewards-grid">
          <div v-for="reward in availableRewards" :key="reward.id" class="reward-card">
            <div class="reward-header">
              <div class="reward-points">{{ reward.points_required }}</div>
              <div class="reward-points-label">points</div>
            </div>
            <div class="reward-amount">₱{{ reward.discount_amount }} OFF</div>
            <div class="reward-description">{{ reward.description }}</div>
            <!-- Updated to show peso equivalent -->
            <div class="reward-value">
              Point Value: ₱{{ convertPointsToPeso(reward.points_required) }} 
              <span class="savings-indicator" v-if="reward.discount_amount > convertPointsToPeso(reward.points_required)">
                (Save ₱{{ (reward.discount_amount - convertPointsToPeso(reward.points_required)).toFixed(2) }})
              </span>
            </div>
            <button 
              @click="showRedemptionConfirmation(reward)"
              :disabled="points < reward.points_required"
              class="reward-button"
              :class="{ disabled: points < reward.points_required }"
            >
              <span v-if="points >= reward.points_required">Redeem Now</span>
              <span v-else>Need {{ reward.points_required - points }} more (₱{{ convertPointsToPeso(reward.points_required - points) }})</span>
            </button>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <div class="empty-icon">🎁</div>
          <h3>No rewards available</h3>
          <p>Check back later for new rewards</p>
        </div>
      </div>

      <!-- Reward History -->
      <div class="history-section">
        <h2>Recent Activity</h2>
        <div class="history-container">
          <div v-if="rewardHistory.length" class="history-list">
            <div v-for="item in rewardHistory.slice(0, 10)" :key="item.id" class="history-item">
              <div class="history-icon" :class="{ earned: item.points > 0, redeemed: item.points < 0 }">
                <span v-if="item.points > 0">+</span>
                <span v-else>−</span>
              </div>
              <div class="history-content">
                <div class="history-description">{{ item.description }}</div>
                <div class="history-date">{{ formatDate(item.created_at || item.date) }}</div>
              </div>
              <div class="history-points" :class="{ earned: item.points > 0, redeemed: item.points < 0 }">
                <div class="points-display">{{ Math.abs(item.points) }} pts</div>
                <div class="peso-display">₱{{ convertPointsToPeso(Math.abs(item.points)) }}</div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No activity yet</h3>
            <p>Start shopping to earn your first points</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Redemption Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="cancelRedemption">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon">🎁</div>
          <h3>Confirm Redemption</h3>
        </div>
        
        <div class="modal-content">
          <div class="redemption-summary">
            <div class="summary-row">
              <span>Points to redeem:</span>
              <strong>{{ selectedReward?.points_required }}</strong>
            </div>
            <div class="summary-row">
              <span>Point value:</span>
              <span>₱{{ convertPointsToPeso(selectedReward?.points_required || 0) }}</span>
            </div>
            <div class="summary-row">
              <span>Discount value:</span>
              <strong>₱{{ selectedReward?.discount_amount }}</strong>
            </div>
            <div class="summary-row bonus" v-if="selectedReward && selectedReward.discount_amount > convertPointsToPeso(selectedReward.points_required)">
              <span>Bonus value:</span>
              <strong class="bonus-amount">₱{{ (selectedReward.discount_amount - convertPointsToPeso(selectedReward.points_required)).toFixed(2) }}</strong>
            </div>
          </div>
          
          <div class="modal-note">
            <i class="info-icon">ℹ️</i>
            <p>This discount will be available for 30 days and can be used during checkout.</p>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="cancelRedemption" class="btn-secondary">Cancel</button>
          <button @click="confirmRedemption" class="btn-primary">Confirm Redemption</button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showRedeemModal" class="modal-overlay" @click="closeRedeemModal">
      <div class="modal success-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon success">✅</div>
          <h3>Redemption Successful!</h3>
        </div>
        
        <div class="modal-content">
          <p>You've successfully redeemed <strong>{{ redeemedPoints }} points</strong> (₱{{ convertPointsToPeso(redeemedPoints) }} value) for a <strong>₱{{ redeemedAmount }} discount</strong>.</p>
          
          <div class="usage-steps">
            <h4>How to use your discount:</h4>
            <ol>
              <li>Add items to your cart</li>
              <li>Look for the discount during checkout</li>
              <li>Apply it to your order</li>
              <li>Enjoy your savings!</li>
            </ol>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeRedeemModal" class="btn-primary full-width">Got it!</button>
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
import Navbar from '../../components/Navbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';

export default {
  name: 'Rewards',
  components: {
    Navbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      points: 0,
      totalPointsEarned: 0,
      rewardHistory: [],
      availableRewards: [],
      loyaltyStatus: null,
      loyaltyTiers: [
        { name: 'Bronze', min_spend: 10000, max_spend: 15000, bonus_percentage: 5, has_free_product: false },
        { name: 'Silver', min_spend: 16000, max_spend: 20000, bonus_percentage: 10, has_free_product: false },
        { name: 'Gold', min_spend: 21000, max_spend: null, bonus_percentage: 15, has_free_product: true }
      ],
      showRedeemModal: false,
      showLogoutModal: false,
      showConfirmModal: false,
      selectedReward: null,
      redeemedPoints: 0,
      redeemedAmount: 0,
      autoShowConversion: true,
      loading: true,
      error: null
    };
  },
  async mounted() {
    if (this.initializeUser()) {
      await this.fetchUserData();
    }
    
    // Load auto conversion preference from localStorage
    const savedPreference = localStorage.getItem('autoShowConversion');
    if (savedPreference !== null) {
      this.autoShowConversion = JSON.parse(savedPreference);
    }
  },
  methods: {
    // New method to convert points to peso
    convertPointsToPeso(points) {
      if (!points || points < 0) return '0.00';
      // 2 points = 1 peso, so divide by 2
      return (points / 2).toFixed(2);
    },

    // New method to get next milestone
    getNextMilestone() {
      const currentPoints = this.points;
      const milestones = [10, 20, 50, 100, 200, 500, 1000];
      
      for (let milestone of milestones) {
        if (currentPoints < milestone) {
          const needed = milestone - currentPoints;
          return `${needed} points to reach ${milestone} points (₱${this.convertPointsToPeso(milestone)})`;
        }
      }
      
      // If past all milestones
      const nextMilestone = Math.ceil(currentPoints / 100) * 100;
      const needed = nextMilestone - currentPoints;
      return `${needed} points to reach ${nextMilestone} points (₱${this.convertPointsToPeso(nextMilestone)})`;
    },

    // New method to toggle auto conversion display
    toggleAutoConversion() {
      localStorage.setItem('autoShowConversion', JSON.stringify(this.autoShowConversion));
    },

    async fetchWithAuth(url, options = {}) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          throw new Error('No authentication token');
        }

        const response = await fetch(`http://localhost:7904${url}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            this.$router.push('/login');
            throw new Error('Authentication expired');
          }
          throw new Error('API request failed');
        }

        return response.json();
      } catch (error) {
        throw error;
      }
    },

    handleApiError(error, action) {
      console.error(`Error ${action}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        this.$router.push('/login');
      }
    },

    initializeUser() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return false;
      }
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        this.username = decoded.username;
        return true;
      } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
        this.$router.push('/login');
        return false;
      }
    },

    async fetchUserData() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchUserPoints(),
          this.fetchRewardHistory(),
          this.fetchAvailableRewards(),
          this.fetchLoyaltyStatus()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.message.includes('Authentication')) {
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },

    async fetchUserPoints() {
      try {
        const data = await this.fetchWithAuth('/api/rewards/points');
        this.points = data.points;
      } catch (error) {
        this.handleApiError(error, 'fetching points');
      }
    },

    async fetchRewardHistory() {
      try {
        const data = await this.fetchWithAuth('/api/rewards/history');
        this.rewardHistory = data.history.map(item => ({
          ...item,
          date: item.created_at || item.date,
          points: Number(item.points),
          description: item.description || 'Reward transaction'
        }));
        this.totalPointsEarned = data.totalPointsEarned || 0;
      } catch (error) {
        this.handleApiError(error, 'fetching reward history');
        this.rewardHistory = [];
        this.totalPointsEarned = 0;
      }
    },

    async fetchAvailableRewards() {
      try {
        this.availableRewards = await this.fetchWithAuth('/api/rewards/available');
      } catch (error) {
        this.handleApiError(error, 'fetching available rewards');
      }
    },

    async fetchLoyaltyStatus() {
      try {
        const response = await fetch('http://localhost:7904/api/rewards/loyalty-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          this.loyaltyStatus = await response.json();
        }
      } catch (error) {
        console.error('Error fetching loyalty status:', error);
        this.loyaltyStatus = {
          tier_name: null,
          bonus_percentage: 0,
          current_month_spend: 0,
          has_free_product: false
        };
      }
    },

    getTierClass(tierName) {
      const classes = {
        'Bronze': 'bronze',
        'Silver': 'silver',
        'Gold': 'gold'
      };
      return classes[tierName] || 'member';
    },

    getTierIcon(tierName) {
      const icons = {
        'Bronze': '🥉',
        'Silver': '🥈',
        'Gold': '🥇'
      };
      return icons[tierName] || '👤';
    },

    getCurrentTierName() {
        console.log('Current loyalty status:', this.loyaltyStatus);
        
        if (this.loyaltyStatus && this.loyaltyStatus.tier_name) {
            console.log('Using database tier:', this.loyaltyStatus.tier_name);
            return this.loyaltyStatus.tier_name;
        }

        if (!this.loyaltyStatus || !this.loyaltyStatus.current_month_spend) {
            console.log('No loyalty status or spending data, returning Member');
            return 'Member';
        }

        const spend = parseFloat(this.loyaltyStatus.current_month_spend);
        console.log('Calculating tier for spend:', spend);
        
        if (spend >= 21000) {
            console.log('Qualifies for Gold');
            return 'Gold';
        } else if (spend >= 16000) {
            console.log('Qualifies for Silver');
            return 'Silver';
        } else if (spend >= 10000) {
            console.log('Qualifies for Bronze');
            return 'Bronze';
        } else {
            console.log('Member tier');
            return 'Member';
        }
    },

    getCurrentTierBonus() {
        if (this.loyaltyStatus && 
            this.loyaltyStatus.bonus_percentage !== null && 
            this.loyaltyStatus.bonus_percentage !== undefined) {
            return this.loyaltyStatus.bonus_percentage;
        }

        const currentTier = this.getCurrentTierName();
        const tier = this.loyaltyTiers.find(t => t.name === currentTier);
        return tier ? tier.bonus_percentage : 0;
    },

    isCurrentTier(tierName) {
      return this.getCurrentTierName() === tierName;
    },

    getTierProgress() {
        if (!this.loyaltyStatus || !this.loyaltyStatus.current_month_spend) return 0;
        
        const currentSpend = this.loyaltyStatus.current_month_spend;
        const currentTier = this.getCurrentTierName();
        
        if (currentTier === 'Gold') return 100;
        
        let nextTierMin = 0;
        let currentTierMin = 0;
        
        if (currentTier === 'Member') {
            currentTierMin = 0;
            nextTierMin = 10000;
        } else if (currentTier === 'Bronze') {
            currentTierMin = 10000;
            nextTierMin = 16000;
        } else if (currentTier === 'Silver') {
            currentTierMin = 16000;
            nextTierMin = 21000;
        }
        
        if (nextTierMin === 0) return 100;
        
        const progressRange = nextTierMin - currentTierMin;
        const currentProgress = Math.max(0, currentSpend - currentTierMin);
        
        return Math.min(Math.max((currentProgress / progressRange) * 100, 0), 100);
    },

    getNextTierInfo() {
        if (!this.loyaltyStatus) return 'Spend ₱10,000 for Bronze tier';
        
        const currentSpend = this.loyaltyStatus.current_month_spend;
        const currentTier = this.getCurrentTierName();
        
        if (currentTier === 'Gold') {
            return 'Highest tier achieved!';
        }
        
        let nextTierName = '';
        let nextTierMin = 0;
        
        if (currentTier === 'Member') {
            nextTierName = 'Bronze';
            nextTierMin = 10000;
        } else if (currentTier === 'Bronze') {
            nextTierName = 'Silver';
            nextTierMin = 16000;
        } else if (currentTier === 'Silver') {
            nextTierName = 'Gold';
            nextTierMin = 21000;
        }
        
        const needed = nextTierMin - currentSpend;
        
        if (needed <= 0) {
            return `Qualified for ${nextTierName}!`;
        }
        
        return `₱${this.formatNumber(needed)} to ${nextTierName}`;
    },

    showRedemptionConfirmation(reward) {
      if (this.points < reward.points_required) return;
      this.selectedReward = reward;
      this.showConfirmModal = true;
    },

    cancelRedemption() {
      this.showConfirmModal = false;
      this.selectedReward = null;
    },

    async confirmRedemption() {
      if (!this.selectedReward) return;
      
      try {
        await this.redeemReward(this.selectedReward);
        this.showConfirmModal = false;
      } catch (error) {
        console.error('Redemption error:', error);
        alert(error.message || 'Failed to redeem reward');
        this.showConfirmModal = false;
      }
    },

    async redeemReward(reward) {
      try {
        if (this.points < reward.points_required) {
          throw new Error('Insufficient points');
        }

        const response = await this.fetchWithAuth('/api/rewards/redeem', {
          method: 'POST',
          body: JSON.stringify({
            rewardId: reward.id,
            points: reward.points_required
          })
        });

        if (response) {
          this.points = response.points;
          this.redeemedPoints = reward.points_required;
          this.redeemedAmount = reward.discount_amount;
          this.showRedeemModal = true;
          
          this.createRewardRedemptionNotification(reward);
          await this.fetchUserData();
        }
      } catch (error) {
        console.error('Redemption error:', error);
        throw error;
      }
    },
    
    createRewardRedemptionNotification(reward) {
      try {
        const savedNotifications = localStorage.getItem('userNotifications');
        let notifications = savedNotifications ? JSON.parse(savedNotifications) : [];
        
        const newNotification = {
          id: Date.now().toString(),
          type: 'reward',
          rewardId: reward.id,
          read: false,
          timestamp: new Date().toISOString(),
          message: `You redeemed ${reward.points_required} points for ₱${reward.discount_amount} discount.`
        };
        
        notifications.unshift(newNotification);
        notifications = notifications.slice(0, 20);
        
        localStorage.setItem('userNotifications', JSON.stringify(notifications));
        
        window.dispatchEvent(new CustomEvent('notifications-updated', {
          detail: { notifications }
        }));
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    },

    closeRedeemModal() {
      this.showRedeemModal = false;
      this.redeemedPoints = 0;
      this.redeemedAmount = 0;
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
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
        
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
            
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
      }
    },

    formatNumber(num) {
      return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    }
  }
};
</script>

<style scoped>
.rewards-page {
  min-height: 100vh;
  background: #fafafa;
  font-family: Arial, sans-serif;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header Section */
.header-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.title-section h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.points-display {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

.points-card, .conversion-card {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  min-width: 160px;
}

.conversion-card {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.points-number, .conversion-number {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.points-label, .conversion-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.points-value, .conversion-rate {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 0.5rem;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #f3f4f6;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.divider {
  width: 1px;
  height: 32px;
  background: #e5e7eb;
}

/* New Conversion Summary Section */
.conversion-summary-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 2px solid #f0f9ff;
}

.conversion-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.conversion-summary-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.auto-convert-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
}

.toggle-label input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  width: 40px;
  height: 20px;
  background: #e5e7eb;
  border-radius: 10px;
  position: relative;
  transition: background 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider {
  background: #10b981;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.conversion-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
}

.conversion-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
}

.conversion-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.conversion-amount {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.conversion-amount.peso {
  color: #10b981;
  font-size: 1.5rem;
}

.conversion-desc {
  font-size: 0.75rem;
  color: #6b7280;
}

.conversion-arrow {
  font-size: 1.5rem;
  color: #6b7280;
  margin: 0 1rem;
}

.conversion-info-box {
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.info-label {
  color: #6b7280;
}

.info-value {
  color: #111827;
  font-weight: 500;
}

/* Loyalty Section */
.loyalty-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.loyalty-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.loyalty-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.tier-badge {
  display: flex;
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
  background: #fbbf24;
  color: #92400e;
}

.tier-badge.member {
  background: #f3f4f6;
  color: #6b7280;
}

.loyalty-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.loyalty-stat {
  text-align: center;
}

.loyalty-stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #10b981;
}

.loyalty-stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.progress-section {
  margin-top: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.progress-text {
  color: #6b7280;
}

.progress-bar {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Tiers Section */
.tiers-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tiers-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
}

.tiers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.tier-card {
  border: 2px solid #f3f4f6;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.tier-card:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.tier-card.active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tier-card.active:has(.tier-header.bronze) {
  border-color: #d97706;
  background: #fef3c7;
}

.tier-card.active:has(.tier-header.silver) {
  border-color: #64748b;
  background: #f1f5f9;
}

.tier-card.active:has(.tier-header.gold) {
  border-color: #f59e0b;
  background: #fef3c7;
}

.tier-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tier-icon {
  font-size: 1.5rem;
}

.tier-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.tier-info p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.tier-bonus {
  margin-left: auto;
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.tier-benefits {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tier-benefits li {
  padding: 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  position: relative;
  padding-left: 1rem;
}

.tier-benefits li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: 600;
}

.tier-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #92400e;
}

.tier-note p {
  margin: 0;
}

/* Rewards Section */
.rewards-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.conversion-info {
  background: #f0f9ff;
  color: #0369a1;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.reward-card {
  border: 2px solid #f3f4f6;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s ease;
}

.reward-card:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.reward-header {
  margin-bottom: 1rem;
}

.reward-points {
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
  line-height: 1;
}

.reward-points-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.reward-amount {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.reward-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.reward-value {
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.savings-indicator {
  color: #10b981;
  font-weight: 600;
  font-size: 0.75rem;
}

.reward-button {
  width: 100%;
  background: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reward-button:hover:not(.disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.reward-button.disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

/* History Section */
.history-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.history-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
}

.history-container {
  max-height: 400px;
  overflow-y: auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.history-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.history-icon.earned {
  background: #dcfce7;
  color: #166534;
}

.history-icon.redeemed {
  background: #fef2f2;
  color: #dc2626;
}

.history-content {
  flex: 1;
}

.history-description {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
}

.history-date {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.history-points {
  text-align: right;
}

.points-display {
  font-weight: 600;
  font-size: 0.875rem;
}

.peso-display {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

.history-points.earned .points-display {
  color: #10b981;
}

.history-points.earned .peso-display {
  color: #059669;
}

.history-points.redeemed .points-display {
  color: #dc2626;
}

.history-points.redeemed .peso-display {
  color: #b91c1c;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.2s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.modal-icon.success {
  color: #10b981;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-content {
  padding: 0 2rem 1rem;
}

.redemption-summary {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.summary-row:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.summary-row.bonus {
  background: #f0fdf4;
  padding: 0.5rem;
  margin: 0.5rem -0.5rem;
  border-radius: 4px;
}

.bonus-amount {
  color: #16a34a;
}

.modal-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #92400e;
}

.modal-note p {
  margin: 0;
}

.usage-steps {
  margin-top: 1rem;
}

.usage-steps h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.usage-steps ol {
  padding-left: 1rem;
  margin: 0;
}

.usage-steps li {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.modal-actions {
  padding: 1rem 2rem 2rem;
  display: flex;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover {
  background: #059669;
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.full-width {
  flex: none;
  width: 100%;
}

.info-icon {
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
    gap: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .points-display {
    align-self: center;
    flex-direction: column;
    align-items: center;
  }

  .conversion-summary-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .auto-convert-toggle {
    align-self: center;
  }

  .conversion-grid {
    flex-direction: column;
    gap: 1.5rem;
  }

  .conversion-arrow {
    transform: rotate(90deg);
    margin: 0;
  }

  .stats-row {
    gap: 1rem;
    flex-wrap: wrap;
  }

  .conversion-info-box {
    font-size: 0.8rem;
  }

  .loyalty-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .tier-badge {
    align-self: center;
  }

  .loyalty-stats {
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .conversion-info {
    align-self: center;
  }

  .tiers-grid,
  .rewards-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .header-section,
  .conversion-summary-section,
  .loyalty-section,
  .tiers-section,
  .rewards-section,
  .history-section {
    padding: 1.5rem;
  }

  .title-section h1 {
    font-size: 1.5rem;
  }

  .points-number, .conversion-number {
    font-size: 2rem;
  }

  .stats-row {
    flex-direction: column;
    gap: 1rem;
  }

  .divider {
    width: 100%;
    height: 1px;
  }
}
</style>