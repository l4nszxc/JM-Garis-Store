<template>
  <div class="rewards-page min-h-screen bg-gray-100">
    <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <div v-if="loading" class="flex justify-center items-center h-screen">
      <div class="loader"></div>
    </div>

    <div v-else class="max-w-4xl mx-auto p-6">
      <!-- Header Card - Updated to center content -->
      <div class="bg-white rounded-lg shadow-md p-8 mb-6">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-green-700 mb-4">Rewards Program</h1>
          <div class="flex justify-center items-center"> <!-- Changed to center -->
            <div class="text-center"> <!-- Added text-center -->
              <h2 class="text-xl font-semibold text-gray-700">Your Current Points: <span class="font-bold text-green-600">{{ points }}</span></h2>
              <p class="text-gray-500">
                Total Points Earned: {{ totalPointsEarned }}
              </p>
              <p class="text-gray-500">Earn 1 point for every ₱100 spent</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Rewards -->
      <div class="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 class="text-xl font-bold text-gray-700 mb-4 text-center">Available Rewards</h2>
        <div v-if="availableRewards.length" class="grid md:grid-cols-3 gap-6">
          <div v-for="reward in availableRewards" :key="reward.id" 
               class="bg-gray-50 rounded-lg p-4 text-center relative hover:shadow-lg transition-shadow">
            <div class="text-2xl font-bold text-green-700 mb-2">{{ reward.points_required }} points</div>
            <div class="text-xl font-semibold text-gray-700 mb-2">₱{{ reward.discount_amount }} off</div>
            <p class="text-gray-500 mb-4">{{ reward.description }}</p>
            <button @click="showRedemptionConfirmation(reward)"
                    :disabled="points < reward.points_required"
                    :class="[
                      'w-full py-2 px-4 rounded-md transition-colors',
                      points >= reward.points_required 
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    ]">
              {{ points >= reward.points_required ? 'Redeem' : 'Not Enough Points' }}
            </button>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-8">
          No rewards available at the moment
        </div>
      </div>

      <!-- Reward History -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <h2 class="text-xl font-bold text-gray-700 mb-4 text-center">Reward History</h2>
        <div class="overflow-x-auto reward-history-container">
          <table v-if="rewardHistory.length" class="min-w-full bg-white">
            <thead>
              <tr>
                <th class="py-2 px-4 border-b border-gray-200 text-left text-gray-600">Date</th>
                <th class="py-2 px-4 border-b border-gray-200 text-left text-gray-600">Description</th>
                <th class="py-2 px-4 border-b border-gray-200 text-left text-gray-600">Points</th>
              </tr>
            </thead>
            <tbody>
                <tr v-for="item in rewardHistory" :key="item.id" class="hover:bg-gray-50">
                    <td class="py-2 px-4 border-b border-gray-200">
                        {{ formatDate(item.created_at || item.date) }}
                    </td>
                    <td class="py-2 px-4 border-b border-gray-200">{{ item.description }}</td>
                    <td :class="[
                        'py-2 px-4 border-b border-gray-200 font-semibold',
                        item.points > 0 ? 'text-green-600' : 'text-red-600'
                    ]">
                        {{ item.points > 0 ? '+' : '' }}{{ item.points }}
                    </td>
                </tr>
            </tbody>
          </table>
          <div v-else class="text-center text-gray-500 py-8">
            No reward history available
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Redeem Confirmation Modal -->
    <div v-if="showConfirmModal" class="fixed inset-0 flex items-center justify-center modal-container z-50">
      <div class="modal-backdrop absolute inset-0 bg-black bg-opacity-50" @click="cancelRedemption"></div>
      <div class="confirmation-modal bg-white rounded-2xl p-8 shadow-xl max-w-md w-11/12 relative animate-modal">
        <div class="text-center">
          <div class="confirmation-icon-wrapper">
            <i class="fas fa-gift confirmation-icon"></i>
          </div>
          <h3 class="text-2xl font-bold text-green-700 mb-4">Confirm Redemption</h3>
          <div class="text-gray-600 mb-6">
            <p class="mb-4">
              Are you sure you want to redeem 
              <span class="font-bold text-green-600 text-xl">{{ selectedReward?.points_required }}</span> 
              points for a 
              <span class="font-bold text-green-600 text-xl">₱{{ selectedReward?.discount_amount }}</span> 
              discount?
            </p>
            <div class="confirmation-info bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p class="text-sm text-gray-500">
                <i class="fas fa-info-circle mr-2"></i>
                This action cannot be undone and the points will be deducted from your account immediately.
              </p>
            </div>
          </div>
          <!-- Updated button container for better centering -->
          <div class="flex justify-center gap-4 buttons-container">
            <button @click="cancelRedemption" 
                    class="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center">
              <i class="fas fa-times mr-2"></i> Cancel
            </button>
            <button @click="confirmRedemption" 
                    class="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center">
              <i class="fas fa-check-circle mr-2"></i> Confirm
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Redemption Success Modal -->
    <div v-if="showRedeemModal" class="fixed inset-0 flex items-center justify-center modal-container z-50">
      <div class="modal-backdrop absolute inset-0 bg-black bg-opacity-50" @click="closeRedeemModal"></div>
      <div class="confirmation-modal bg-white rounded-2xl p-8 shadow-xl max-w-md w-11/12 relative animate-modal">
        <div class="text-center">
          <div class="success-icon-wrapper">
            <i class="fas fa-check-circle success-icon"></i>
          </div>
          <h3 class="text-2xl font-bold text-green-700 mb-4">Reward Redeemed!</h3>
          <div class="text-gray-600 mb-6">
            <p class="mb-4">
              You have successfully redeemed 
              <span class="font-bold text-green-600">{{ redeemedPoints }}</span> 
              points for
              <span class="font-bold text-green-600">₱{{ redeemedAmount }}</span> 
              off your next purchase.
            </p>
            <div class="bg-gray-50 p-4 rounded-lg text-sm border border-gray-200">
              <p class="font-semibold mb-2 text-gray-700">
                <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                How to use your discount:
              </p>
              <ol class="text-left list-decimal pl-6 space-y-2">
                <li>Add items to your cart</li>
                <li>During checkout, you'll see this discount (₱{{ redeemedAmount }}) available</li>
                <li>Select it to apply the discount to your order</li>
              </ol>
            </div>
          </div>
          <button @click="closeRedeemModal" 
                  class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center">
            <i class="fas fa-check mr-2"></i> Got it!
          </button>
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
// Script section remains unchanged
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
      showRedeemModal: false,
      showLogoutModal: false,
      showConfirmModal: false,
      selectedReward: null,
      redeemedPoints: 0,
      redeemedAmount: 0,
      loading: true,
      error: null
    };
  },
  async mounted() {
    if (this.initializeUser()) {
      await this.fetchUserData();
    }
  },
  methods: {
    // All methods remain unchanged
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
      } else {
        const message = error.response?.data?.message || `Failed to ${action}`;
        this.showError(message);
      }
    },
    handleAuthError() {
      localStorage.removeItem('token');
      this.$router.push('/login');
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
        this.handleAuthError();
        return false;
      }
    },

    async fetchUserData() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        await Promise.all([
          this.fetchUserPoints(),
          this.fetchRewardHistory(),
          this.fetchAvailableRewards()
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
          // Ensure we have a valid date by using created_at or date
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

    showRedemptionConfirmation(reward) {
      if (this.points < reward.points_required) {
        return;
      }
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
          
          // Create and save a notification for reward redemption
          this.createRewardRedemptionNotification(reward);
          
          await this.fetchUserData(); // Refresh all data
        }
      } catch (error) {
        console.error('Redemption error:', error);
        throw error;
      }
    },
    
    createRewardRedemptionNotification(reward) {
      try {
        // Get existing notifications
        const savedNotifications = localStorage.getItem('userNotifications');
        let notifications = savedNotifications ? JSON.parse(savedNotifications) : [];
        
        // Create new notification
        const newNotification = {
          id: Date.now().toString(), // Use timestamp as unique ID
          type: 'reward',
          rewardId: reward.id,
          read: false,
          timestamp: new Date().toISOString(),
          message: `You redeemed ${reward.points_required} points for ₱${reward.discount_amount} discount.`
        };
        
        // Add to beginning of array
        notifications.unshift(newNotification);
        
        // Keep only the 20 most recent notifications
        notifications = notifications.slice(0, 20);
        
        // Save to localStorage
        localStorage.setItem('userNotifications', JSON.stringify(notifications));
        
        // Dispatch event to update other components
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
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
        
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return 'Invalid Date';
        }
            
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
    }
  }
};
</script>

<style scoped>
.rewards-page {
  font-family: Arial, sans-serif;
}

.loader {
  border: 3px solid rgba(74, 222, 128, 0.3);
  border-radius: 50%;
  border-top: 3px solid #4ade80;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Enhanced Modal Animation */
@keyframes modalFade {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.animate-modal {
  animation: modalFade 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

/* Modal Container & Backdrop */
.modal-container {
  z-index: 100;
}

.modal-backdrop {
  backdrop-filter: blur(3px);
  transition: all 0.3s ease;
}

/* Modal Design Enhancements */
.confirmation-modal {
  max-width: 450px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(22, 163, 74, 0.2);
}

.confirmation-icon-wrapper, .success-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #16a34a, #22c55e);
  box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.3);
}

.confirmation-icon {
  font-size: 2.5rem;
  color: white;
}

.success-icon-wrapper {
  background: linear-gradient(45deg, #15803d, #22c55e);
}

.success-icon {
  font-size: 2.5rem;
  color: white;
}

.confirmation-info {
  margin-top: 1rem;
  border-left: 4px solid #16a34a;
}

/* New styles for buttons container */
.buttons-container {
  max-width: 400px;
  margin: 0 auto;
}

/* Rest of the styles unchanged */
.min-h-screen { min-height: 100vh; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-white { background-color: #ffffff; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-2xl { border-radius: 1rem; }
.shadow-md { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
.hover\:shadow-lg:hover { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); }

/* Flex Utilities */
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }

/* Text Colors */
.text-green-700 { color: #047857; }
.text-green-600 { color: #059669; }
.text-gray-700 { color: #374151; }
.text-gray-600 { color: #4b5563; }
.text-gray-500 { color: #6b7280; }
.text-red-600 { color: #dc2626; }
.text-yellow-500 { color: #eab308; }

/* Font Weights */
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }

/* Spacing */
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.mr-2 { margin-right: 0.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }

/* Sizing */
.w-11\/12 { width: 91.666667%; }
.max-w-md { max-width: 28rem; }

/* Layout */
.max-w-4xl { max-width: 56rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.grid { display: grid; }
.md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.gap-6 { gap: 1.5rem; }
.gap-4 { gap: 1rem; }
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.z-50 { z-index: 50; }

/* Table Styles */
.overflow-x-auto { overflow-x: auto; }
.table-auto { table-layout: auto; }
.w-full { width: 100%; }
.border-b { border-bottom-width: 1px; }
.border { border-width: 1px; }
.border-gray-200 { border-color: #e5e7eb; }
.text-left { text-align: left; }
.text-center { text-align: center; }

/* Transitions */
.transition-colors { transition-property: background-color, border-color, color, fill, stroke; transition-duration: 150ms; }

.reward-history-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.reward-history-container::-webkit-scrollbar {
  width: 8px;
}

.reward-history-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 0.5rem;
}

.reward-history-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 0.5rem;
}

.reward-history-container::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* List Styles */
.list-decimal {
  list-style-type: decimal;
}

.pl-6 {
  padding-left: 1.5rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .confirmation-modal {
    width: 95%;
    padding: 1.5rem;
  }
  
  .confirmation-icon-wrapper, .success-icon-wrapper {
    width: 70px;
    height: 70px;
  }
  
  .confirmation-icon, .success-icon {
    font-size: 2rem;
  }
}
</style>