<template>
  <div class="admin-container">
    <AdminNavbar 
      :username="username"
      @logout="showLogoutModal = true"
    />
    
    <div class="admin-content">
      <div class="dashboard-cards">
        <router-link to="/admin/users" class="card clickable">
          <i class="fas fa-users"></i>
          <h3>Total Users</h3>
          <p class="number">{{ stats.totalUsers || 0 }}</p>
        </router-link>  

        <div class="card">
          <i class="fas fa-dollar-sign"></i>
          <h3>Total Sales</h3>
          <p class="number">₱{{ formatPrice(stats.totalSales || 0) }}</p>
        </div>

        <router-link to="/admin/products" class="card clickable">
          <i class="fas fa-box"></i>
          <h3>Total Products</h3>
          <p class="number">{{ stats.totalProducts || 0 }}</p>
        </router-link>

        <router-link to="/admin/orders" class="card clickable">
          <i class="fas fa-shopping-cart"></i>
          <h3>Total Orders</h3>
          <p class="number">{{ stats.totalOrders || 0 }}</p>
        </router-link>

        <router-link to="/admin/low-stock" class="card clickable">
          <i class="fas fa-warehouse"></i>
          <h3>Total Stock</h3>
          <p class="number">{{ stats.totalStock || 0 }}</p>
        </router-link>
      </div>

      <!-- Top Selling Products Section -->
      <div class="dashboard-section">
        <h2>
          <i class="fas fa-chart-line"></i>
          Top Selling Products
          <span class="period-badge">{{ getTopSellingPeriodLabel() }}</span>
        </h2>
        <div class="period-selector-container">
          <div class="period-selector">
            <button 
              v-for="period in topSellingPeriods" 
              :key="period.value"
              :class="['period-btn', { active: selectedTopSellingPeriod === period.value }]"
              @click="changeTopSellingPeriod(period.value)"
            >
              {{ period.label }}
            </button>
          </div>
          <div v-if="selectedTopSellingPeriod === 'quarterly'" class="quarter-selector">
            <button 
              v-for="quarter in topSellingQuarters" 
              :key="quarter.value"
              :class="['quarter-btn', { active: selectedTopSellingQuarter === quarter.value }]"
              @click="selectTopSellingQuarter(quarter.value)"
            >
              {{ quarter.label }}
            </button>
          </div>
        </div>
        <div class="table-container">
          <table v-if="stats.topProducts && stats.topProducts.length">
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Sales</th>
                <th>Total Sales</th>
                <th>Weekly Revenue</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(product, index) in stats.topProducts" :key="product.name">
                <td>
                  <div class="product-info">
                    <img 
                      :src="product.image || '/img/placeholder.jpg'" 
                      :alt="product.name"
                      class="product-thumbnail"
                      @error="handleImageError"
                    >
                    <div class="product-details">
                      <span class="rank">{{ index + 1 }}</span>
                      <span class="product-name">{{ product.name }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="sales-info">
                    <span class="quantity">{{ product.weekly_quantity }}</span>
                    <span class="label">units</span>
                  </div>
                </td>
                <td>
                  <div class="sales-info">
                    <span class="quantity">{{ product.total_quantity }}</span>
                    <span class="label">total units</span>
                  </div>
                </td>
                <td>₱{{ formatPrice(product.weekly_revenue) }}</td>
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
            <i class="fas fa-chart-bar"></i>
            No sales data available for the past week
          </p>
        </div>
      </div>

      <!-- Top Performing Staff Section -->
      <div class="dashboard-section">
        <h2>
          <i class="fas fa-star"></i>
          Top Performing Staff
        </h2>
        <div class="table-container">
          <table v-if="stats.topStaff && stats.topStaff.length">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Staff Name</th>
                <th>Orders Handled</th>
                <th>Total Sales</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(staff, index) in stats.topStaff" :key="staff.id">
                <td>
                  <span class="rank">{{ index + 1 }}</span>
                </td>
                <td>{{ staff.username }}</td>
                <td>{{ staff.orders_handled }}</td>
                <td>₱{{ formatPrice(staff.total_sales) }}</td>
                <td>
                  <div class="performance-indicator">
                    <i class="fas fa-trophy" v-if="index === 0"></i>
                    <i class="fas fa-medal" v-else-if="index === 1"></i>
                    <i class="fas fa-award" v-else-if="index === 2"></i>
                    {{ getPerformanceLabel(staff.orders_handled) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="no-data">
            <i class="fas fa-users"></i>
            No staff performance data available yet
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
      selectedTopSellingPeriod: 'weekly',
      selectedTopSellingQuarter: 'Q1',
      topSellingPeriods: [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Annually', value: 'annually' }
      ],
      topSellingQuarters: [
        { label: 'Q1 (Jan-Mar)', value: 'Q1' },
        { label: 'Q2 (Apr-Jun)', value: 'Q2' },
        { label: 'Q3 (Jul-Sep)', value: 'Q3' },
        { label: 'Q4 (Oct-Dec)', value: 'Q4' }
      ],
      stats: {
        totalSales: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalStock: 0,
        topProducts: [],
        topStaff: []
      }
    }
  },
  methods: {
    async changeTopSellingPeriod(period) {
      this.selectedTopSellingPeriod = period;
      await this.fetchDashboardStats();
    },

    async selectTopSellingQuarter(quarter) {
      this.selectedTopSellingQuarter = quarter;
      await this.fetchDashboardStats();
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
      const weeklyOrders = product.weekly_orders || 0;
      if (weeklyOrders >= 10) return 'excellent';
      if (weeklyOrders >= 5) return 'good';
      if (weeklyOrders >= 1) return 'normal';
      return 'low';
    },

    getPerformanceIcon(product) {
      const weeklyOrders = product.weekly_orders || 0;
      if (weeklyOrders >= 10) return 'fas fa-rocket';
      if (weeklyOrders >= 5) return 'fas fa-arrow-up';
      if (weeklyOrders >= 1) return 'fas fa-arrow-right';
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
        const weeklyOrders = product.weekly_orders || 0;
        if (weeklyOrders >= 10) return 'High Demand';
        if (weeklyOrders >= 5) return 'Good Performance';
        if (weeklyOrders >= 1) return 'Steady Sales';
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

    async fetchDashboardStats() {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          topSellingPeriod: this.selectedTopSellingPeriod,
          topSellingQuarter: this.selectedTopSellingQuarter
        });
        
        const response = await fetch(`http://localhost:7904/api/admin/dashboard-stats?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.stats = data;
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
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
      await this.fetchDashboardStats();
    }
  }
}
</script>

<style scoped>
  /* Base Layout */
  .admin-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px; /* Match sidebar width */
  }
  
  .admin-content {
    padding: 2rem;
    margin: 0 auto;
  }
  
  /* Dashboard Cards */
  .dashboard-cards {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .card {
    background: white;
    padding: 1.5rem; /* Reduced padding */
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .clickable {
    cursor: pointer;
    text-decoration: none;
    color: inherit;
  }
  
  .clickable:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }
  
  .card h3 {
    margin: 0;
    color: #64748b;
    font-size: 1.1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .card .number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #1e293b;
    margin: 1rem 0 0;
    line-height: 1;
  }
  
  /* Dashboard Sections */
  .dashboard-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-top: 2rem;
  }
  
  .dashboard-section h2 {
    color: #1e293b;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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

  .performance-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .performance-indicator.excellent {
    background-color: #f0fdf4;
    color: #166534;
  }

  .performance-indicator.good {
    background-color: #ecfdf5;
    color: #047857;
  }

  .performance-indicator.normal {
    background-color: #f0f9ff;
    color: #0369a1;
  }

  .performance-indicator.low {
    background-color: #fef2f2;
    color: #dc2626;
  }
  
  .performance-indicator i {
    color: #fbbf24;
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
  
  /* Tables */
  .table-container {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  
  th, td {
    padding: 1rem 1.5rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    background-color: #f8fafc;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
  }
  
  tr:hover {
    background-color: #f8fafc;
  }
  
  .no-data {
    text-align: center;
    color: #64748b;
    padding: 3rem;
    font-size: 1rem;
  }
  
  .no-data .help-text {
    margin-top: 1rem;
    font-weight: 500;
  }
  
  .period-badge {
    font-size: 0.8rem;
    background-color: #e0f2fe;
    color: #0369a1;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    margin-left: 1rem;
    font-weight: 500;
  }

  .product-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .product-thumbnail {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
  }

  .product-details {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .product-name {
    font-weight: 500;
    color: #1e293b;
  }

  .sales-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .quantity {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
  }

  .label {
    font-size: 0.8rem;
    color: #64748b;
  }
  
  .period-selector-container {
    margin-bottom: 1.5rem;
  }

  .period-selector {
    display: flex;
    gap: 0.5rem;
    background-color: #f1f5f9;
    padding: 0.25rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .period-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #64748b;
    transition: all 0.2s;
    flex: 1;
  }

  .period-btn:hover {
    color: #1e293b;
    background-color: #e2e8f0;
  }

  .period-btn.active {
    background-color: white;
    color: #3b82f6;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .quarter-selector {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .quarter-btn {
    padding: 0.4rem 0.75rem;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    color: #64748b;
    transition: all 0.2s;
    flex: 1;
  }

  .quarter-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .quarter-btn.active {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  
  /* Responsive Design */
  @media (max-width: 1200px) {
    .dashboard-cards {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  @media (max-width: 768px) {
    .period-selector,
    .quarter-selector {
      flex-wrap: wrap;
    }
    
    .period-btn,
    .quarter-btn {
      flex: 1 1 calc(50% - 0.25rem);
    }
    
    .admin-container {
      padding-left: 60px; /* Match collapsed sidebar width */
    }
    
    .admin-content {
      padding: 1rem;
    }
    
    .dashboard-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  
    .card {
      padding: 1.5rem;
    }
  
    .dashboard-section {
      padding: 1.5rem;
    }
  
    th, td {
      padding: 0.75rem 1rem;
    }
  
    .card .number {
      font-size: 2rem;
    }
    
    .product-thumbnail {
      width: 32px;
      height: 32px;
    }

    .quantity {
      font-size: 1rem;
    }

    .label {
      font-size: 0.75rem;
    }

    .period-badge {
      display: block;
      margin: 0.5rem 0 0;
      text-align: center;
    }
  }
  
  @media (max-width: 480px) {
    .table-container {
      margin: 0 -1rem;
      border-radius: 0;
    }
    
    .dashboard-cards {
      grid-template-columns: 1fr;
    }
  }
</style>