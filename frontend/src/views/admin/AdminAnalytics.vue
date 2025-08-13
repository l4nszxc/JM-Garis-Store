<template>
  <div class="admin-container">
    <AdminNavbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="admin-content">
      <div class="page-header">
        <div class="header-left">
          <button @click="$router.go(-1)" class="back-btn">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h1><i class="fas fa-chart-bar"></i> Analytics Dashboard</h1>
        </div>
        <div class="time-filter">
          <select v-model="timeFilter" @change="fetchAllData()">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">Overall</option>
          </select>
        </div>
      </div>

      <!-- Enhanced Metrics Cards -->
      <div class="enhanced-metrics-grid">
        <div class="enhanced-metric-card income">
          <div class="metric-header">
            <div class="metric-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="metric-trend" :class="stats.salesGrowth >= 0 ? 'positive' : 'negative'">
              <i :class="stats.salesGrowth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(stats.salesGrowth || 0).toFixed(1) }}%
            </div>
          </div>
          <div class="metric-content">
            <h3>Total Income</h3>
            <p class="number">₱{{ formatCurrency(stats.totalSales) }}</p>
            <p class="subtext">{{ getTimeFilterLabel() }} revenue</p>
            <div class="comparison">
              <span>vs previous {{ timeFilter }}: </span>
              <span :class="stats.salesGrowth >= 0 ? 'positive' : 'negative'">
                {{ stats.salesGrowth >= 0 ? '+' : '' }}{{ (stats.salesGrowth || 0).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="enhanced-metric-card daily">
          <div class="metric-header">
            <div class="metric-icon">
              <i class="fas fa-calendar-day"></i>
            </div>
            <div class="metric-trend" :class="stats.dailyGrowth >= 0 ? 'positive' : 'negative'">
              <i :class="stats.dailyGrowth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(stats.dailyGrowth || 0).toFixed(1) }}%
            </div>
          </div>
          <div class="metric-content">
            <h3>Daily Income</h3>
            <p class="number">₱{{ formatCurrency(stats.dailyIncome) }}</p>
            <p class="subtext">Today's earnings</p>
            <div class="comparison">
              <span>vs yesterday: </span>
              <span :class="stats.dailyGrowth >= 0 ? 'positive' : 'negative'">
                {{ stats.dailyGrowth >= 0 ? '+' : '' }}{{ (stats.dailyGrowth || 0).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="enhanced-metric-card growth">
          <div class="metric-header">
            <div class="metric-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="metric-trend positive">
              <i class="fas fa-arrow-up"></i>
              {{ Math.abs(stats.potentialGrowth || 0).toFixed(1) }}%
            </div>
          </div>
          <div class="metric-content">
            <h3>Potential Growth</h3>
            <p class="number">{{ (stats.potentialGrowth || 0).toFixed(1) }}%</p>
            <p class="subtext">3-month projection</p>
            <div class="comparison">
              <span>Based on trend analysis</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Analytics Tables -->
      <div class="analytics-tables">
        <!-- Top Products Performance -->
        <div class="analytics-section">
          <div class="section-header">
            <h2><i class="fas fa-trophy"></i> Top Products Performance</h2>
            <div class="period-selector">
              <select v-model="productsPeriod" @change="fetchTopProducts()">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>
          <div class="table-container">
            <table v-if="topProducts.length > 0" class="analytics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                  <th>Growth</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, index) in topProducts" :key="product.products_id">
                  <td>
                    <div class="rank-badge" :class="getRankClass(index)">
                      {{ index + 1 }}
                    </div>
                  </td>
                  <td>
                    <div class="product-info">
                      <img 
                        :src="getProductImage(product.image)" 
                        :alt="product.name"
                        class="product-thumbnail"
                        @error="handleImageError"
                      >
                      <div class="product-details">
                        <span class="product-name">{{ product.name }}</span>
                        <span class="product-category">{{ product.category || 'General' }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="quantity-info">
                      <span class="quantity">{{ product.quantity || 0 }}</span>
                      <span class="unit">units</span>
                    </div>
                  </td>
                  <td class="revenue">₱{{ formatCurrency(product.revenue || 0) }}</td>
                  <td>
                    <div class="growth-indicator" :class="getGrowthClass(product.growth)">
                      <i :class="getGrowthIcon(product.growth)"></i>
                      {{ (product.growth || 0).toFixed(1) }}%
                    </div>
                  </td>
                  <td>
                    <div class="performance-score" :class="getPerformanceClass(product)">
                      {{ getPerformanceScore(product) }}/100
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="no-data-message">
              <i class="fas fa-chart-line"></i>
              <p>No product data available for the selected period</p>
            </div>
          </div>
        </div>

        <!-- Product Performance Insights -->
        <div class="analytics-section">
          <div class="section-header">
            <h2><i class="fas fa-star"></i> Product Performance Insights</h2>
          </div>
          
          <div class="product-insights">
            <div class="insights-grid">
              <!-- Highest Rated Product -->
              <div class="insight-card highest-rated">
                <div class="insight-header">
                  <div class="insight-icon">
                    <i class="fas fa-star"></i>
                  </div>
                  <h4>Highest Rated Product</h4>
                </div>
                <div class="insight-content">
                  <div class="product-insight" v-if="productInsights.highestRated">
                    <div class="insight-product-image-container">
                      <img 
                        v-if="productInsights.highestRated.image" 
                        :src="getProductImage(productInsights.highestRated.image)"
                        :alt="productInsights.highestRated.name"
                        class="insight-product-image"
                        @error="handleInsightImageError"
                      >
                      <i v-else class="fas fa-image placeholder-icon"></i>
                    </div>
                    <div class="insight-details">
                      <span class="insight-product-name">{{ productInsights.highestRated.name }}</span>
                      <div class="rating-display">
                        <i v-for="star in 5" :key="star" 
                           :class="star <= (productInsights.highestRated.rating || 0) ? 'fas fa-star' : 'far fa-star'">
                        </i>
                        <span class="rating-value">({{ (productInsights.highestRated.rating || 0).toFixed(1) }})</span>
                      </div>
                      <span class="insight-meta">{{ productInsights.highestRated.reviewCount || 0 }} reviews</span>
                    </div>
                  </div>
                  <div class="no-data" v-else>
                    <i class="fas fa-star"></i>
                    <span>No rated products yet</span>
                  </div>
                </div>
              </div>

              <!-- Lowest Rated Product -->
              <div class="insight-card lowest-rated">
                <div class="insight-header">
                  <div class="insight-icon">
                    <i class="fas fa-star-half-alt"></i>
                  </div>
                  <h4>Lowest Rated Product</h4>
                </div>
                <div class="insight-content">
                  <div class="product-insight" v-if="productInsights.lowestRated">
                    <div class="insight-product-image-container">
                      <img 
                        v-if="productInsights.lowestRated.image" 
                        :src="getProductImage(productInsights.lowestRated.image)"
                        :alt="productInsights.lowestRated.name"
                        class="insight-product-image"
                        @error="handleInsightImageError"
                      >
                      <i v-else class="fas fa-image placeholder-icon"></i>
                    </div>
                    <div class="insight-details">
                      <span class="insight-product-name">{{ productInsights.lowestRated.name }}</span>
                      <div class="rating-display">
                        <i v-for="star in 5" :key="star" 
                           :class="star <= (productInsights.lowestRated.rating || 0) ? 'fas fa-star' : 'far fa-star'">
                        </i>
                        <span class="rating-value">({{ (productInsights.lowestRated.rating || 0).toFixed(1) }})</span>
                      </div>
                      <span class="insight-meta">{{ productInsights.lowestRated.reviewCount || 0 }} reviews</span>
                    </div>
                  </div>
                  <div class="no-data" v-else>
                    <i class="fas fa-star-half-alt"></i>
                    <span>No rated products yet</span>
                  </div>
                </div>
              </div>

              <!-- Most Sold Product -->
              <div class="insight-card most-sold">
                <div class="insight-header">
                  <div class="insight-icon">
                    <i class="fas fa-fire"></i>
                  </div>
                  <h4>Most Sold Product</h4>
                </div>
                <div class="insight-content">
                  <div class="product-insight" v-if="productInsights.mostSold">
                    <div class="insight-product-image-container">
                      <img 
                        v-if="productInsights.mostSold.image" 
                        :src="getProductImage(productInsights.mostSold.image)"
                        :alt="productInsights.mostSold.name"
                        class="insight-product-image"
                        @error="handleInsightImageError"
                      >
                      <i v-else class="fas fa-image placeholder-icon"></i>
                    </div>
                    <div class="insight-details">
                      <span class="insight-product-name">{{ productInsights.mostSold.name }}</span>
                      <span class="sales-count">{{ productInsights.mostSold.totalSold || 0 }} units sold</span>
                      <span class="insight-meta">₱{{ formatCurrency(productInsights.mostSold.revenue || 0) }} revenue</span>
                    </div>
                  </div>
                  <div class="no-data" v-else>
                    <i class="fas fa-fire"></i>
                    <span>No sales data available</span>
                  </div>
                </div>
              </div>

              <!-- Least Sold Product -->
              <div class="insight-card least-sold">
                <div class="insight-header">
                  <div class="insight-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                  </div>
                  <h4>Least Sold Product</h4>
                </div>
                <div class="insight-content">
                  <div class="product-insight" v-if="productInsights.leastSold">
                    <div class="insight-product-image-container">
                      <img 
                        v-if="productInsights.leastSold.image" 
                        :src="getProductImage(productInsights.leastSold.image)"
                        :alt="productInsights.leastSold.name"
                        class="insight-product-image"
                        @error="handleInsightImageError"
                      >
                      <i v-else class="fas fa-image placeholder-icon"></i>
                    </div>
                    <div class="insight-details">
                      <span class="insight-product-name">{{ productInsights.leastSold.name }}</span>
                      <span class="sales-count">{{ productInsights.leastSold.totalSold || 0 }} units sold</span>
                      <span class="insight-meta">₱{{ formatCurrency(productInsights.leastSold.revenue || 0) }} revenue</span>
                    </div>
                  </div>
                  <div class="no-data" v-else>
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>No sales data available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
  name: 'AdminAnalytics',
  components: {
    AdminNavbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      timeFilter: 'week',
      productsPeriod: 'weekly',
      loading: false,
      stats: {
        totalSales: 0,
        dailyIncome: 0,
        dailyGrowth: 0,
        salesGrowth: 0,
        potentialGrowth: 0
      },
      topProducts: [],
      productInsights: {
        highestRated: null,
        lowestRated: null,
        mostSold: null,
        leastSold: null
      }
    }
  },
  methods: {
    getTimeFilterLabel() {
      const labels = {
        today: "Today's",
        week: "This week's",
        month: "This month's",
        year: "This year's",
        all: "Total"
      };
      return labels[this.timeFilter] || "Current";
    },

    getRankClass(index) {
      if (index === 0) return 'gold';
      if (index === 1) return 'silver';
      if (index === 2) return 'bronze';
      return 'default';
    },

    getGrowthClass(growth) {
      if (growth > 0) return 'positive';
      if (growth < 0) return 'negative';
      return 'neutral';
    },

    getGrowthIcon(growth) {
      if (growth > 0) return 'fas fa-arrow-up';
      if (growth < 0) return 'fas fa-arrow-down';
      return 'fas fa-minus';
    },

    getPerformanceClass(product) {
      const score = this.getPerformanceScore(product);
      if (score >= 80) return 'excellent';
      if (score >= 60) return 'good';
      if (score >= 40) return 'average';
      return 'poor';
    },

    getPerformanceScore(product) {
      const sales = product.quantity || 0;
      const revenue = product.revenue || 0;
      const growth = product.growth || 0;
      
      let score = Math.min(sales * 2, 40) + Math.min(revenue / 1000, 30) + Math.min(growth, 30);
      return Math.round(Math.max(0, Math.min(100, score)));
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0);
    },

    getProductImage(imagePath) {
      if (!imagePath) return '';
      // Handle different image path formats
      if (imagePath.startsWith('http')) {
        return imagePath;
      } else if (imagePath.startsWith('/uploads/')) {
        return `http://localhost:7904${imagePath}`;
      } else if (imagePath.startsWith('uploads/')) {
        return `http://localhost:7904/${imagePath}`;
      }
      return imagePath;
    },

    handleImageError(e) {
      // Replace broken images with a CSS-based placeholder
      e.target.style.display = 'none';
      const placeholder = e.target.parentNode.querySelector('.image-placeholder');
      if (!placeholder) {
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'image-placeholder';
        placeholderDiv.innerHTML = '<i class="fas fa-image"></i>';
        e.target.parentNode.appendChild(placeholderDiv);
      }
    },

    handleInsightImageError(e) {
      e.target.style.display = 'none';
      const container = e.target.parentNode;
      const icon = container.querySelector('.placeholder-icon');
      if (icon) {
        icon.style.display = 'flex';
      }
    },

    async fetchAllData() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchDashboardStats(),
          this.fetchTopProducts(),
          this.fetchProductInsights()
        ]);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchDashboardStats() {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          timeFilter: this.timeFilter
        });
        
        const response = await fetch(`http://localhost:7904/api/admin/dashboard-stats?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.stats = {
            totalSales: data.totalSales || 0,
            dailyIncome: data.dailyIncome || 0,
            dailyGrowth: data.dailyGrowth || 0,
            salesGrowth: data.salesGrowth || 0,
            potentialGrowth: data.potentialGrowth || 0
          };
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    },

    async fetchTopProducts() {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          period: this.productsPeriod
        });
        
        const response = await fetch(`http://localhost:7904/api/admin/top-products?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.topProducts = (data || []).map(product => ({
            ...product,
            growth: Math.random() * 40 - 10 // Simulated growth data
          }));
        }
      } catch (error) {
        console.error('Error fetching top products:', error);
        this.topProducts = [];
      }
    },

    async fetchProductInsights() {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:7904/api/admin/product-insights', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.productInsights = {
            highestRated: data.highestRated,
            lowestRated: data.lowestRated,
            mostSold: data.mostSold,
            leastSold: data.leastSold
          };
        }
      } catch (error) {
        console.error('Error fetching product insights:', error);
        this.productInsights = {
          highestRated: null,
          lowestRated: null,
          mostSold: null,
          leastSold: null
        };
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
          }
        });
        
        if (response.ok) {
          localStorage.removeItem('token');
          this.$router.push('/login');
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
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        this.username = decoded.username || 'Admin';
        await this.fetchAllData();
      } catch (error) {
        console.error('Error decoding token:', error);
        this.$router.push('/login');
      }
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
  padding-left: 250px;
}

.admin-content {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  padding: 0.75rem;
  background-color: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background-color: #e2e8f0;
  color: #334155;
}

.page-header h1 {
  font-size: 1.75rem;
  color: #111827;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.time-filter select {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  color: #1e293b;
  font-size: 0.95rem;
  cursor: pointer;
}

/* Enhanced Metrics Cards */
.enhanced-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.enhanced-metric-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.enhanced-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.enhanced-metric-card.income {
  border-left-color: #3b82f6;
}

.enhanced-metric-card.daily {
  border-left-color: #10b981;
}

.enhanced-metric-card.growth {
  border-left-color: #f59e0b;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.metric-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.income .metric-icon {
  background-color: #3b82f6;
}

.daily .metric-icon {
  background-color: #10b981;
}

.growth .metric-icon {
  background-color: #f59e0b;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.metric-trend.positive {
  background-color: #dcfce7;
  color: #15803d;
}

.metric-trend.negative {
  background-color: #fee2e2;
  color: #dc2626;
}

.metric-content h3 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: #64748b;
  font-weight: 500;
}

.metric-content .number {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.metric-content .subtext {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0 0 0.75rem;
}

.comparison {
  font-size: 0.875rem;
  color: #64748b;
}

.comparison .positive {
  color: #15803d;
  font-weight: 600;
}

.comparison .negative {
  color: #dc2626;
  font-weight: 600;
}

/* Analytics Tables */
.analytics-tables {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.analytics-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.period-selector select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  color: #1e293b;
  font-size: 0.875rem;
}

.table-container {
  overflow-x: auto;
}

.analytics-table {
  width: 100%;
  border-collapse: collapse;
}

.analytics-table th {
  background-color: #f8fafc;
  text-align: left;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}

.analytics-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.rank-badge.gold {
  background-color: #fbbf24;
  color: white;
}

.rank-badge.silver {
  background-color: #9ca3af;
  color: white;
}

.rank-badge.bronze {
  background-color: #d97706;
  color: white;
}

.rank-badge.default {
  background-color: #f1f5f9;
  color: #64748b;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.product-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.image-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 1rem;
}

.product-details {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 500;
  color: #1e293b;
}

.product-category {
  font-size: 0.75rem;
  color: #94a3b8;
}

.quantity-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quantity {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.unit {
  font-size: 0.75rem;
  color: #94a3b8;
}

.revenue {
  font-weight: 600;
  color: #059669;
}

.growth-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.growth-indicator.positive {
  color: #15803d;
}

.growth-indicator.negative {
  color: #dc2626;
}

.growth-indicator.neutral {
  color: #64748b;
}

.performance-score {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
}

.performance-score.excellent {
  background-color: #dcfce7;
  color: #15803d;
}

.performance-score.good {
  background-color: #dbeafe;
  color: #2563eb;
}

.performance-score.average {
  background-color: #fef3c7;
  color: #d97706;
}

.performance-score.poor {
  background-color: #fee2e2;
  color: #dc2626;
}

/* Product Insights */
.product-insights {
  margin-top: 2rem;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.insight-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.insight-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
}

.highest-rated .insight-icon {
  background-color: #fbbf24;
}

.lowest-rated .insight-icon {
  background-color: #ef4444;
}

.most-sold .insight-icon {
  background-color: #059669;
}

.least-sold .insight-icon {
  background-color: #f59e0b;
}

.insight-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  font-weight: 600;
}

.product-insight {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.insight-product-image-container {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.insight-product-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.placeholder-icon {
  color: #94a3b8;
  font-size: 1.25rem;
}

.insight-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.insight-product-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rating-display i {
  color: #fbbf24;
  font-size: 0.8rem;
}

.rating-value {
  font-size: 0.8rem;
  color: #64748b;
  margin-left: 0.25rem;
}

.sales-count {
  font-weight: 600;
  color: #059669;
  font-size: 0.9rem;
}

.insight-meta {
  font-size: 0.8rem;
  color: #94a3b8;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.no-data i {
  font-size: 1.5rem;
  opacity: 0.5;
}

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #94a3b8;
  font-size: 1rem;
}

.no-data-message i {
  font-size: 3rem;
  opacity: 0.3;
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-container {
    padding-left: 0;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .enhanced-metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-left {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .metric-content .number {
    font-size: 1.5rem;
  }
}
</style>