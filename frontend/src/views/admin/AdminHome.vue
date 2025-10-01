<template>
  <div class="admin-container">
    <AdminNavbar 
      :username="username"
      @logout="showLogoutModal = true"
    />
    
    <div class="admin-content">
      <div class="dashboard-header">
        <h1><i class="fas fa-tachometer-alt"></i> Admin Dashboard</h1>
        <div class="header-actions">
          <div class="time-filter">
            <select v-model="timeFilter" @change="fetchDashboardStats()">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">Overall</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Main Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card income clickable-card" @click="goToAnalytics('income')">
          <div class="metric-icon">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <div class="metric-content">
            <h3>Total Income</h3>
            <p class="number">₱{{ formatCurrency(stats.totalSales) }}</p>
            <p class="change positive" v-if="stats.salesGrowth !== undefined">
              <i :class="stats.salesGrowth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i> 
              {{ Math.abs(stats.salesGrowth).toFixed(1) }}% vs previous {{ timeFilter }}
            </p>
            <div class="card-overlay">
              <i class="fas fa-chart-line"></i>
              <span>View Analytics</span>
            </div>
          </div>
        </div>
        
        <div class="metric-card daily-income clickable-card" @click="goToAnalytics('daily')">
          <div class="metric-icon">
            <i class="fas fa-calendar-day"></i>
          </div>
          <div class="metric-content">
            <h3>Daily Income</h3>
            <p class="number">₱{{ formatCurrency(stats.dailyIncome) }}</p>
            <p class="change" :class="stats.dailyGrowth >= 0 ? 'positive' : 'negative'" v-if="stats.dailyGrowth !== undefined">
              <i :class="stats.dailyGrowth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i> 
              {{ Math.abs(stats.dailyGrowth).toFixed(1) }}% vs yesterday
            </p>
            <div class="card-overlay">
              <i class="fas fa-chart-line"></i>
              <span>View Analytics</span>
            </div>
          </div>
        </div>
        
        <div class="metric-card growth clickable-card" @click="goToAnalytics('growth')">
          <div class="metric-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="metric-content">
            <h3>Potential Growth</h3>
            <p class="number">{{ stats.potentialGrowth }}%</p>
            <p class="subtext">Based on 3-month projection</p>
            <div class="card-overlay">
              <i class="fas fa-chart-line"></i>
              <span>View Analytics</span>
            </div>
          </div>
        </div>
        
        <div class="metric-card users clickable-card" @click="goToUsersList()">
          <div class="metric-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="metric-content">
            <h3>Total Users</h3>
            <p class="number">{{ stats.totalUsers }}</p>
            <p class="subtext">{{ stats.newUsers }} new this {{ timeFilter }}</p>
            <div class="card-overlay">
              <i class="fas fa-users"></i>
              <span>View All Users</span>
            </div>
          </div>
        </div>

        <div class="metric-card staff clickable-card" @click="goToStaffAnalytics()">
          <div class="metric-icon">
            <i class="fas fa-user-tie"></i>
          </div>
          <div class="metric-content">
            <h3>Total Staff</h3>
            <p class="number">{{ stats.totalStaff }}</p>
            <p class="subtext">{{ stats.activeStaff }} active staff</p>
            <div class="card-overlay">
              <i class="fas fa-chart-bar"></i>
              <span>View Staff Analytics</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sales Trend Chart -->
      <div class="chart-container">
        <div class="chart-header">
          <h2><i class="fas fa-chart-bar"></i> Sales Trend</h2>
          <div class="chart-filters">
            <button 
              v-for="period in chartPeriods" 
              :key="period.value"
              @click="updateChartPeriod(period.value)"
              :class="['chart-filter-btn', { active: chartPeriod === period.value }]"
              :disabled="chartLoading"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
        <div class="chart-wrapper">
          <canvas ref="salesChart" id="salesChart"></canvas>
          <div v-if="chartLoading" class="chart-loading-indicator">
            <i class="fas fa-circle-notch fa-spin"></i> Loading...
          </div>
        </div>
      </div>
      
      <div class="dashboard-columns">
        <!-- Top Products Section -->
        <div class="dashboard-section products-section">
          <div class="section-header">
            <h2><i class="fas fa-shopping-bag"></i> Top Selling Products</h2>
            <div class="section-filters">
              <button 
                v-for="period in topSellingPeriods" 
                :key="period.value"
                @click="changeTopSellingPeriod(period.value)"
                :class="['filter-btn', { active: selectedTopSellingPeriod === period.value }]"
              >
                {{ period.label }}
              </button>
              <div v-if="selectedTopSellingPeriod === 'quarterly'" class="quarter-selector">
                <button 
                  v-for="quarter in topSellingQuarters" 
                  :key="quarter.value"
                  @click="selectTopSellingQuarter(quarter.value)"
                  :class="['quarter-btn', { active: selectedTopSellingQuarter === quarter.value }]"
                >
                  {{ quarter.label }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="table-container">
            <table v-if="stats.topProducts && stats.topProducts.length > 0">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, index) in stats.topProducts" :key="product.products_id">
                  <td>
                    <span class="rank">{{ index + 1 }}</span>
                  </td>
                  <td>
                    <div class="product-info">
                      <img 
                        :src="product.image" 
                        :alt="product.name"
                        class="product-thumbnail"
                        @error="handleImageError"
                      >
                      <span class="product-name">{{ product.name }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="sales-info">
                      <div class="quantity">{{ product.quantity || 0 }}</div>
                      <div class="label">units sold</div>
                    </div>
                  </td>
                  <td>₱{{ formatPrice(product.revenue || 0) }}</td>
                  <td>
                    <div class="performance-indicator" :class="getPerformanceClass(product)">
                      <i :class="getPerformanceIcon(product)"></i>
                      {{ getPerformanceLabel(product) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="no-data">
              <i class="fas fa-info-circle"></i>
              No sales data for this period
              <span class="help-text">Try selecting a different time period</span>
            </p>
          </div>
        </div>
        
        <!-- Top Staff & Customers Section -->
        <div class="dashboard-widgets">
          <!-- Top Staff -->
          <div class="dashboard-section staff-section">
            <h2><i class="fas fa-user-tie"></i> Top Staff</h2>
            <div class="table-container">
              <table v-if="stats.topStaff && stats.topStaff.length > 0">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Orders</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="staff in stats.topStaff" :key="staff.username">
                    <td>{{ staff.username }}</td>
                    <td>{{ staff.orders_handled }}</td>
                    <td>
                      <div class="performance-indicator" :class="getPerformanceClass(staff.orders_handled)">
                        <i :class="getPerformanceIcon({ weekly_orders: staff.orders_handled })"></i>
                        {{ getPerformanceLabel(staff.orders_handled) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="no-data">
                <i class="fas fa-info-circle"></i>
                No staff activity data available
              </p>
            </div>
          </div>
          
          <!-- Top Customers -->
          <div class="dashboard-section customers-section">
            <h2><i class="fas fa-users"></i> Top Customers</h2>
            <div class="table-container">
              <table v-if="stats.topCustomers && stats.topCustomers.length > 0">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="customer in stats.topCustomers" :key="customer.user_id">
                    <td>{{ customer.username }}</td>
                    <td>{{ customer.order_count }}</td>
                    <td>₱{{ formatCurrency(customer.total_amount) }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="no-data">
                <i class="fas fa-info-circle"></i>
                No customer data available
              </p>
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
import Chart from 'chart.js/auto'
import AdminCSS from './AdminCSS.css'

export default {
  name: 'AdminHome',
  components: {
    AdminNavbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      timeFilter: 'week',
      chartPeriod: 'week',
      selectedTopSellingPeriod: 'weekly',
      selectedTopSellingQuarter: 'Q1',
      salesChart: null,
      chartLoading: false,
      topSellingPeriods: [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Annually', value: 'annually' }
      ],
      topSellingQuarters: [
        { label: 'Q1', value: 'Q1' },
        { label: 'Q2', value: 'Q2' },
        { label: 'Q3', value: 'Q3' },
        { label: 'Q4', value: 'Q4' }
      ],
      chartPeriods: [
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
        { label: 'Quarter', value: 'quarter' },
        { label: 'Year', value: 'year' }
      ],
      stats: {
        totalSales: 0,
        dailyIncome: 0,
        dailyGrowth: 0,
        salesGrowth: 0,
        potentialGrowth: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalStock: 0,
        totalUsers: 0,
        newUsers: 0,
        totalStaff: 0,
        activeStaff: 0,
        topProducts: [],
        topStaff: [],
        topCustomers: [],
        salesData: {
          labels: [],
          datasets: []
        }
      }
    }
  },
  methods: {
    goToAnalytics(type) {
      this.$router.push({
        path: '/admin/analytics',
        query: { focus: type }
      });
    },

    // Add this new method to navigate to users list
    goToUsersList() {
      this.$router.push('/admin/users');
    },

    // Add this new method to navigate to staff analytics
    goToStaffAnalytics() {
      this.$router.push('/admin/staff-analytics');
    },

    async changeTopSellingPeriod(period) {
      this.selectedTopSellingPeriod = period;
      await this.fetchTopSellingProducts();
    },

    async selectTopSellingQuarter(quarter) {
      this.selectedTopSellingQuarter = quarter;
      await this.fetchTopSellingProducts();
    },
    
    async updateChartPeriod(period) {
      if (this.chartLoading) return; // Prevent multiple clicks during loading
      
      this.chartLoading = true;
      this.chartPeriod = period;
      await this.fetchChartData();
      
      // Add a small delay to ensure the animation has time to start
      setTimeout(() => {
        this.chartLoading = false;
      }, this.salesChart?.options?.animation?.duration || 1000);
    },
    
    getTopSellingPeriodLabel() {
      switch (this.selectedTopSellingPeriod) {
        case 'weekly':
          return 'Last 7 Days';
        case 'monthly':
          return 'Last 30 Days';
        case 'quarterly':
          const quarterMap = {
            Q1: 'January-March',
            Q2: 'April-June',
            Q3: 'July-September',
            Q4: 'October-December'
          };
          return quarterMap[this.selectedTopSellingQuarter];
        case 'annually':
          return 'Last 12 Months';
        default:
          return 'Last 7 Days';
      }
    },

    getPerformanceClass(product) {
      // Check if product is a number (staff orders_handled) or an object (product)
      if (typeof product === 'number') {
        // This is for staff performance
        const ordersHandled = product;
        if (ordersHandled >= 50) return 'excellent';
        if (ordersHandled >= 30) return 'excellent';
        if (ordersHandled >= 20) return 'good';
        if (ordersHandled >= 10) return 'normal';
        return 'low';
      } else {
        // This is for product performance
        const quantity = product.quantity || 0;
        if (quantity >= 10) return 'excellent';
        if (quantity >= 5) return 'good';
        if (quantity >= 1) return 'normal';
        return 'low';
      }
    },

    getPerformanceIcon(product) {
      const orders = typeof product === 'number' ? product : (product.quantity || 0);
      if (orders >= 10) return 'fas fa-rocket';
      if (orders >= 5) return 'fas fa-arrow-up';
      if (orders >= 1) return 'fas fa-arrow-right';
      return 'fas fa-arrow-down';
    },

    getPerformanceLabel(product) {
      // Check if product is a number (staff orders_handled) or an object (product)
      if (typeof product === 'number') {
        // This is for staff performance
        const ordersHandled = product;
        if (ordersHandled >= 50) return 'Outstanding';
        if (ordersHandled >= 30) return 'Excellent';
        if (ordersHandled >= 20) return 'Great';
        if (ordersHandled >= 10) return 'Good';
        return 'New';
      } else {
        // This is for product performance
        const quantity = product.quantity || 0;
        if (quantity >= 10) return 'High Demand';
        if (quantity >= 5) return 'Good Performance';
        if (quantity >= 1) return 'Steady Sales';
        return 'Low Movement';
      }
    },

    handleImageError(e) {
      e.target.src = '/img/placeholder.jpg';
    },

    formatPrice(price) {
      const num = Number(price);
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
      }
      return num.toFixed(2);
    },
    
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0);
    },
    
    formatDate(dateString) {
      const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    },
    
    async fetchDashboardStats() {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          timeFilter: this.timeFilter
        });
        
        const response = await this.$fetch(`/api/admin/dashboard-stats?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.stats = {
            ...this.stats,
            totalSales: data.totalSales || 0,
            dailyIncome: data.dailyIncome || 0,
            dailyGrowth: data.dailyGrowth || 0,
            salesGrowth: data.salesGrowth || 0,
            potentialGrowth: data.potentialGrowth || 0,
            totalUsers: data.totalUsers || 0,
            newUsers: data.newUsers || 0,
            totalStaff: data.totalStaff || 0,
            activeStaff: data.activeStaff || 0,
            topStaff: data.topStaff || []
          };

          // Fetch top customers separately
          await this.fetchTopCustomers();
          // Fetch top selling products separately
          await this.fetchTopSellingProducts();
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    },
    
    async fetchTopCustomers() {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          period: this.timeFilter
        });
        
        const response = await this.$fetch(`/api/admin/top-customers?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.stats.topCustomers = data || [];
        }
      } catch (error) {
        console.error('Error fetching top customers:', error);
      }
    },

    async fetchTopSellingProducts() {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          period: this.selectedTopSellingPeriod,
          quarter: this.selectedTopSellingQuarter
        });
        
        const response = await this.$fetch(`/api/admin/top-products?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.stats.topProducts = data || [];
        }
      } catch (error) {
        console.error('Error fetching top products:', error);
      }
    },

    async fetchChartData() {
      try {
        this.chartLoading = true;
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/admin/sales-chart?period=${this.chartPeriod}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.stats.salesData = data;
          this.initSalesChart();
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    },
    
    initSalesChart() {
      if (this.salesChart) {
        this.salesChart.destroy();
      }
      
      const ctx = this.$refs.salesChart.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
      
      this.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.stats.salesData.labels || [],
          datasets: [{
            label: 'Sales',
            data: this.stats.salesData.sales || [],
            backgroundColor: gradient,
            borderColor: '#3b82f6',
            borderWidth: 3,
            pointBackgroundColor: '#3b82f6',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: true
          }, {
            label: 'Orders',
            data: this.stats.salesData.orders || [],
            borderColor: '#10b981',
            borderWidth: 3,
            pointBackgroundColor: '#10b981',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 800,
            onComplete: () => {
              this.chartLoading = false;
            }
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 13
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              titleFont: {
                size: 14,
                weight: 'normal'
              },
              bodyFont: {
                size: 14
              },
              padding: 15,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label || '';
                  if (label === 'Sales') {
                    return `${label}: ₱${context.raw.toLocaleString()}`;
                  }
                  return `${label}: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
                drawBorder: false
              },
              ticks: {
                font: {
                  size: 11
                },
                color: '#64748b'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(226, 232, 240, 0.5)',
                drawBorder: false
              },
              ticks: {
                font: {
                  size: 11
                },
                color: '#64748b',
                callback: function(value) {
                  if (value >= 1000) {
                    return `₱${value/1000}k`;
                  }
                  return `₱${value}`;
                }
              }
            }
          }
        }
      });
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
    }
  },
  async mounted() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username || 'Admin';
      await this.fetchDashboardStats();
      await this.fetchChartData();
    }
  }
}
</script>



