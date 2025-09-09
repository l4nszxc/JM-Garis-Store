<template>
  <div class="staff-container">
    <StaffNavbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="staff-content">
      <div class="page-header">
        <div class="header-left">
          <button @click="$router.go(-1)" class="back-btn">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h1><i class="fas fa-chart-line"></i> My Analytics Dashboard</h1>
        </div>
        <div class="header-right">
          <div class="time-filter">
            <select v-model="timeFilter" @change="fetchAllData()">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">Overall</option>
            </select>
          </div>
          <button @click="downloadExcel()" class="download-btn" :disabled="loading">
            <i class="fas fa-download"></i>
            {{ loading ? 'Generating...' : 'Download Excel' }}
          </button>
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
            <h3>My Total Income</h3>
            <p class="number">₱{{ formatCurrency(stats.totalSales) }}</p>
            <p class="subtext">{{ getTimeFilterLabel() }} revenue from my sales</p>
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
            <p class="subtext">Today's earnings from my sales</p>
            <div class="comparison">
              <span>vs yesterday: </span>
              <span :class="stats.dailyGrowth >= 0 ? 'positive' : 'negative'">
                {{ stats.dailyGrowth >= 0 ? '+' : '' }}{{ (stats.dailyGrowth || 0).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="enhanced-metric-card orders">
          <div class="metric-header">
            <div class="metric-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="metric-trend" :class="stats.ordersGrowth >= 0 ? 'positive' : 'negative'">
              <i :class="stats.ordersGrowth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(stats.ordersGrowth || 0).toFixed(1) }}%
            </div>
          </div>
          <div class="metric-content">
            <h3>Total Orders Completed</h3>
            <p class="number">{{ stats.totalOrders || 0 }}</p>
            <p class="subtext">Orders I've successfully completed</p>
            <div class="comparison">
              <span>vs previous {{ timeFilter }}: </span>
              <span :class="stats.ordersGrowth >= 0 ? 'positive' : 'negative'">
                {{ stats.ordersGrowth >= 0 ? '+' : '' }}{{ (stats.ordersGrowth || 0).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Analytics Tables -->
      <div class="analytics-tables">
        <!-- My Top Customers -->
        <div class="analytics-section">
          <div class="section-header">
            <h2><i class="fas fa-users"></i> My Top Customers</h2>
            <div class="period-selector">
              <select v-model="customersPeriod" @change="fetchTopCustomers()">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>
          <div class="table-container">
            <table v-if="topCustomers.length > 0" class="analytics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Avg Order Value</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(customer, index) in topCustomers" :key="customer.user_id">
                  <td>
                    <div class="rank-badge" :class="getRankClass(index)">
                      {{ index + 1 }}
                    </div>
                  </td>
                  <td>
                    <div class="customer-info">
                      <div class="customer-avatar">
                        <i class="fas fa-user"></i>
                      </div>
                      <div class="customer-details">
                        <span class="customer-name">{{ customer.customer_name || 'Anonymous' }}</span>
                        <span class="customer-email">{{ customer.email || 'N/A' }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="orders-count">
                      <span class="count">{{ customer.order_count || 0 }}</span>
                      <span class="unit">orders</span>
                    </div>
                  </td>
                  <td class="revenue">₱{{ formatCurrency(customer.total_spent || 0) }}</td>
                  <td class="avg-order">₱{{ formatCurrency(customer.avg_order_value || 0) }}</td>
                  <td class="last-order">{{ formatDate(customer.last_order_date) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="no-data-message">
              <i class="fas fa-users"></i>
              <p>No customer data available for the selected period</p>
            </div>
          </div>
        </div>

        <!-- My Sales Performance -->
        <div class="analytics-section">
          <div class="section-header">
            <h2><i class="fas fa-chart-bar"></i> My Sales Performance</h2>
          </div>
          
          <div class="performance-insights">
            <div class="insights-grid">
              <!-- Most Sold Product by Me -->
              <div class="insight-card most-sold">
                <div class="insight-header">
                  <div class="insight-icon">
                    <i class="fas fa-fire"></i>
                  </div>
                  <h4>My Best Selling Product</h4>
                </div>
                <div class="insight-content">
                  <div class="product-insight" v-if="salesInsights.mostSold">
                    <div class="insight-product-image-container">
                      <img 
                        v-if="salesInsights.mostSold.image" 
                        :src="getProductImage(salesInsights.mostSold.image)"
                        :alt="salesInsights.mostSold.name"
                        class="insight-product-image"
                        @error="handleInsightImageError"
                      >
                      <i v-else class="fas fa-image placeholder-icon"></i>
                    </div>
                    <div class="insight-details">
                      <span class="insight-product-name">{{ salesInsights.mostSold.name }}</span>
                      <span class="sales-count">{{ salesInsights.mostSold.totalSold || 0 }} units sold by me</span>
                      <span class="insight-meta">₱{{ formatCurrency(salesInsights.mostSold.revenue || 0) }} revenue</span>
                    </div>
                  </div>
                  <div class="no-data" v-else>
                    <i class="fas fa-fire"></i>
                    <span>No sales data available</span>
                  </div>
                </div>
              </div>

              <!-- Best Day Performance -->
              <div class="insight-card best-day">
                <div class="insight-header">
                  <div class="insight-icon">
                    <i class="fas fa-calendar-check"></i>
                  </div>
                  <h4>My Best Sales Day</h4>
                </div>
                <div class="insight-content">
                  <div class="day-insight" v-if="salesInsights.bestDay">
                    <div class="insight-details">
                      <span class="day-date">{{ formatDate(salesInsights.bestDay.date) }}</span>
                      <span class="day-revenue">₱{{ formatCurrency(salesInsights.bestDay.revenue || 0) }}</span>
                      <span class="insight-meta">{{ salesInsights.bestDay.order_count || 0 }} orders completed</span>
                    </div>
                  </div>
                  <div class="no-data" v-else>
                    <i class="fas fa-calendar-check"></i>
                    <span>No sales data available</span>
                  </div>
                </div>
              </div>

              <!-- Average Order Value -->
              <div class="insight-card avg-order">
                <div class="insight-header">
                  <div class="insight-icon">
                    <i class="fas fa-receipt"></i>
                  </div>
                  <h4>My Average Order Value</h4>
                </div>
                <div class="insight-content">
                  <div class="avg-insight">
                    <div class="insight-details">
                      <span class="avg-value">₱{{ formatCurrency(salesInsights.avgOrderValue || 0) }}</span>
                      <span class="insight-meta">Based on {{ stats.totalOrders || 0 }} completed orders</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Service Rating -->
              <div class="insight-card service-rating">
                <div class="insight-header">
                  <div class="insight-icon">
                    <i class="fas fa-star"></i>
                  </div>
                  <h4>My Service Performance</h4>
                </div>
                <div class="insight-content">
                  <div class="rating-insight">
                    <div class="insight-details">
                      <span class="completion-rate">{{ (salesInsights.completionRate || 0).toFixed(1) }}%</span>
                      <span class="insight-meta">Order completion rate</span>
                    </div>
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
import StaffNavbar from '../../components/StaffNavbar.vue'
import LogoutModal from '../../components/LogoutModal.vue'

export default {
  name: 'StaffAnalytics',
  components: {
    StaffNavbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      timeFilter: 'week',
      customersPeriod: 'weekly',
      loading: false,
      stats: {
        totalSales: 0,
        dailyIncome: 0,
        dailyGrowth: 0,
        salesGrowth: 0,
        totalOrders: 0,
        ordersGrowth: 0
      },
      topCustomers: [],
      salesInsights: {
        mostSold: null,
        bestDay: null,
        avgOrderValue: 0,
        completionRate: 0
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

    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0);
    },

    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    getProductImage(imagePath) {
      if (!imagePath) return '';
      // Handle different image path formats
      if (imagePath.startsWith('http')) {
        return imagePath;
      } else if (imagePath.startsWith('/uploads/')) {
        return `${imagePath}`;
      } else if (imagePath.startsWith('uploads/')) {
        return `/${imagePath}`;
      }
      return imagePath;
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
          this.fetchStaffStats(),
          this.fetchTopCustomers(),
          this.fetchSalesInsights()
        ]);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchStaffStats() {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          timeFilter: this.timeFilter
        });
        
        const response = await this.$fetch(`/api/staff/analytics/stats?${params}`, {
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
            totalOrders: data.totalOrders || 0,
            ordersGrowth: data.ordersGrowth || 0
          };
        }
      } catch (error) {
        console.error('Error fetching staff stats:', error);
      }
    },

    async fetchTopCustomers() {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          period: this.customersPeriod
        });
        
        const response = await this.$fetch(`/api/staff/analytics/top-customers?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.topCustomers = data || [];
        }
      } catch (error) {
        console.error('Error fetching top customers:', error);
        this.topCustomers = [];
      }
    },

    async fetchSalesInsights() {
      try {
        const token = localStorage.getItem('token');
        
        const response = await this.$fetch('/api/staff/analytics/insights', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.salesInsights = {
            mostSold: data.mostSold,
            bestDay: data.bestDay,
            avgOrderValue: data.avgOrderValue || 0,
            completionRate: data.completionRate || 0
          };
        }
      } catch (error) {
        console.error('Error fetching sales insights:', error);
        this.salesInsights = {
          mostSold: null,
          bestDay: null,
          avgOrderValue: 0,
          completionRate: 0
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
    },

    async downloadExcel() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Authentication required');
          return;
        }

        const response = await fetch(`http://localhost:7904/api/staff/analytics/download?timeFilter=${this.timeFilter}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          // Create blob from response
          const blob = await response.blob();
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          
          // Extract filename from response headers or create default
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = 'Staff_Analytics.xlsx';
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
          }
          
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          const errorData = await response.json();
          alert(`Download failed: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error downloading Excel:', error);
        alert('Failed to download Excel report. Please try again.');
      } finally {
        this.loading = false;
      }
    }
  },

  async mounted() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        this.username = decoded.username || 'Staff';
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
.staff-container {
  font-family: 'Inter', Arial, sans-serif;
  min-height: 100vh;
  background-color: #f8fafc;
  padding-left: 250px;
}

.staff-content {
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

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.download-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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

.enhanced-metric-card.orders {
  border-left-color: #8b5cf6;
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

.orders .metric-icon {
  background-color: #8b5cf6;
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

.customer-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.customer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.customer-details {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 500;
  color: #1e293b;
}

.customer-email {
  font-size: 0.75rem;
  color: #94a3b8;
}

.orders-count {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.count {
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

.avg-order {
  font-weight: 500;
  color: #1e293b;
}

.last-order {
  font-size: 0.875rem;
  color: #64748b;
}

/* Performance Insights */
.performance-insights {
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

.most-sold .insight-icon {
  background-color: #059669;
}

.best-day .insight-icon {
  background-color: #3b82f6;
}

.avg-order .insight-icon {
  background-color: #f59e0b;
}

.service-rating .insight-icon {
  background-color: #8b5cf6;
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

.sales-count {
  font-weight: 600;
  color: #059669;
  font-size: 0.9rem;
}

.day-date {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.day-revenue {
  font-weight: 600;
  color: #059669;
  font-size: 1rem;
}

.avg-value {
  font-weight: 600;
  color: #f59e0b;
  font-size: 1.1rem;
}

.completion-rate {
  font-weight: 600;
  color: #8b5cf6;
  font-size: 1.1rem;
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
  .staff-container {
    padding-left: 0;
  }
  
  .staff-content {
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


