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

        <router-link to="/admin/products" class="card clickable">
          <i class="fas fa-warehouse"></i>
          <h3>Total Stock</h3>
          <p class="number">{{ stats.totalStock || 0 }}</p>
        </router-link>
      </div>

      <!-- Low Stock Alert Section -->
      <div class="dashboard-section">
        <h2>
          <i class="fas fa-exclamation-triangle"></i>
          Low Stock Alert
        </h2>
        <div class="table-container low-stock-table">
          <table v-if="filteredLowStock.length">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Stock Left</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredLowStock" :key="item.type === 'choice' ? `choice-${item.choice_id}` : `product-${item.id}`">
                  <td>
                      {{ item.type === 'choice' ? 
                          `${item.product_name} (${item.choice_name})` : 
                          item.name }}
                      <span v-if="item.type === 'choice'" class="choice-badge">
                          <i class="fas fa-tag"></i> Variant
                      </span>
                  </td>
                  <td>
                      <div v-if="editingId === (item.type === 'choice' ? `choice-${item.choice_id}` : item.id)" class="stock-edit">
                          <input 
                              type="number" 
                              v-model="editingStock"
                              min="0"
                              @keyup.enter="saveStock(item)"
                              @keyup.esc="cancelEdit()"
                              :ref="el => { if (el) stockInput = el }"
                              class="stock-input"
                          >
                      </div>
                      <span v-else class="stock-badge" :class="getStockStatusClass(item.stock)">
                          {{ item.stock }}
                      </span>
                  </td>
                  <td>₱{{ formatPrice(item.price) }}</td>
                  <td>
                      <button v-if="editingId === (item.type === 'choice' ? `choice-${item.choice_id}` : item.id)" class="save-btn" @click="saveStock(item)">
                          <i class="fas fa-save"></i> Save
                      </button>
                      <button v-else @click="startEdit(item)" class="edit-btn">
                          <i class="fas fa-edit"></i> Edit Stock
                      </button>
                  </td>
              </tr>
          </tbody>
          </table>
          <p v-else class="no-data">
            <i class="fas fa-check-circle"></i>
            No products with low stock
          </p>
        </div>
      </div>

      
      <div class="dashboard-section">
        <h2>
          <i class="fas fa-chart-line"></i>
          Sales Forecasts
          <span class="period-badge">{{ getForecastPeriodLabel() }}</span>
        </h2>
        <div class="period-selector-container">
          <div class="period-selector">
            <button 
              v-for="period in forecastPeriods" 
              :key="period.value"
              :class="['period-btn', { active: selectedForecastPeriod === period.value }]"
              @click="changeForecastPeriod(period.value)"
            >
              {{ period.label }}
            </button>
          </div>
          <div v-if="selectedForecastPeriod === 'quarterly'" class="quarter-selector">
            <button 
              v-for="quarter in quarters" 
              :key="quarter.value"
              :class="['quarter-btn', { active: selectedQuarter === quarter.value }]"
              @click="selectQuarter(quarter.value)"
            >
              {{ quarter.label }}
            </button>
          </div>
        </div>
        <div class="table-container">
          <div v-if="forecastLoading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            Generating forecasts...
          </div>
          <table v-else-if="forecasts && Object.keys(forecasts).length > 0">
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Sales</th>
                <th>Forecasted Sales</th>
                <th>Trend</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(forecast, productId) in forecasts" :key="productId">
                <td>
                  <div class="product-info">
                    <img 
                      :src="forecast.image || '/img/placeholder.jpg'" 
                      :alt="forecast.name"
                      class="product-thumbnail"
                      @error="handleImageError"
                    >
                    <div class="product-details">
                      <span class="product-name">{{ forecast.name }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ forecast.current_sales }}</td>
                <td>
                  {{ Math.round(getForecastedSales(forecast.forecast_data)) }}
                  <span class="forecast-range">
                    ({{ Math.round(getForecastLowerBound(forecast.forecast_data)) }} - 
                    {{ Math.round(getForecastUpperBound(forecast.forecast_data)) }})
                  </span>
                </td>
                <td>
                  <div class="trend-indicator" :class="getTrendClass(forecast.forecast_data)">
                    <i :class="getTrendIcon(forecast.forecast_data)"></i>
                    {{ getTrendLabel(forecast.forecast_data) }}
                  </div>
                </td>
                <td>
                  <div class="confidence-meter">
                    <div class="confidence-bar" 
                        :style="{ width: getConfidenceWidth(forecast.forecast_data) }"
                        :class="getConfidenceClass(forecast.forecast_data)">
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        <div v-else class="no-data">
          <i class="fas fa-exclamation-circle"></i>
          <p>{{ forecastError || 'No sales data available for forecasting' }}</p>
          <p class="help-text">To enable forecasting, you need:</p>
          <ul>
            <li>At least 7 days of sales data</li>
            <li>Orders marked as 'paid'</li>
            <li>Sales within the last 30 days</li>
            <li>Products with consistent sales history</li>
          </ul>
          <p class="suggestion-text">
            Try creating some test orders or wait until more sales data is available.
          </p>
          <button @click="retryForecast" class="retry-btn">
            <i class="fas fa-sync"></i>
            Retry Forecast
          </button>
        </div>
      </div>
    </div>
    

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
          <table v-if="filteredLowStock.length">
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
          <table v-if="filteredLowStock.length">
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
      <div v-if="showSaveConfirmation" class="modal-overlay">
        <div class="modal-content save-confirmation-modal">
          <h2>Confirm Stock Update</h2>
          <p>
            Are you sure you want to update the stock of 
            <span class="highlighted-text">
              {{ itemToUpdate?.type === 'choice' ? 
                `${itemToUpdate.product_name} (${itemToUpdate.choice_name})` : 
                itemToUpdate?.name }}
            </span> 
            to <span class="highlighted-text">{{ editingStock }}</span>?
          </p>
          <div class="modal-buttons">
            <button @click="confirmSave" class="confirm-btn">
              <i class="fas fa-check"></i> Yes, Update Stock
            </button>
            <button @click="cancelSaveConfirmation" class="cancel-btn">
              <i class="fas fa-times"></i> Cancel
            </button>
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
      editingId: null,
      editingStock: null,
      stockInput: null, 
      showSaveConfirmation: false,
      itemToUpdate: null,
      forecastLoading: false,
      forecastError: null,
      forecasts: null,
      selectedForecastPeriod: 'weekly',
      selectedQuarter: 'Q1',
      forecastPeriods: [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Annually', value: 'annually' }
      ],
      quarters: [
        { label: 'Q1 (Jan-Mar)', value: 'Q1' },
        { label: 'Q2 (Apr-Jun)', value: 'Q2' },
        { label: 'Q3 (Jul-Sep)', value: 'Q3' },
        { label: 'Q4 (Oct-Dec)', value: 'Q4' }
      ],
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
        lowStock: [],
        topProducts: [],
        topStaff: []
      }
    }
  },
    computed: {
      filteredLowStock() {
          if (!this.stats.lowStock) return [];
          
          return this.stats.lowStock.filter(item => {
              // Keep product choices
              if (item.type === 'choice') return true;
              
              // For main products, only keep those without choices
              return !item.has_choices; // Assuming your backend sends this flag
          });
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
    async changeForecastPeriod(period) {
      this.selectedForecastPeriod = period;
      await this.fetchForecasts();
    },

    async selectQuarter(quarter) {
      this.selectedQuarter = quarter;
      await this.fetchForecasts();
    },

    getForecastPeriodLabel() {
      switch (this.selectedForecastPeriod) {
        case 'weekly':
          return 'Next 7 Days';
        case 'monthly':
          return 'Next 30 Days';
        case 'quarterly':
          const quarterMap = {
            Q1: 'January-March',
            Q2: 'April-June',
            Q3: 'July-September',
            Q4: 'October-December'
          };
          return quarterMap[this.selectedQuarter];
        case 'annually':
          return 'Next 12 Months';
        default:
          return 'Next 7 Days';
      }
    },
    getConfidenceWidth(forecastData) {
        try {
            if (!forecastData?.forecast) return '0%';
            const forecast = forecastData.forecast;
            
            // Calculate average confidence interval width
            const avgInterval = forecast.reduce((sum, day) => {
                return sum + (day.yhat_upper - day.yhat_lower) / day.yhat;
            }, 0) / forecast.length;
            
            // Convert to confidence percentage (inverse of interval width)
            const confidence = Math.max(0, Math.min(100, (1 - avgInterval) * 100));
            return `${confidence}%`;
        } catch (error) {
            console.error('Error calculating confidence width:', error);
            return '0%';
        }
    },

    getConfidenceClass(forecastData) {
        try {
            if (!forecastData?.forecast) return 'low';
            const forecast = forecastData.forecast;
            
            // Calculate average confidence interval width
            const avgInterval = forecast.reduce((sum, day) => {
                return sum + (day.yhat_upper - day.yhat_lower) / day.yhat;
            }, 0) / forecast.length;
            
            // Classify confidence based on interval width
            if (avgInterval < 0.2) return 'high';
            if (avgInterval < 0.4) return 'medium';
            return 'low';
        } catch (error) {
            console.error('Error calculating confidence class:', error);
            return 'low';
        }
    },

    getConfidenceLabel(forecastData) {
        const confidenceClass = this.getConfidenceClass(forecastData);
        switch (confidenceClass) {
            case 'high':
                return 'High Confidence';
            case 'medium':
                return 'Medium Confidence';
            case 'low':
                return 'Low Confidence';
            default:
                return 'Unknown';
        }
    },
    async retryForecast() {
      await this.fetchForecasts();
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
    async fetchForecasts() {
      this.forecastLoading = true;
      this.forecastError = null;
      
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          period: this.selectedForecastPeriod,
          quarter: this.selectedQuarter
        });
        
        const response = await fetch(`http://localhost:7904/api/admin/forecasts?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        this.forecasts = data;
        
        // Log success for debugging
        console.log('Forecasts loaded:', this.forecasts);
        
      } catch (error) {
        console.error('Error fetching forecasts:', error);
        this.forecastError = 'Failed to generate forecasts. Please try again later.';
        this.forecasts = null;
      } finally {
        this.forecastLoading = false;
      }
    },

    getForecastedSales(forecastData) {
      try {
        if (!forecastData?.forecast) return 0;
        return forecastData.forecast.reduce((sum, day) => sum + day.yhat, 0);
      } catch (error) {
        console.error('Error calculating forecasted sales:', error);
        return 0;
      }
    },

    getForecastLowerBound(forecastData) {
      try {
        if (!forecastData?.forecast) return 0;
        return forecastData.forecast.reduce((sum, day) => sum + day.yhat_lower, 0);
      } catch (error) {
        console.error('Error calculating lower bound:', error);
        return 0;
      }
    },

    getForecastUpperBound(forecastData) {
      try {
        if (!forecastData?.forecast) return 0;
        return forecastData.forecast.reduce((sum, day) => sum + day.yhat_upper, 0);
      } catch (error) {
        console.error('Error calculating upper bound:', error);
        return 0;
      }
    },

    getTrendClass(forecastData) {
      const trend = this.calculateTrend(forecastData);
      if (trend > 10) return 'strong-upward';
      if (trend > 0) return 'upward';
      if (trend < -10) return 'strong-downward';
      if (trend < 0) return 'downward';
      return 'stable';
    },

    getTrendIcon(forecastData) {
      const trend = this.calculateTrend(forecastData);
      if (trend > 10) return 'fas fa-angle-double-up';
      if (trend > 0) return 'fas fa-angle-up';
      if (trend < -10) return 'fas fa-angle-double-down';
      if (trend < 0) return 'fas fa-angle-down';
      return 'fas fa-equals';
    },

    getTrendLabel(forecastData) {
      const trend = this.calculateTrend(forecastData);
      if (trend > 10) return 'Strong Growth';
      if (trend > 0) return 'Growing';
      if (trend < -10) return 'Declining';
      if (trend < 0) return 'Slight Decline';
      return 'Stable';
    },

    calculateTrend(forecastData) {
      try {
        if (!forecastData?.forecast) return 0;
        const forecast = forecastData.forecast;
        const firstWeek = forecast.slice(0, 7);
        const lastWeek = forecast.slice(-7);
        
        const firstWeekAvg = firstWeek.reduce((sum, day) => sum + day.yhat, 0) / 7;
        const lastWeekAvg = lastWeek.reduce((sum, day) => sum + day.yhat, 0) / 7;
        
        return ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;
      } catch (error) {
        console.error('Error calculating trend:', error);
        return 0;
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
      const weeklyOrders = product.weekly_orders || 0;
      if (weeklyOrders >= 10) return 'High Demand';
      if (weeklyOrders >= 5) return 'Good Performance';
      if (weeklyOrders >= 1) return 'Steady Sales';
      return 'Low Movement';
    },

    handleImageError(e) {
      e.target.src = '/img/placeholder.jpg';
    },
    saveStock(item) {
      this.itemToUpdate = item;
      this.showSaveConfirmation = true;
    },
    cancelSaveConfirmation() {
      this.showSaveConfirmation = false;
      this.itemToUpdate = null;
    },
    async confirmSave() {
      try {
        if (!this.itemToUpdate || this.editingStock === null || this.editingStock === undefined) {
          console.error('Invalid stock quantity or item');
          return;
        }

        const token = localStorage.getItem('token');
        let endpoint, payload;
        
        if (this.itemToUpdate.type === 'choice') {
          // Update choice stock - maintain existing price
          endpoint = `http://localhost:7904/api/products/choices/${this.itemToUpdate.choice_id}`;
          payload = { 
            stock: parseInt(this.editingStock),
            price: this.itemToUpdate.price,
            name: this.itemToUpdate.choice_name
          };
        } else {
          // Update regular product stock - maintain existing price
          endpoint = `http://localhost:7904/api/products/${this.itemToUpdate.id}`;
          payload = { 
            stock_quantity: parseInt(this.editingStock),
            price: this.itemToUpdate.price,
            name: this.itemToUpdate.name,
            description: this.itemToUpdate.description,
            category: this.itemToUpdate.category
          };
        }

        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          // Update only the stock in the local data
          this.itemToUpdate.stock = parseInt(this.editingStock);
          this.editingId = null;
          this.editingStock = null;
          // Refresh dashboard stats
          await this.fetchDashboardStats();
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update stock');
        }
      } catch (error) {
        console.error('Error updating stock:', error);
      } finally {
        this.showSaveConfirmation = false;
        this.itemToUpdate = null;
      }
    },
    
    getStockStatusClass(stock) {
      if (stock <= 10) return 'critical-stock';
      if (stock <= 20) return 'low-stock';
      return 'normal-stock';
    },
    startEdit(item) {
      this.editingId = item.type === 'choice' ? `choice-${item.choice_id}` : item.id;
      this.editingStock = item.stock;
      this.$nextTick(() => {
        if (this.stockInput) {
          this.stockInput.focus();
        }
      });
    },

    cancelEdit() {
      this.editingId = null;
      this.editingStock = null;
    },


    formatPrice(price) {
      const num = Number(price);
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
      }
      return num.toFixed(2);
    },

    getPerformanceLabel(ordersHandled) {
      if (ordersHandled >= 50) return 'Outstanding';
      if (ordersHandled >= 30) return 'Excellent';
      if (ordersHandled >= 20) return 'Great';
      if (ordersHandled >= 10) return 'Good';
      return 'New';
    },

    async fetchDashboardStats() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/dashboard-stats', {
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
      await Promise.all([
        this.fetchDashboardStats(),
        this.fetchForecasts() // Add this line
      ]);
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

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-weight: 600;
    color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 0.95rem;
}

.modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

.save-btn, .cancel-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    border: none;
}

.save-btn {
    background-color: #10b981;
    color: white;
}

.cancel-btn {
    background-color: #ef4444;
    color: white;
}

.save-btn:hover {
    background-color: #059669;
}

.cancel-btn:hover {
    background-color: #dc2626;
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
  
  .stock-badge {
    display: inline-block;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
    min-width: 60px;
  }
  
  /* Stock status styles - keep the same */
  .critical-stock {
    color: #dc2626; /* Dark red text */
    background-color: #fee2e2; /* Light red background */
  }
  
  .low-stock {
    color: #854d0e; /* Dark yellow/amber text */
    background-color: #fef3c7; /* Light yellow background */
  }
  
  .normal-stock {
    color: #475569; /* Slate gray text */
    background-color: #f1f5f9; /* Light gray background */
  }
  
  
  .edit-btn {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  
  .edit-btn:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
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
}.no-data ul {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  text-align: left;
  display: inline-block;
}

.no-data li {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.no-data li:before {
  content: "•";
  position: absolute;
  left: 0;
  color: #3b82f6;
}
.retry-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.retry-btn:hover {
  background-color: #2563eb;
}
.stock-input {
  width: 80px;
  padding: 0.5rem;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

.stock-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.save-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.save-btn:hover {
  background-color: #059669;
  transform: translateY(-1px);
}
.choice-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background-color: #e0f2fe;
    color: #0369a1;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    margin-left: 0.5rem;
    vertical-align: middle;
    font-weight: 500;
}
.low-stock-table {
  max-height: 405px; /* Enough height for approximately 5 rows + header */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

/* Custom scrollbar for Webkit browsers (Chrome, Safari) */
.low-stock-table::-webkit-scrollbar {
  width: 8px;
}

.low-stock-table::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 8px;
}

.low-stock-table::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 8px;
  border: 2px solid #f8fafc;
}

.low-stock-table::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

/* Keep fixed header in the table */
.low-stock-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: #f8fafc;
}

/* Improve border appearance with scrollbar */
.low-stock-table table {
  border-spacing: 0;
}

.low-stock-table th {
  box-shadow: 0 1px 0 #e2e8f0; /* Replace border-bottom with shadow for sticky header */
}
.choice-badge i {
    font-size: 0.7rem;
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
  /* Responsive Design */
  @media (max-width: 768px) {\.period-selector,
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
  
    .modal-content {
      padding: 2rem;
      margin: 1rem;
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
  @media (max-width: 1200px) {
  .dashboard-cards {
    grid-template-columns: repeat(3, 1fr);
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
  .save-confirmation-modal {
  max-width: 400px;
  text-align: center;
}

.save-confirmation-modal h2 {
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.save-confirmation-modal p {
  margin-bottom: 1.75rem;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
}

.highlighted-text {
  font-weight: 600;
  color: #3b82f6;
}

.confirm-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  background-color: #059669;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}
.forecast-range {
  font-size: 0.8rem;
  color: #64748b;
  margin-left: 0.5rem;
}

.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.trend-indicator.strong-upward {
  background-color: #dcfce7;
  color: #15803d;
}

.trend-indicator.upward {
  background-color: #f0fdf4;
  color: #166534;
}

.trend-indicator.stable {
  background-color: #f1f5f9;
  color: #475569;
}

.trend-indicator.downward {
  background-color: #fff1f2;
  color: #be123c;
}

.trend-indicator.strong-downward {
  background-color: #fecdd3;
  color: #be123c;
}

.confidence-meter {
  width: 100%;
  height: 8px;
  background-color: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.confidence-bar.high {
  background-color: #22c55e;
}

.confidence-bar.medium {
  background-color: #eab308;
}

.confidence-bar.low {
  background-color: #ef4444;
}
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
  gap: 1rem;
  font-size: 1.1rem;
}

.loading-state i {
  color: #3b82f6;
  font-size: 1.5rem;
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
</style>