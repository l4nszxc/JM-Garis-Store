n<template>
  <div class="rewards-page min-h-screen bg-gray-100">
    <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <div v-if="loading" class="flex justify-center items-center h-screen">
      <div class="loader"></div>
    </div>

    <div v-else class="max-w-4xl mx-auto p-6">
      <!-- Header Card -->
      <div class="bg-white rounded-lg shadow-md p-8 mb-6">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-green-700 mb-4">Rewards Program</h1>
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold text-gray-700">Your Current Points: <span class="font-bold text-green-600">{{ points }}</span></h2>              <p class="text-gray-500">
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
            <button @click="redeemReward(reward)"
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

    <!-- Redemption Success Modal -->
    <div v-if="showRedeemModal" class="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div class="bg-white rounded-lg p-8 custom-modal-width animate-modal" @click.stop>
          <div class="text-center">
              <i class="fas fa-check-circle text-5xl text-green-600 mb-4"></i>
              <h3 class="text-2xl font-bold text-green-700 mb-4">Reward Redeemed!</h3>
              <div class="text-gray-600 mb-6">
                  <p class="mb-4">
                      You have successfully redeemed {{ redeemedPoints }} points for
                      ₱{{ redeemedAmount }} off your next purchase.
                  </p>
                  <div class="bg-gray-50 p-4 rounded-lg text-sm">
                      <p class="font-semibold mb-2">How to use your discount:</p>
                      <ol class="text-left list-decimal pl-4 space-y-2">
                          <li>Add items to your cart</li>
                          <li>During checkout, you'll see this discount (₱{{ redeemedAmount }}) available</li>
                          <li>Select it to apply the discount to your order</li>
                      </ol>
                  </div>
              </div>
              <button @click="closeRedeemModal" 
                      class="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors">
                  Close
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
              await this.fetchUserData(); // Refresh all data
          }
      } catch (error) {
          console.error('Redemption error:', error);
          alert(error.message || 'Failed to redeem reward');
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


@keyframes modalFade {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Utility Classes */
.min-h-screen { min-height: 100vh; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-white { background-color: #ffffff; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-md { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
.hover\:shadow-lg:hover { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); }

/* Text Colors */
.text-green-700 { color: #047857; }
.text-green-600 { color: #059669; }
.text-gray-700 { color: #374151; }
.text-gray-600 { color: #4b5563; }
.text-gray-500 { color: #6b7280; }
.text-red-600 { color: #dc2626; }

/* Font Weights */
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }

/* Spacing */
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }


/* Layout */
.max-w-4xl { max-width: 56rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.grid { display: grid; }
.md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.gap-6 { gap: 1.5rem; }

/* Table Styles */
.overflow-x-auto { overflow-x: auto; }
.table-auto { table-layout: auto; }
.w-full { width: 100%; }
.border-b { border-bottom-width: 1px; }
.border-gray-200 { border-color: #e5e7eb; }
.text-left { text-align: left; }
.text-center { text-align: center; }

/* Transitions */
.transition-colors { transition-property: background-color, border-color, color, fill, stroke; }
.transition-shadow { transition-property: box-shadow; }
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

.space-y-2 > * + * {
  margin-top: 0.5rem;
}
.fixed {
    position: fixed;
}

.z-50 {
    z-index: 50;
}

.inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}

.bg-black.bg-opacity-50 {
    background-color: rgba(0, 0, 0, 0.5);
}
.custom-modal-width {
    width: 320px;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-height: 90vh; /* Prevents modal from being too tall */
    overflow-y: auto; /* Adds scroll if content is too long */
}
</style>