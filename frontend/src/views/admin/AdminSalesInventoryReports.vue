<template>
  <div class="admin-container">
    <AdminNavbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="admin-content">
      <h1><i class="fas fa-chart-bar"></i> Sales & Inventory Reports</h1>

      <div class="reports-controls">
        <!-- Report Type Tabs -->
        <div class="report-tabs">
          <button 
            @click="activeTab = 'sales'" 
            :class="['tab-btn', activeTab === 'sales' ? 'active' : '']"
          >
            <i class="fas fa-chart-line"></i> Sales Reports
          </button>
          <button 
            @click="activeTab = 'inventory'" 
            :class="['tab-btn', activeTab === 'inventory' ? 'active' : '']"
          >
            <i class="fas fa-boxes"></i> Inventory Reports
          </button>
          <button 
            @click="activeTab = 'combined'" 
            :class="['tab-btn', activeTab === 'combined' ? 'active' : '']"
          >
            <i class="fas fa-chart-pie"></i> Combined Reports
          </button>
        </div>

        <!-- Filters Section -->
        <div class="filters">
          <div class="date-filters">
            <div class="date-input">
              <label>From Date:</label>
              <input type="date" v-model="filters.fromDate" @change="applyFilters">
            </div>
            <div class="date-input">
              <label>To Date:</label>
              <input type="date" v-model="filters.toDate" @change="applyFilters">
            </div>
          </div>
          
          <div class="filter-group">
            <div class="period-filter">
              <select v-model="filters.period" @change="handlePeriodChange">
                <option value="custom">Custom Range</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
                <option value="thisyear">This Year</option>
              </select>
            </div>

            <div class="category-filter" v-if="activeTab === 'inventory' || activeTab === 'combined'">
              <select v-model="filters.category" @change="applyFilters">
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>

            <button @click="clearFilters" class="clear-btn">
              <i class="fas fa-times"></i> Clear Filters
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button @click="refreshData" class="refresh-btn" :disabled="loading">
            <i class="fas fa-sync-alt" :class="{ 'spinning': loading }"></i>
            Refresh Data
          </button>
          <button @click="downloadExcel" class="download-btn" :disabled="loading || !hasData">
            <i class="fas fa-download"></i>
            Download Excel
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading report data...</p>
      </div>

      <!-- Sales Reports Tab -->
      <div v-else-if="activeTab === 'sales'" class="reports-section">
        <div class="summary-cards">
          <div class="summary-card total-sales">
            <div class="card-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="card-content">
              <h3>Total Sales</h3>
              <p class="amount">₱{{ formatCurrency(salesSummary.totalSales) }}</p>
              <span class="period">{{ getDateRangeText() }}</span>
            </div>
          </div>
          
          <div class="summary-card total-orders">
            <div class="card-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="card-content">
              <h3>Total Orders</h3>
              <p class="count">{{ salesSummary.totalOrders }}</p>
              <span class="period">{{ getDateRangeText() }}</span>
            </div>
          </div>

          <div class="summary-card avg-order">
            <div class="card-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="card-content">
              <h3>Avg. Order Value</h3>
              <p class="amount">₱{{ formatCurrency(salesSummary.avgOrderValue) }}</p>
              <span class="period">{{ getDateRangeText() }}</span>
            </div>
          </div>
        </div>

        <div class="detailed-tables">
          <!-- Sales by Product -->
          <div class="table-section">
            <h3><i class="fas fa-box"></i> Sales by Product</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Avg. Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedSalesByProduct" :key="item.product_id">
                    <td>{{ item.product_name }}</td>
                    <td>{{ item.category }}</td>
                    <td>{{ item.units_sold }}</td>
                    <td>₱{{ formatCurrency(item.revenue) }}</td>
                    <td>₱{{ formatCurrency(item.avg_price) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination for Sales by Product -->
            <div class="pagination-container" v-if="salesData.byProduct.length > pagination.salesByProduct.itemsPerPage">
              <div class="pagination-info">
                Showing {{ getSalesProductStartIndex() }} to {{ getSalesProductEndIndex() }} 
                of {{ salesData.byProduct.length }} entries
              </div>
              <div class="pagination-controls">
                <button 
                  @click="changeSalesProductPage(pagination.salesByProduct.currentPage - 1)"
                  :disabled="pagination.salesByProduct.currentPage === 1"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                
                <button 
                  v-for="page in getSalesProductPageNumbers()"
                  :key="page"
                  @click="changeSalesProductPage(page)"
                  :class="['pagination-btn', 'page-number', { 'active': page === pagination.salesByProduct.currentPage }]"
                >
                  {{ page }}
                </button>
                
                <button 
                  @click="changeSalesProductPage(pagination.salesByProduct.currentPage + 1)"
                  :disabled="pagination.salesByProduct.currentPage === getSalesProductTotalPages()"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Daily Sales -->
          <div class="table-section">
            <h3><i class="fas fa-calendar-day"></i> Daily Sales Breakdown</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th>Avg. Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedDailySales" :key="item.date">
                    <td>{{ formatDate(item.date) }}</td>
                    <td>{{ item.orders }}</td>
                    <td>₱{{ formatCurrency(item.revenue) }}</td>
                    <td>₱{{ formatCurrency(item.avg_order_value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination for Daily Sales -->
            <div class="pagination-container" v-if="salesData.daily.length > pagination.dailySales.itemsPerPage">
              <div class="pagination-info">
                Showing {{ getDailySalesStartIndex() }} to {{ getDailySalesEndIndex() }} 
                of {{ salesData.daily.length }} entries
              </div>
              <div class="pagination-controls">
                <button 
                  @click="changeDailySalesPage(pagination.dailySales.currentPage - 1)"
                  :disabled="pagination.dailySales.currentPage === 1"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                
                <button 
                  v-for="page in getDailySalesPageNumbers()"
                  :key="page"
                  @click="changeDailySalesPage(page)"
                  :class="['pagination-btn', 'page-number', { 'active': page === pagination.dailySales.currentPage }]"
                >
                  {{ page }}
                </button>
                
                <button 
                  @click="changeDailySalesPage(pagination.dailySales.currentPage + 1)"
                  :disabled="pagination.dailySales.currentPage === getDailySalesTotalPages()"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Reports Tab -->
      <div v-else-if="activeTab === 'inventory'" class="reports-section">
        <div class="summary-cards">
          <div class="summary-card total-products">
            <div class="card-icon">
              <i class="fas fa-boxes"></i>
            </div>
            <div class="card-content">
              <h3>Total Products</h3>
              <p class="count">{{ inventorySummary.totalProducts }}</p>
              <span class="period">Active Inventory</span>
            </div>
          </div>

          <div class="summary-card total-value">
            <div class="card-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="card-content">
              <h3>Inventory Value</h3>
              <p class="amount">₱{{ formatCurrency(inventorySummary.totalValue) }}</p>
              <span class="period">Current Stock</span>
            </div>
          </div>

          <div class="summary-card low-stock">
            <div class="card-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="card-content">
              <h3>Low Stock Items</h3>
              <p class="count warning">{{ inventorySummary.lowStockCount }}</p>
              <span class="period">≤30 units</span>
            </div>
          </div>
        </div>

        <div class="detailed-tables">
          <!-- Current Inventory -->
          <div class="table-section">
            <h3><i class="fas fa-warehouse"></i> Current Inventory</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Unit Price</th>
                    <th>Total Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedCurrentInventory" :key="item.product_id">
                    <td>{{ item.product_name }}</td>
                    <td>{{ item.category }}</td>
                    <td :class="getStockClass(item.stock)">{{ item.stock }}</td>
                    <td>₱{{ formatCurrency(item.price) }}</td>
                    <td>₱{{ formatCurrency(item.total_value) }}</td>
                    <td>
                      <span class="status-badge" :class="getStockStatusClass(item.stock)">
                        {{ getStockStatus(item.stock) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination for Current Inventory -->
            <div class="pagination-container" v-if="inventoryData.current.length > pagination.currentInventory.itemsPerPage">
              <div class="pagination-info">
                Showing {{ getCurrentInventoryStartIndex() }} to {{ getCurrentInventoryEndIndex() }} 
                of {{ inventoryData.current.length }} entries
              </div>
              <div class="pagination-controls">
                <button 
                  @click="changeCurrentInventoryPage(pagination.currentInventory.currentPage - 1)"
                  :disabled="pagination.currentInventory.currentPage === 1"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                
                <button 
                  v-for="page in getCurrentInventoryPageNumbers()"
                  :key="page"
                  @click="changeCurrentInventoryPage(page)"
                  :class="['pagination-btn', 'page-number', { 'active': page === pagination.currentInventory.currentPage }]"
                >
                  {{ page }}
                </button>
                
                <button 
                  @click="changeCurrentInventoryPage(pagination.currentInventory.currentPage + 1)"
                  :disabled="pagination.currentInventory.currentPage === getCurrentInventoryTotalPages()"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Stock Movement -->
          <div class="table-section">
            <h3><i class="fas fa-exchange-alt"></i> Stock Movement</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Opening Stock</th>
                    <th>Units Sold</th>
                    <th>Current Stock</th>
                    <th>Turnover Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedStockMovement" :key="item.product_id">
                    <td>{{ item.product_name }}</td>
                    <td>{{ item.opening_stock }}</td>
                    <td>{{ item.units_sold }}</td>
                    <td>{{ item.current_stock }}</td>
                    <td>{{ item.turnover_rate }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination for Stock Movement -->
            <div class="pagination-container" v-if="inventoryData.movement.length > pagination.stockMovement.itemsPerPage">
              <div class="pagination-info">
                Showing {{ getStockMovementStartIndex() }} to {{ getStockMovementEndIndex() }} 
                of {{ inventoryData.movement.length }} entries
              </div>
              <div class="pagination-controls">
                <button 
                  @click="changeStockMovementPage(pagination.stockMovement.currentPage - 1)"
                  :disabled="pagination.stockMovement.currentPage === 1"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                
                <button 
                  v-for="page in getStockMovementPageNumbers()"
                  :key="page"
                  @click="changeStockMovementPage(page)"
                  :class="['pagination-btn', 'page-number', { 'active': page === pagination.stockMovement.currentPage }]"
                >
                  {{ page }}
                </button>
                
                <button 
                  @click="changeStockMovementPage(pagination.stockMovement.currentPage + 1)"
                  :disabled="pagination.stockMovement.currentPage === getStockMovementTotalPages()"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Combined Reports Tab -->
      <div v-else-if="activeTab === 'combined'" class="reports-section">
        <div class="summary-cards">
          <div class="summary-card revenue-per-item">
            <div class="card-icon">
              <i class="fas fa-chart-pie"></i>
            </div>
            <div class="card-content">
              <h3>Revenue per Item</h3>
              <p class="amount">₱{{ formatCurrency(combinedSummary.revenuePerItem) }}</p>
              <span class="period">Average</span>
            </div>
          </div>

          <div class="summary-card inventory-turnover">
            <div class="card-icon">
              <i class="fas fa-sync-alt"></i>
            </div>
            <div class="card-content">
              <h3>Inventory Turnover</h3>
              <p class="count">{{ combinedSummary.inventoryTurnover }}x</p>
              <span class="period">{{ getDateRangeText() }}</span>
            </div>
          </div>

          <div class="summary-card profit-margin">
            <div class="card-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="card-content">
              <h3>Avg. Profit Margin</h3>
              <p class="count">{{ combinedSummary.profitMargin }}%</p>
              <span class="period">Estimated</span>
            </div>
          </div>
        </div>

        <div class="detailed-tables">
          <!-- Performance Analysis -->
          <div class="table-section">
            <h3><i class="fas fa-analytics"></i> Product Performance Analysis</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Current Stock</th>
                    <th>Stock Value</th>
                    <th>Turnover</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedPerformanceAnalysis" :key="item.product_id">
                    <td>{{ item.product_name }}</td>
                    <td>{{ item.units_sold }}</td>
                    <td>₱{{ formatCurrency(item.revenue) }}</td>
                    <td>{{ item.current_stock }}</td>
                    <td>₱{{ formatCurrency(item.stock_value) }}</td>
                    <td>{{ item.turnover_rate }}%</td>
                    <td>
                      <span class="performance-badge" :class="getPerformanceClass(item.performance_score)">
                        {{ getPerformanceText(item.performance_score) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination for Performance Analysis -->
            <div class="pagination-container" v-if="combinedData.performance.length > pagination.performanceAnalysis.itemsPerPage">
              <div class="pagination-info">
                Showing {{ getPerformanceAnalysisStartIndex() }} to {{ getPerformanceAnalysisEndIndex() }} 
                of {{ combinedData.performance.length }} entries
              </div>
              <div class="pagination-controls">
                <button 
                  @click="changePerformanceAnalysisPage(pagination.performanceAnalysis.currentPage - 1)"
                  :disabled="pagination.performanceAnalysis.currentPage === 1"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                
                <button 
                  v-for="page in getPerformanceAnalysisPageNumbers()"
                  :key="page"
                  @click="changePerformanceAnalysisPage(page)"
                  :class="['pagination-btn', 'page-number', { 'active': page === pagination.performanceAnalysis.currentPage }]"
                >
                  {{ page }}
                </button>
                
                <button 
                  @click="changePerformanceAnalysisPage(pagination.performanceAnalysis.currentPage + 1)"
                  :disabled="pagination.performanceAnalysis.currentPage === getPerformanceAnalysisTotalPages()"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!loading && !hasData" class="no-data">
        <i class="fas fa-chart-line"></i>
        <h3>No Data Available</h3>
        <p>No data found for the selected filters and date range.</p>
        <button @click="clearFilters" class="clear-filters-btn">
          <i class="fas fa-refresh"></i> Clear Filters
        </button>
      </div>
    </div>

    <!-- Success Notification -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <i :class="notification.icon"></i>
        {{ notification.message }}
      </div>
      <button class="notification-close" @click="hideNotification">
        <i class="fas fa-times"></i>
      </button>
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
  name: 'AdminSalesInventoryReports',
  components: {
    AdminNavbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      activeTab: 'sales',
      loading: false,
      
      filters: {
        fromDate: '',
        toDate: '',
        period: 'last30days',
        category: ''
      },
      
      categories: [],
      
      // Pagination settings
      pagination: {
        salesByProduct: {
          currentPage: 1,
          itemsPerPage: 10
        },
        dailySales: {
          currentPage: 1,
          itemsPerPage: 15
        },
        currentInventory: {
          currentPage: 1,
          itemsPerPage: 10
        },
        stockMovement: {
          currentPage: 1,
          itemsPerPage: 10
        },
        performanceAnalysis: {
          currentPage: 1,
          itemsPerPage: 10
        }
      },
      
      salesSummary: {
        totalSales: 0,
        totalOrders: 0,
        avgOrderValue: 0
      },
      
      inventorySummary: {
        totalProducts: 0,
        totalValue: 0,
        lowStockCount: 0
      },
      
      combinedSummary: {
        revenuePerItem: 0,
        inventoryTurnover: 0,
        profitMargin: 0
      },
      
      salesData: {
        byProduct: [],
        daily: []
      },
      
      inventoryData: {
        current: [],
        movement: []
      },
      
      combinedData: {
        performance: []
      },
      
      notification: {
        show: false,
        message: '',
        type: 'success',
        icon: 'fas fa-check-circle'
      }
    }
  },
  
  computed: {
    hasData() {
      if (this.activeTab === 'sales') {
        return this.salesData.byProduct.length > 0 || this.salesData.daily.length > 0;
      } else if (this.activeTab === 'inventory') {
        return this.inventoryData.current.length > 0;
      } else {
        return this.combinedData.performance.length > 0;
      }
    },
    
    // Paginated data for Sales by Product
    paginatedSalesByProduct() {
      const start = (this.pagination.salesByProduct.currentPage - 1) * this.pagination.salesByProduct.itemsPerPage;
      const end = start + this.pagination.salesByProduct.itemsPerPage;
      return this.salesData.byProduct.slice(start, end);
    },
    
    // Paginated data for Daily Sales
    paginatedDailySales() {
      const start = (this.pagination.dailySales.currentPage - 1) * this.pagination.dailySales.itemsPerPage;
      const end = start + this.pagination.dailySales.itemsPerPage;
      return this.salesData.daily.slice(start, end);
    },
    
    // Paginated data for Current Inventory
    paginatedCurrentInventory() {
      const start = (this.pagination.currentInventory.currentPage - 1) * this.pagination.currentInventory.itemsPerPage;
      const end = start + this.pagination.currentInventory.itemsPerPage;
      return this.inventoryData.current.slice(start, end);
    },
    
    // Paginated data for Stock Movement
    paginatedStockMovement() {
      const start = (this.pagination.stockMovement.currentPage - 1) * this.pagination.stockMovement.itemsPerPage;
      const end = start + this.pagination.stockMovement.itemsPerPage;
      return this.inventoryData.movement.slice(start, end);
    },
    
    // Paginated data for Performance Analysis
    paginatedPerformanceAnalysis() {
      const start = (this.pagination.performanceAnalysis.currentPage - 1) * this.pagination.performanceAnalysis.itemsPerPage;
      const end = start + this.pagination.performanceAnalysis.itemsPerPage;
      return this.combinedData.performance.slice(start, end);
    }
  },
  
  methods: {
    async fetchReportData() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          fromDate: this.filters.fromDate,
          toDate: this.filters.toDate,
          category: this.filters.category,
          type: this.activeTab
        });
        
        const response = await fetch(`http://localhost:7904/api/admin/detailed-reports?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (this.activeTab === 'sales') {
            this.salesSummary = data.summary;
            this.salesData = data.details;
            // Reset pagination when new data is loaded
            this.pagination.salesByProduct.currentPage = 1;
            this.pagination.dailySales.currentPage = 1;
          } else if (this.activeTab === 'inventory') {
            this.inventorySummary = data.summary;
            this.inventoryData = data.details;
            // Reset pagination when new data is loaded
            this.pagination.currentInventory.currentPage = 1;
            this.pagination.stockMovement.currentPage = 1;
          } else {
            this.combinedSummary = data.summary;
            this.combinedData = data.details;
            // Reset pagination when new data is loaded
            this.pagination.performanceAnalysis.currentPage = 1;
          }
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
        this.showNotification('Error loading report data', 'error', 'fas fa-times-circle');
      } finally {
        this.loading = false;
      }
    },
    
    // Pagination methods for Sales by Product
    changeSalesProductPage(page) {
      if (page >= 1 && page <= this.getSalesProductTotalPages()) {
        this.pagination.salesByProduct.currentPage = page;
      }
    },
    
    getSalesProductTotalPages() {
      return Math.ceil(this.salesData.byProduct.length / this.pagination.salesByProduct.itemsPerPage);
    },
    
    getSalesProductStartIndex() {
      return (this.pagination.salesByProduct.currentPage - 1) * this.pagination.salesByProduct.itemsPerPage + 1;
    },
    
    getSalesProductEndIndex() {
      const end = this.pagination.salesByProduct.currentPage * this.pagination.salesByProduct.itemsPerPage;
      return Math.min(end, this.salesData.byProduct.length);
    },
    
    getSalesProductPageNumbers() {
      const totalPages = this.getSalesProductTotalPages();
      const currentPage = this.pagination.salesByProduct.currentPage;
      const maxVisiblePages = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      const pages = [];
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    },
    
    // Pagination methods for Daily Sales
    changeDailySalesPage(page) {
      if (page >= 1 && page <= this.getDailySalesTotalPages()) {
        this.pagination.dailySales.currentPage = page;
      }
    },
    
    getDailySalesTotalPages() {
      return Math.ceil(this.salesData.daily.length / this.pagination.dailySales.itemsPerPage);
    },
    
    getDailySalesStartIndex() {
      return (this.pagination.dailySales.currentPage - 1) * this.pagination.dailySales.itemsPerPage + 1;
    },
    
    getDailySalesEndIndex() {
      const end = this.pagination.dailySales.currentPage * this.pagination.dailySales.itemsPerPage;
      return Math.min(end, this.salesData.daily.length);
    },
    
    getDailySalesPageNumbers() {
      const totalPages = this.getDailySalesTotalPages();
      const currentPage = this.pagination.dailySales.currentPage;
      const maxVisiblePages = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      const pages = [];
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    },
    
    // Pagination methods for Current Inventory
    changeCurrentInventoryPage(page) {
      if (page >= 1 && page <= this.getCurrentInventoryTotalPages()) {
        this.pagination.currentInventory.currentPage = page;
      }
    },
    
    getCurrentInventoryTotalPages() {
      return Math.ceil(this.inventoryData.current.length / this.pagination.currentInventory.itemsPerPage);
    },
    
    getCurrentInventoryStartIndex() {
      return (this.pagination.currentInventory.currentPage - 1) * this.pagination.currentInventory.itemsPerPage + 1;
    },
    
    getCurrentInventoryEndIndex() {
      const end = this.pagination.currentInventory.currentPage * this.pagination.currentInventory.itemsPerPage;
      return Math.min(end, this.inventoryData.current.length);
    },
    
    getCurrentInventoryPageNumbers() {
      const totalPages = this.getCurrentInventoryTotalPages();
      const currentPage = this.pagination.currentInventory.currentPage;
      const maxVisiblePages = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      const pages = [];
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    },
    
    // Pagination methods for Stock Movement
    changeStockMovementPage(page) {
      if (page >= 1 && page <= this.getStockMovementTotalPages()) {
        this.pagination.stockMovement.currentPage = page;
      }
    },
    
    getStockMovementTotalPages() {
      return Math.ceil(this.inventoryData.movement.length / this.pagination.stockMovement.itemsPerPage);
    },
    
    getStockMovementStartIndex() {
      return (this.pagination.stockMovement.currentPage - 1) * this.pagination.stockMovement.itemsPerPage + 1;
    },
    
    getStockMovementEndIndex() {
      const end = this.pagination.stockMovement.currentPage * this.pagination.stockMovement.itemsPerPage;
      return Math.min(end, this.inventoryData.movement.length);
    },
    
    getStockMovementPageNumbers() {
      const totalPages = this.getStockMovementTotalPages();
      const currentPage = this.pagination.stockMovement.currentPage;
      const maxVisiblePages = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      const pages = [];
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    },
    
    // Pagination methods for Performance Analysis
    changePerformanceAnalysisPage(page) {
      if (page >= 1 && page <= this.getPerformanceAnalysisTotalPages()) {
        this.pagination.performanceAnalysis.currentPage = page;
      }
    },
    
    getPerformanceAnalysisTotalPages() {
      return Math.ceil(this.combinedData.performance.length / this.pagination.performanceAnalysis.itemsPerPage);
    },
    
    getPerformanceAnalysisStartIndex() {
      return (this.pagination.performanceAnalysis.currentPage - 1) * this.pagination.performanceAnalysis.itemsPerPage + 1;
    },
    
    getPerformanceAnalysisEndIndex() {
      const end = this.pagination.performanceAnalysis.currentPage * this.pagination.performanceAnalysis.itemsPerPage;
      return Math.min(end, this.combinedData.performance.length);
    },
    
    getPerformanceAnalysisPageNumbers() {
      const totalPages = this.getPerformanceAnalysisTotalPages();
      const currentPage = this.pagination.performanceAnalysis.currentPage;
      const maxVisiblePages = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      const pages = [];
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    },
    
    async fetchCategories() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/admin/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          this.categories = await response.json();
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    },
    
    handlePeriodChange() {
      const today = new Date();
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      switch (this.filters.period) {
        case 'today':
          this.filters.fromDate = formatDate(today);
          this.filters.toDate = formatDate(today);
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          this.filters.fromDate = formatDate(yesterday);
          this.filters.toDate = formatDate(yesterday);
          break;
        case 'last7days':
          const week = new Date(today);
          week.setDate(today.getDate() - 7);
          this.filters.fromDate = formatDate(week);
          this.filters.toDate = formatDate(today);
          break;
        case 'last30days':
          const month = new Date(today);
          month.setDate(today.getDate() - 30);
          this.filters.fromDate = formatDate(month);
          this.filters.toDate = formatDate(today);
          break;
        case 'thismonth':
          this.filters.fromDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
          this.filters.toDate = formatDate(today);
          break;
        case 'lastmonth':
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
          this.filters.fromDate = formatDate(lastMonth);
          this.filters.toDate = formatDate(lastMonthEnd);
          break;
        case 'thisyear':
          this.filters.fromDate = formatDate(new Date(today.getFullYear(), 0, 1));
          this.filters.toDate = formatDate(today);
          break;
      }
      
      if (this.filters.period !== 'custom') {
        this.applyFilters();
      }
    },
    
    applyFilters() {
      this.fetchReportData();
    },
    
    clearFilters() {
      this.filters = {
        fromDate: '',
        toDate: '',
        period: 'last30days',
        category: ''
      };
      this.handlePeriodChange();
    },
    
    refreshData() {
      this.fetchReportData();
    },
    
    async downloadExcel() {
      if (!this.hasData) {
        this.showNotification('No data available to download', 'warning', 'fas fa-exclamation-triangle');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          fromDate: this.filters.fromDate,
          toDate: this.filters.toDate,
          category: this.filters.category,
          type: this.activeTab
        });
        
        const response = await fetch(`http://localhost:7904/api/admin/download-reports?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          const filename = `${this.activeTab}_report_${this.filters.fromDate}_to_${this.filters.toDate}.xlsx`;
          link.download = filename;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.showNotification('Report downloaded successfully', 'success', 'fas fa-download');
        } else {
          throw new Error('Download failed');
        }
      } catch (error) {
        console.error('Error downloading report:', error);
        this.showNotification('Error downloading report', 'error', 'fas fa-times-circle');
      }
    },
    
    // Helper methods
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0);
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    getDateRangeText() {
      if (this.filters.fromDate && this.filters.toDate) {
        return `${this.formatDate(this.filters.fromDate)} - ${this.formatDate(this.filters.toDate)}`;
      }
      return 'Selected Period';
    },
    
    getStockClass(stock) {
      if (stock <= 10) return 'stock-critical';
      if (stock <= 30) return 'stock-low';
      return 'stock-normal';
    },
    
    getStockStatus(stock) {
      if (stock <= 10) return 'Critical';
      if (stock <= 30) return 'Low';
      return 'Normal';
    },
    
    getStockStatusClass(stock) {
      if (stock <= 10) return 'critical';
      if (stock <= 30) return 'low';
      return 'normal';
    },
    
    getPerformanceClass(score) {
      if (score >= 80) return 'excellent';
      if (score >= 60) return 'good';
      if (score >= 40) return 'average';
      return 'poor';
    },
    
    getPerformanceText(score) {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Good';
      if (score >= 40) return 'Average';
      return 'Poor';
    },
    
    showNotification(message, type = 'success', icon = 'fas fa-check-circle') {
      this.notification = { show: true, message, type, icon };
      setTimeout(() => {
        this.hideNotification();
      }, 5000);
    },
    
    hideNotification() {
      this.notification.show = false;
    },
    
    async handleLogout() {
      try {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:7904/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        localStorage.removeItem('token');
        this.$router.push('/login');
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        this.showLogoutModal = false;
      }
    }
  },
  
  watch: {
    activeTab() {
      this.fetchReportData();
    }
  },
  
  async mounted() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username || 'Admin';
      
      await this.fetchCategories();
      this.handlePeriodChange(); // This will set default dates and fetch data
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

h1 {
  color: #1e293b;
  margin-bottom: 2rem;
  font-size: 1.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Reports Controls */
.reports-controls {
  margin-bottom: 2rem;
}

.report-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: #f1f5f9;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-btn:hover {
  background-color: #e2e8f0;
  color: #334155;
}

.tab-btn.active {
  background-color: #3b82f6;
  color: white;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1.5rem;
}

.date-filters {
  display: flex;
  gap: 1rem;
}

.date-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-input label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.date-input input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.period-filter select,
.category-filter select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: white;
}

.clear-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #64748b;
  font-size: 0.875rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-btn:hover {
  background-color: #f1f5f9;
  color: #334155;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.refresh-btn,
.download-btn {
  padding: 0.75rem 1.25rem;
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

.refresh-btn {
  background-color: #f1f5f9;
  color: #64748b;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #e2e8f0;
  color: #334155;
}

.download-btn {
  background-color: #059669;
  color: white;
}

.download-btn:hover:not(:disabled) {
  background-color: #047857;
}

.refresh-btn:disabled,
.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #64748b;
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.total-sales .card-icon {
  background-color: #059669;
}

.total-orders .card-icon {
  background-color: #3b82f6;
}

.avg-order .card-icon {
  background-color: #8b5cf6;
}

.total-products .card-icon {
  background-color: #f59e0b;
}

.total-value .card-icon {
  background-color: #10b981;
}

.low-stock .card-icon {
  background-color: #ef4444;
}

.revenue-per-item .card-icon {
  background-color: #6366f1;
}

.inventory-turnover .card-icon {
  background-color: #14b8a6;
}

.profit-margin .card-icon {
  background-color: #f97316;
}

.card-content h3 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-content .amount,
.card-content .count {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.card-content .count.warning {
  color: #ef4444;
}

.card-content .period {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Tables */
.detailed-tables {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.table-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-section h3 {
  margin: 0;
  padding: 1.5rem;
  font-size: 1.125rem;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #f8fafc;
  text-align: left;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 1rem;
  border-top: 1px solid #f1f5f9;
  vertical-align: middle;
  font-size: 0.875rem;
  color: #374151;
}

.data-table tr:hover {
  background-color: #f9fafb;
}

/* Pagination Styles */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  background-color: #f8fafc;
}

.pagination-info {
  font-size: 0.875rem;
  color: #64748b;
}

.pagination-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #64748b;
  font-size: 0.875rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f8fafc;
}

.pagination-btn.page-number.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.pagination-btn.page-number.active:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* Stock Status */
.stock-critical {
  color: #dc2626;
  font-weight: 600;
}

.stock-low {
  color: #ea580c;
  font-weight: 600;
}

.stock-normal {
  color: #059669;
}

/* Status Badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.critical {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-badge.low {
  background-color: #fed7aa;
  color: #ea580c;
}

.status-badge.normal {
  background-color: #dcfce7;
  color: #059669;
}

/* Performance Badges */
.performance-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.performance-badge.excellent {
  background-color: #dcfce7;
  color: #059669;
}

.performance-badge.good {
  background-color: #dbeafe;
  color: #2563eb;
}

.performance-badge.average {
  background-color: #fef3c7;
  color: #d97706;
}

.performance-badge.poor {
  background-color: #fee2e2;
  color: #dc2626;
}

/* No Data State */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.no-data i {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.no-data h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: #374151;
}

.no-data p {
  margin: 0 0 1.5rem;
  color: #64748b;
}

.clear-filters-btn {
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-filters-btn:hover {
  background-color: #2563eb;
}

/* Notification */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 300px;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background-color: #dcfce7;
  color: #15803d;
}

.notification.error {
  background-color: #fee2e2;
  color: #b91c1c;
}

.notification.warning {
  background-color: #fef3c7;
  color: #d97706;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  flex: 1;
}

.notification-close {
  background: none;
  border: none;
  color: currentColor;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity 0.2s;
  padding: 0.25rem;
}

.notification-close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
/* Responsive Design */
@media (max-width: 768px) {
  .admin-container {
    padding-left: 0;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-filters {
    flex-direction: column;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>