<template>
  <div class="admin-container">
    <AdminNavbar 
      :username="username"
      @logout="showLogoutModal = true"
    />
    
    <div class="admin-content">
      <div class="dashboard-header">
        <h1><i class="fas fa-users-cog"></i> Staff Analytics</h1>
        <div class="header-actions">
          <div class="time-filter">
            <select v-model="timeFilter" @change="fetchStaffAnalytics()">
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Staff Summary Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon total-staff">
            <i class="fas fa-users"></i>
          </div>
          <div class="metric-content">
            <h3>Total Staff</h3>
            <p class="number">{{ staffSummary.totalStaff }}</p>
            <p class="subtext">{{ staffSummary.activeStaff }} active staff</p>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon total-sales">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="metric-content">
            <h3>Total Sales</h3>
            <p class="number">{{ staffSummary.totalSales }}</p>
            <p class="subtext">From all staff</p>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon total-orders">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <div class="metric-content">
            <h3>Orders Accepted</h3>
            <p class="number">{{ staffSummary.totalOrdersAccepted }}</p>
            <p class="subtext">{{ timeFilterLabel }}</p>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon avg-performance">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="metric-content">
            <h3>Avg Performance</h3>
            <p class="number">{{ staffSummary.avgPerformance }}%</p>
            <p class="subtext">Staff efficiency</p>
          </div>
        </div>
      </div>
      
      <!-- Charts Section -->
      <div class="charts-container">
        <!-- Sales Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h2><i class="fas fa-chart-bar"></i> Staff Sales Performance</h2>
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
            <div v-if="chartLoading" class="chart-loading-indicator">
              <i class="fas fa-spinner fa-spin"></i> Loading chart...
            </div>
            <canvas ref="salesChart"></canvas>
          </div>
        </div>
        
        <!-- Orders Accepted Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h2><i class="fas fa-clipboard-check"></i> Orders Accepted by Staff</h2>
          </div>
          <div class="chart-wrapper">
            <canvas ref="ordersChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Staff Performance Table -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2><i class="fas fa-trophy"></i> Staff Performance Ranking</h2>
          <div class="section-filters">
            <button 
              v-for="metric in performanceMetrics" 
              :key="metric.value"
              @click="sortBy = metric.value"
              :class="['filter-btn', { active: sortBy === metric.value }]"
            >
              {{ metric.label }}
            </button>
          </div>
        </div>
        
        <div class="table-container">
          <table v-if="staffPerformance && staffPerformance.length > 0">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Staff Name</th>
                <th>Sales Made</th>
                <th>Orders Accepted</th>
                <th>Performance Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(staff, index) in sortedStaffPerformance" :key="staff.staff_id">
                <td>
                  <div class="rank">{{ index + 1 }}</div>
                </td>
                <td>
                  <div class="staff-info">
                    <div class="staff-avatar">
                      <i class="fas fa-user"></i>
                    </div>
                    <div>
                      <div class="staff-name">{{ staff.username }}</div>
                      <div class="staff-role">{{ staff.role || 'Staff' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="sales-info">
                    <div class="amount">₱{{ formatCurrency(staff.total_sales) }}</div>
                    <div class="label">{{ staff.sales_count }} transactions</div>
                  </div>
                </td>
                <td>
                  <div class="orders-info">
                    <div class="count">{{ staff.orders_accepted }}</div>
                    <div class="label">orders</div>
                  </div>
                </td>
                <td>
                  <div class="performance-score">
                    <div class="score">{{ staff.performance_score }}%</div>
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: staff.performance_score + '%' }"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="status-indicator" :class="getStatusClass(staff.last_active)">
                    <i :class="getStatusIcon(staff.last_active)"></i>
                    {{ getStatusText(staff.last_active) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="no-data">
            <i class="fas fa-info-circle"></i>
            No staff performance data available for the selected period
          </p>
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

export default {
  name: 'AdminStaffAnalytics',
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
      sortBy: 'performance_score',
      chartLoading: false,
      salesChart: null,
      ordersChart: null,
      chartPeriods: [
        { label: 'Day', value: 'day' },
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
        { label: 'Quarter', value: 'quarter' },
        { label: 'Year', value: 'year' }
      ],
      performanceMetrics: [
        { label: 'Performance Score', value: 'performance_score' },
        { label: 'Total Sales', value: 'total_sales' },
        { label: 'Orders Accepted', value: 'orders_accepted' },
        { label: 'Sales Count', value: 'sales_count' }
      ],
      staffSummary: {
        totalStaff: 0,
        activeStaff: 0,
        totalSales: 0,
        totalOrdersAccepted: 0,
        avgPerformance: 0
      },
      staffPerformance: [],
      salesChartData: {
        labels: ['No Data'],
        datasets: [{
          label: 'Sales',
          data: [0],
          backgroundColor: '#e2e8f0',
          borderColor: '#e2e8f0'
        }]
      },
      ordersChartData: {
        labels: ['No Data'],
        datasets: [{
          label: 'Orders',
          data: [0],
          backgroundColor: '#e2e8f0'
        }]
      }
    }
  },
  computed: {
    timeFilterLabel() {
      const labels = {
        day: 'today',
        week: 'this week',
        month: 'this month',
        quarter: 'this quarter',
        year: 'this year'
      };
      return labels[this.timeFilter] || '';
    },
    sortedStaffPerformance() {
      if (!this.staffPerformance) return [];
      return [...this.staffPerformance].sort((a, b) => {
        const aValue = a[this.sortBy] || 0;
        const bValue = b[this.sortBy] || 0;
        return bValue - aValue;
      });
    }
  },
  methods: {
    async fetchStaffAnalytics() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch staff summary
        const summaryResponse = await this.$fetch(`/api/admin/staff-analytics/summary?period=${this.timeFilter}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (summaryResponse.ok) {
          this.staffSummary = await summaryResponse.json();
        }

        // Fetch staff performance data
        const performanceResponse = await this.$fetch(`/api/admin/staff-analytics/performance?period=${this.timeFilter}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (performanceResponse.ok) {
          this.staffPerformance = await performanceResponse.json();
        }

        // Fetch chart data
        await this.fetchChartData();

      } catch (error) {
        console.error('Error fetching staff analytics:', error);
      }
    },

    async fetchChartData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch sales chart data
        const salesResponse = await this.$fetch(`/api/admin/staff-analytics/sales-chart?period=${this.chartPeriod}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          // Store as non-reactive data using Object.freeze or JSON parse/stringify
          this.salesChartData = salesData && salesData.labels && salesData.datasets 
            ? JSON.parse(JSON.stringify(salesData))
            : { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: ['#e2e8f0'] }] };
          
          // Update chart if it exists and is not destroyed
          if (this.salesChart && !this.salesChart.destroyed) {
            // Use update method which now handles reinitializing
            this.$nextTick(() => {
              this.updateSalesChart();
            });
          }
        } else {
          this.salesChartData = { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: ['#e2e8f0'] }] };
        }

        // Fetch orders chart data
        const ordersResponse = await this.$fetch(`/api/admin/staff-analytics/orders-chart?period=${this.chartPeriod}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          // Store as non-reactive data using JSON parse/stringify
          this.ordersChartData = ordersData && ordersData.labels && ordersData.datasets
            ? JSON.parse(JSON.stringify(ordersData))
            : { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: ['#e2e8f0'] }] };
          
          // Update chart if it exists and is not destroyed
          if (this.ordersChart && !this.ordersChart.destroyed) {
            // Use update method which now handles reinitializing
            this.$nextTick(() => {
              this.updateOrdersChart();
            });
          }
        } else {
          this.ordersChartData = { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: ['#e2e8f0'] }] };
        }

      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Set fallback data on error
        this.salesChartData = { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: ['#e2e8f0'] }] };
        this.ordersChartData = { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: ['#e2e8f0'] }] };
      }
    },

    async updateChartPeriod(period) {
      if (this.chartLoading) return;
      
      this.chartLoading = true;
      this.chartPeriod = period;
      await this.fetchChartData();
      
      setTimeout(() => {
        this.chartLoading = false;
      }, 1000);
    },

    initSalesChart() {
      try {
        // Destroy existing chart first
        if (this.salesChart) {
          try {
            this.salesChart.destroy();
          } catch (destroyError) {
            console.warn('Error destroying existing sales chart:', destroyError);
          }
          this.salesChart = null;
        }
        
        // Check if the canvas element exists and is mounted
        if (!this.$refs.salesChart) {
          console.warn('Sales chart canvas not found');
          return;
        }
        
        // Clear canvas to prevent context issues
        const canvas = this.$refs.salesChart;
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Ensure we have valid chart data with deep copy to avoid reactivity issues
        const chartData = this.salesChartData && this.salesChartData.labels && this.salesChartData.datasets
          ? JSON.parse(JSON.stringify({
              labels: this.salesChartData.labels,
              datasets: this.salesChartData.datasets
            }))
          : { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: '#e2e8f0' }] };
        
        // Create chart with error handling and safer options
        try {
          this.salesChart = new Chart(canvas, {
            type: 'bar',
            data: chartData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              devicePixelRatio: 1, // Fix for high DPI displays
              interaction: {
                intersect: false
              },
              animation: false, // Disable animations to prevent context issues
              plugins: {
                legend: {
                  display: chartData.datasets && chartData.datasets.length > 1
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '₱' + Number(value).toLocaleString();
                    }
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error('Error creating sales chart:', error);
          this.salesChart = null;
        }
      } catch (error) {
        console.error('Error in initSalesChart:', error);
        this.salesChart = null;
      }
    },

    initOrdersChart() {
      try {
        // Destroy existing chart first
        if (this.ordersChart) {
          try {
            this.ordersChart.destroy();
          } catch (destroyError) {
            console.warn('Error destroying existing orders chart:', destroyError);
          }
          this.ordersChart = null;
        }
        
        // Check if the canvas element exists and is mounted
        if (!this.$refs.ordersChart) {
          console.warn('Orders chart canvas not found');
          return;
        }
        
        // Clear canvas to prevent context issues
        const canvas = this.$refs.ordersChart;
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Ensure we have valid chart data with deep copy to avoid reactivity issues
        const chartData = this.ordersChartData && this.ordersChartData.labels && this.ordersChartData.datasets
          ? JSON.parse(JSON.stringify({
              labels: this.ordersChartData.labels,
              datasets: this.ordersChartData.datasets
            }))
          : { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: '#e2e8f0' }] };
        
        // Create chart with error handling and safer options
        try {
          this.ordersChart = new Chart(canvas, {
            type: 'doughnut',
            data: chartData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              devicePixelRatio: 1, // Fix for high DPI displays
              interaction: {
                intersect: false
              },
              animation: false, // Disable animations to prevent context issues
              plugins: {
                legend: {
                  position: 'bottom',
                  display: chartData.labels && chartData.labels.length > 0 && !chartData.labels.includes('No Data')
                }
              }
            }
          });
        } catch (error) {
          console.error('Error creating orders chart:', error);
          this.ordersChart = null;
        }
      } catch (error) {
        console.error('Error in initOrdersChart:', error);
        this.ordersChart = null;
      }
    },

    updateSalesChart() {
      try {
        // Check if chart exists and is not destroyed
        if (!this.salesChart || this.salesChart.destroyed) {
          console.warn('Sales chart does not exist or was destroyed, reinitializing...');
          return;
        }

        // Validate chart data
        if (!this.salesChartData || !this.salesChartData.labels || !this.salesChartData.datasets) {
          console.warn('Invalid sales chart data, skipping update');
          return;
        }

        // Destroy and recreate instead of updating to avoid reactivity issues
        this.salesChart.destroy();
        this.salesChart = null;
        
        this.$nextTick(() => {
          this.initSalesChart();
        });
        
      } catch (error) {
        console.error('Error updating sales chart:', error);
        // Clean up on error
        try {
          if (this.salesChart && !this.salesChart.destroyed) {
            this.salesChart.destroy();
          }
        } catch (destroyError) {
          console.error('Error destroying sales chart:', destroyError);
        }
        this.salesChart = null;
      }
    },

    updateOrdersChart() {
      try {
        // Check if chart exists and is not destroyed
        if (!this.ordersChart || this.ordersChart.destroyed) {
          console.warn('Orders chart does not exist or was destroyed, reinitializing...');
          return;
        }

        // Validate chart data
        if (!this.ordersChartData || !this.ordersChartData.labels || !this.ordersChartData.datasets) {
          console.warn('Invalid orders chart data, skipping update');
          return;
        }

        // Destroy and recreate instead of updating to avoid reactivity issues
        this.ordersChart.destroy();
        this.ordersChart = null;
        
        this.$nextTick(() => {
          this.initOrdersChart();
        });
        
      } catch (error) {
        console.error('Error updating orders chart:', error);
        // Clean up on error
        try {
          if (this.ordersChart && !this.ordersChart.destroyed) {
            this.ordersChart.destroy();
          }
        } catch (destroyError) {
          console.error('Error destroying orders chart:', destroyError);
        }
        this.ordersChart = null;
      }
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        maximumFractionDigits: 2
      }).format(value || 0);
    },

    getStatusClass(lastActive) {
      if (!lastActive) return 'offline';
      const lastActiveDate = new Date(lastActive);
      const now = new Date();
      const diffHours = (now - lastActiveDate) / (1000 * 60 * 60);
      
      if (diffHours < 1) return 'online';
      if (diffHours < 24) return 'recent';
      return 'offline';
    },

    getStatusIcon(lastActive) {
      const statusClass = this.getStatusClass(lastActive);
      const icons = {
        online: 'fas fa-circle',
        recent: 'fas fa-clock',
        offline: 'fas fa-circle'
      };
      return icons[statusClass] || 'fas fa-circle';
    },

    getStatusText(lastActive) {
      const statusClass = this.getStatusClass(lastActive);
      const texts = {
        online: 'Online',
        recent: 'Recent',
        offline: 'Offline'
      };
      return texts[statusClass] || 'Unknown';
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
        } else {
          throw new Error('Logout failed');
        }
      } catch (error) {
        console.error('Logout failed:', error);
        // Even if logout API fails, remove token and redirect
        localStorage.removeItem('token');
        this.$router.push('/login');
      } finally {
        this.showLogoutModal = false;
      }
    }
  },
  
  async mounted() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        this.username = decoded.username || 'Admin';
        
        // Initialize default chart data to prevent null errors
        this.salesChartData = { labels: ['Loading...'], datasets: [{ label: 'Loading', data: [0], backgroundColor: '#e2e8f0' }] };
        this.ordersChartData = { labels: ['Loading...'], datasets: [{ label: 'Loading', data: [0], backgroundColor: '#e2e8f0' }] };
        
        // Wait for DOM to be fully ready with longer delay for chart initialization
        this.$nextTick(() => {
          setTimeout(() => {
            try {
              // Double check that canvas elements exist and are ready
              if (this.$refs.salesChart && this.$refs.ordersChart && 
                  this.$refs.salesChart.offsetWidth > 0 && this.$refs.ordersChart.offsetWidth > 0) {
                this.initSalesChart();
                this.initOrdersChart();
                
                // Fetch real data after successful chart initialization
                setTimeout(async () => {
                  try {
                    await this.fetchStaffAnalytics();
                  } catch (dataError) {
                    console.error('Error fetching initial data:', dataError);
                  }
                }, 300);
                
                // Add resize observer for responsive chart handling
                if (window.ResizeObserver) {
                  this.resizeObserver = new ResizeObserver(() => {
                    if (this.salesChart && !this.salesChart.destroyed) {
                      this.salesChart.resize();
                    }
                    if (this.ordersChart && !this.ordersChart.destroyed) {
                      this.ordersChart.resize();
                    }
                  });
                  
                  if (this.$refs.salesChart) {
                    this.resizeObserver.observe(this.$refs.salesChart.parentElement);
                  }
                  if (this.$refs.ordersChart) {
                    this.resizeObserver.observe(this.$refs.ordersChart.parentElement);
                  }
                }
              } else {
                // Retry chart initialization if canvas not ready
                setTimeout(() => {
                  if (this.$refs.salesChart && this.$refs.ordersChart) {
                    this.initSalesChart();
                    this.initOrdersChart();
                  }
                }, 500);
              }
            } catch (error) {
              console.error('Error initializing charts:', error);
            }
          }, 300);
        });
      }
    } catch (error) {
      console.error('Error in mounted lifecycle:', error);
    }
  },

  beforeUnmount() {
    try {
      // Clean up resize observer
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      
      // Destroy charts
      if (this.salesChart) {
        this.salesChart.destroy();
        this.salesChart = null;
      }
      if (this.ordersChart) {
        this.ordersChart.destroy();
        this.ordersChart = null;
      }
    } catch (error) {
      console.error('Error destroying charts:', error);
    }
  }
}
</script>

<style scoped>
/* Base Layout */
.admin-container {
  font-family: 'Inter', Arial, sans-serif;
  min-height: 100vh;
  background-color: #f8fafc;
  padding-left: 250px;
}

.admin-content {
  padding: 2rem;
  margin: 0 auto;
}

/* Dashboard Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 1.75rem;
  color: #111827;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.time-filter select {
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 2rem 0.5rem 1rem;
  font-size: 0.9rem;
  color: #1e293b;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.time-filter select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  display: flex;
  align-items: flex-start;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 54px;
  height: 54px;
  border-radius: 12px;
  margin-right: 1rem;
}

.total-staff {
  background-color: #f0f9ff;
  color: #0284c7;
}

.total-sales {
  background-color: #f0fdf4;
  color: #16a34a;
}

.total-orders {
  background-color: #fdf4ff;
  color: #c026d3;
}

.avg-performance {
  background-color: #eff6ff;
  color: #2563eb;
}

.metric-icon i {
  font-size: 1.5rem;
}

.metric-content {
  flex: 1;
}

.metric-content h3 {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-content .number {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0.5rem 0 0.25rem;
  line-height: 1.2;
}

.metric-content .subtext {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.5rem 0 0;
}

/* Charts Container */
.charts-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.chart-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chart-filters {
  display: flex;
  gap: 0.5rem;
}

.chart-filter-btn {
  padding: 0.5rem 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-filter-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.chart-filter-btn.active {
  background-color: #eff6ff;
  color: #3b82f6;
  border-color: #bfdbfe;
  font-weight: 500;
}

.chart-filter-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.chart-loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #3b82f6;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 5;
}

/* Dashboard Section */
.dashboard-section {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-section h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-btn {
  padding: 0.4rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.filter-btn.active {
  background-color: #eff6ff;
  color: #3b82f6;
  border-color: #bfdbfe;
  font-weight: 500;
}

/* Table */
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  margin-top: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #64748b;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tr:hover {
  background-color: #f8fafc;
}

tr:last-child td {
  border-bottom: none;
}

.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f3f4f6;
  color: #4b5563;
  font-weight: 600;
  font-size: 0.875rem;
}

tr:nth-child(1) .rank {
  background-color: #fef3c7;
  color: #92400e;
}

tr:nth-child(2) .rank {
  background-color: #f1f5f9;
  color: #475569;
}

tr:nth-child(3) .rank {
  background-color: #fff7ed;
  color: #9a3412;
}

.staff-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.staff-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.staff-name {
  font-weight: 500;
  color: #1e293b;
}

.staff-role {
  font-size: 0.8rem;
  color: #64748b;
}

.sales-info, .orders-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.amount, .count {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.label {
  font-size: 0.8rem;
  color: #64748b;
}

.performance-score {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.score {
  font-weight: 600;
  color: #1e293b;
}

.progress-bar {
  width: 60px;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-indicator.online {
  background-color: #f0fdf4;
  color: #166534;
}

.status-indicator.online i {
  color: #16a34a;
}

.status-indicator.recent {
  background-color: #fef3c7;
  color: #92400e;
}

.status-indicator.recent i {
  color: #f59e0b;
}

.status-indicator.offline {
  background-color: #fef2f2;
  color: #dc2626;
}

.status-indicator.offline i {
  color: #ef4444;
}

.no-data {
  text-align: center;
  color: #64748b;
  padding: 3rem 1rem;
  font-size: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
}

.no-data i {
  font-size: 2rem;
  color: #94a3b8;
  margin-bottom: 1rem;
  display: block;
}

/* Responsive Design */
@media (max-width: 1280px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .chart-wrapper {
    height: 280px;
  }
}

@media (max-width: 768px) {
  .admin-container {
    padding-left: 0;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.5rem;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .metric-card {
    padding: 1rem;
  }
  
  .metric-icon {
    width: 48px;
    height: 48px;
  }
  
  .metric-content .number {
    font-size: 1.5rem;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .chart-filters {
    flex-wrap: wrap;
    width: 100%;
  }
  
  .chart-filter-btn {
    flex: 1;
    min-width: calc(33.333% - 0.33rem);
    text-align: center;
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .chart-wrapper {
    height: 250px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .section-filters {
    width: 100%;
    justify-content: flex-start;
  }
  
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 0 -1rem;
    padding: 0 1rem;
  }
  
  table {
    min-width: 600px;
  }
  
  th, td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }
  
  .staff-info {
    gap: 0.5rem;
  }
  
  .staff-avatar {
    width: 32px;
    height: 32px;
  }
  
  .staff-name {
    font-size: 0.9rem;
  }
  
  .staff-role {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .admin-content {
    padding: 0.75rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.25rem;
  }
  
  .metric-card {
    padding: 0.75rem;
  }
  
  .metric-icon {
    width: 40px;
    height: 40px;
  }
  
  .metric-content .number {
    font-size: 1.25rem;
  }
  
  .chart-card {
    padding: 1rem;
  }
  
  .chart-filters {
    gap: 0.25rem;
  }
  
  .chart-filter-btn {
    padding: 0.3rem 0.4rem;
    font-size: 0.75rem;
    min-width: calc(50% - 0.125rem);
  }
  
  .chart-wrapper {
    height: 200px;
  }
  
  .dashboard-section {
    padding: 1rem;
  }
  
  .table-container {
    margin: 0 -1rem;
    padding: 0 1rem;
    border-radius: 0;
  }
  
  .table-container table {
    min-width: 500px;
    border-radius: 0;
  }
  
  th, td {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }
  
  .section-filters {
    gap: 0.25rem;
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .time-filter select {
    padding: 0.4rem 1.5rem 0.4rem 0.75rem;
    font-size: 0.8rem;
  }
}

/* Additional responsive improvements */
@media (max-width: 360px) {
  .admin-content {
    padding: 0.5rem;
  }
  
  .metric-card {
    flex-direction: column;
    text-align: center;
  }
  
  .metric-icon {
    margin: 0 auto 0.5rem;
  }
  
  .chart-filter-btn {
    min-width: 100%;
    margin-bottom: 0.25rem;
  }
  
  .chart-filters {
    flex-direction: column;
    width: 100%;
  }
  
  .section-filters {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
