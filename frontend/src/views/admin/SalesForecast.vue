<template>
  <div class="admin-container">
    <AdminNavbar 
      :username="username"
      @logout="showLogoutModal = true"
    />
    
    <div class="admin-content">
      <div class="forecast-header">
        <h1>📊 Sales Forecasting</h1>
        <p class="description">Predict your future sales with AI. Know what to stock, when to reorder, and how your business is trending.</p>
      </div>
      
      <div class="forecast-actions">
        <div class="forecast-options">
          <label>Forecast period:</label>
          <div class="forecast-period">
            <select v-model="forecastPeriod">
              <option value="weekly">Weekly (7 days)</option>
              <option value="bi-weekly">Bi-weekly (14 days)</option>
              <option value="monthly">Monthly (30 days)</option>
              <option value="quarterly">Quarterly (90 days)</option>
              <option value="semi-annual">Semi-annual (180 days)</option>
            </select>
          </div>

          <div v-if="forecastPeriod === 'quarterly'" class="quarter-selection">
            <label>Select Quarter:</label>
            <select v-model="selectedQuarter">
              <option value="Q1">Quarter 1 (Jan-Mar)</option>
              <option value="Q2">Quarter 2 (Apr-Jun)</option>
              <option value="Q3">Quarter 3 (Jul-Sep)</option>
              <option value="Q4">Quarter 4 (Oct-Dec)</option>
            </select>
          </div>

          <label>Analysis method:</label>
          <div class="forecast-method">
            <button 
              @click="forecastMethod = 'prophet'" 
              :class="['analysis-button', 'active']">
              🤖 AI-Powered Prophet (Recommended)
            </button>
          </div>
        </div>
        
        <button 
          @click="generateForecasts" 
          class="generate-btn"
          :disabled="isGenerating"
        >
          <i class="fas fa-chart-line"></i>
          {{ isGenerating ? 'Analyzing...' : 'Generate Demand Forecast' }}
        </button>
      </div>
      
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
      
      <div v-if="isGenerating" class="loading-container">
        <div class="generating-animation">
          <i class="fas fa-chart-line"></i>
          <div class="dots"><span>.</span><span>.</span><span>.</span></div>
        </div>
        <p>Analyzing historical sales data and seasonal patterns...</p>
        <p class="generating-detail">Calculating optimal inventory levels and identifying demand trends.</p>
      </div>
      
      <div v-if="!isGenerating && forecasts.length" class="forecasts-container">
        <h2>
          📈 Your Sales Forecast
          <span class="forecast-period-badge">{{ getPeriodLabel() }}</span>
          <span class="method-badge">{{ getMethodLabel() }}</span>
        </h2>
        
        <div class="forecast-explanation">
          <div class="explanation-card">
            <i class="fas fa-cubes"></i>
            <div>
              <h3>🎯 AI-Powered Sales Forecasting Made Simple</h3>
              <p>
                Our smart forecasting system uses Facebook's Prophet AI to predict your future sales with high accuracy. Here's what you get:
              </p>
              <ul class="benefits-list">
                <li>📊 <strong>Easy-to-read predictions</strong> - See exactly how many units you'll sell each day</li>
                <li>📈 <strong>Trend insights</strong> - Know if sales are growing, stable, or declining</li>
                <li>📦 <strong>Smart reorder alerts</strong> - Never run out of stock or overstock again</li>
                <li>📅 <strong>Peak day detection</strong> - Identify your busiest days automatically</li>
                <li>✨ <strong>Confidence ranges</strong> - See best and worst case scenarios</li>
              </ul>
              <div class="model-info">
                <i class="fas fa-brain"></i>
                <span v-if="forecasts.length > 0">{{ getTrainingDataInfo() }}</span>
                <span v-else>Powered by Prophet AI - The same technology used by Facebook for billions of forecasts</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="forecast-items">
          <div v-for="(forecast, index) in forecasts" :key="index" class="forecast-card">
            <div class="forecast-card-header">
              <div class="product-info">
                <img 
                  :src="forecast.image || '/img/placeholder.jpg'" 
                  :alt="forecast.name"
                  class="product-thumbnail"
                  @error="handleImageError"
                />
                <h3>{{ forecast.name }}</h3>
              </div>
              <div class="accuracy-badge" :class="getAccuracyClass(forecast)">
                {{ getAccuracyLabel(forecast) }}
              </div>
            </div>
            
            <div class="demand-metrics">
              <div class="metric highlight">
                <span class="metric-label">📊 Average Daily Sales</span>
                <span class="metric-value">{{ calculateAverage(forecast.forecast_data) }} units/day</span>
                <span class="metric-sublabel">Expected daily sales for the forecast period</span>
              </div>
              
              <div class="metric">
                <span class="metric-label">📈 Sales Trend</span>
                <div class="trend-indicator" :class="getTrendClass(forecast)">
                  <i :class="getTrendIcon(forecast)"></i>
                  {{ getTrendLabel(forecast) }}
                </div>
                <span class="metric-sublabel">{{ getTrendDescription(forecast) }}</span>
              </div>
            </div>
            <div class="demand-chart">
              <div class="chart-header">
                <h4>{{ getPeriodLabel() }} Demand Forecast</h4>
                <div class="chart-legend">
                  <div class="legend-item">
                    <div class="legend-dot prediction"></div>
                    <span>Predicted Demand</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot confidence"></div>
                    <span>Confidence Range</span>
                  </div>
                </div>
              </div>
              <div class="chart-placeholder">
                <div class="chart-confidence-area" 
                  v-for="(point, i) in forecast.forecast_data" 
                  :key="`conf-${i}`"
                  :style="{ 
                    left: `${(i / (forecast.forecast_data.length - 1)) * 100}%`,
                    bottom: `${calculatePointLowerBound(point, forecast)}%`,
                    height: `${calculateConfidenceHeight(point, forecast)}%` 
                  }"
                ></div>
                <div class="chart-line"></div>
                <div 
                  v-for="(point, i) in forecast.forecast_data" 
                  :key="`point-${i}`" 
                  class="chart-point"
                  :style="{ 
                    left: `${(i / (forecast.forecast_data.length - 1)) * 100}%`,
                    bottom: `${calculatePointHeight(point, forecast)}%` 
                  }"
                  @mouseover="showTooltip($event, point, i)"
                  @mouseout="hideTooltip"
                ></div>
                <div v-if="dateBreakpoints.length > 0" class="chart-dates">
                  <div v-for="(date, i) in dateBreakpoints" :key="i" class="date-marker"
                    :style="{ left: `${(date.index / (forecast.forecast_data.length - 1)) * 100}%` }">
                    {{ date.label }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="inventory-optimization">
              <h4>📦 Inventory Optimization & Stock Prediction</h4>
              
              <!-- Stock Status Alert -->
              <div v-if="getInventoryAlert(forecast)" class="inventory-alert" :class="getInventoryAlertClass(forecast)">
                <i :class="getInventoryAlertIcon(forecast)"></i>
                <span>{{ getInventoryAlert(forecast) }}</span>
              </div>
              
              <!-- Key Inventory Metrics -->
              <div class="optimization-metrics">
                <div class="optimization-item">
                  <span class="optimization-label">📊 Current Stock</span>
                  <span class="optimization-value" :class="getStockStatusClass(getCurrentStock(forecast))">
                    {{ getCurrentStock(forecast) }} units
                  </span>
                  <span class="optimization-sublabel">{{ getStockStatusText(getCurrentStock(forecast)) }}</span>
                </div>
                
                <div class="optimization-item">
                  <span class="optimization-label">📈 Total Forecast Demand</span>
                  <span class="optimization-value">{{ getTotalDemand(forecast) }} units</span>
                  <span class="optimization-sublabel">Expected demand for {{ forecastDays }}-day period</span>
                </div>
                
                <div class="optimization-item">
                  <span class="optimization-label">⏱️ Days Until Stockout</span>
                  <span class="optimization-value" :class="getStockoutWarningClass(forecast)">
                    {{ getDaysUntilStockout(forecast) }}
                  </span>
                  <span class="optimization-sublabel">Based on current stock & demand</span>
                </div>
                
                <div class="optimization-item">
                  <span class="optimization-label">🛒 Recommended Order Qty</span>
                  <span class="optimization-value highlight">{{ getRecommendedOrderQty(forecast) }} units</span>
                  <span class="optimization-sublabel">To maintain optimal inventory levels</span>
                </div>
                
                <div class="optimization-item">
                  <span class="optimization-label">🔄 Reorder Point</span>
                  <span class="optimization-value">{{ getReorderPoint(forecast) }} units</span>
                  <span class="optimization-sublabel">Trigger reorder when stock reaches this level</span>
                </div>
                
                <div class="optimization-item">
                  <span class="optimization-label">🛡️ Safety Stock</span>
                  <span class="optimization-value">{{ getSafetyStock(forecast) }} units</span>
                  <span class="optimization-sublabel">Buffer to prevent stockouts</span>
                </div>
              </div>
              
              <!-- Stock Level Prediction Chart -->
              <div class="stock-prediction-chart">
                <h5>📉 Stock Level Prediction ({{ forecastDays }} Days)</h5>
                <div class="stock-chart-container">
                  <div class="stock-chart-y-axis">
                    <span class="y-label">{{ getMaxStockLevel(forecast) }}</span>
                    <span class="y-label">{{ Math.floor(getMaxStockLevel(forecast) * 0.75) }}</span>
                    <span class="y-label">{{ Math.floor(getMaxStockLevel(forecast) * 0.5) }}</span>
                    <span class="y-label">{{ Math.floor(getMaxStockLevel(forecast) * 0.25) }}</span>
                    <span class="y-label">0</span>
                  </div>
                  <div class="stock-chart-area">
                    <!-- Safety Stock Zone -->
                    <div class="stock-zone safety-zone" 
                      :style="{ height: `${(getSafetyStock(forecast) / getMaxStockLevel(forecast)) * 100}%` }">
                      <span class="zone-label">Safety Stock</span>
                    </div>
                    
                    <!-- Reorder Point Line -->
                    <div class="stock-line reorder-line" 
                      :style="{ bottom: `${(getReorderPoint(forecast) / getMaxStockLevel(forecast)) * 100}%` }">
                      <span class="line-label">Reorder Point</span>
                    </div>
                    
                    <!-- Stock Level Line -->
                    <div class="stock-prediction-line">
                      <div v-for="(point, i) in forecast.forecast_data" 
                        :key="`stock-${i}`"
                        class="stock-point"
                        :class="getStockPointClass(forecast, i)"
                        :style="{ 
                          left: `${(i / (forecast.forecast_data.length - 1)) * 100}%`,
                          bottom: `${calculateStockLevel(forecast, i)}%` 
                        }"
                        @mouseover="showStockTooltip($event, forecast, i)"
                        @mouseout="hideTooltip">
                      </div>
                    </div>
                    
                    <!-- Date markers -->
                    <div class="stock-chart-dates">
                      <div v-for="(date, i) in getStockDateBreakpoints(forecast)" 
                        :key="`stock-date-${i}`" 
                        class="date-marker"
                        :style="{ left: `${(date.index / (forecast.forecast_data.length - 1)) * 100}%` }">
                        {{ date.label }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <div class="legend-dot stock-normal"></div>
                    <span>Normal Stock</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot stock-warning"></div>
                    <span>Low Stock Warning</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot stock-critical"></div>
                    <span>Critical/Stockout</span>
                  </div>
                </div>
              </div>
              
              <!-- Sales Trend Analysis -->
              <div class="sales-trend-analysis">
                <h5>📊 Sales Trend Analysis</h5>
                <div class="trend-metrics">
                  <div class="trend-metric">
                    <i class="fas fa-chart-line"></i>
                    <span class="trend-label">Trend Direction:</span>
                    <span class="trend-value" :class="getTrendClass(forecast)">
                      {{ getTrendLabel(forecast) }}
                    </span>
                  </div>
                  <div class="trend-metric">
                    <i class="fas fa-wave-square"></i>
                    <span class="trend-label">Demand Volatility:</span>
                    <span class="trend-value">{{ getDemandVolatility(forecast) }}</span>
                  </div>
                  <div class="trend-metric">
                    <i class="fas fa-calendar-day"></i>
                    <span class="trend-label">Highest Demand:</span>
                    <span class="trend-value">{{ getPeakDemandDay(forecast) || 'N/A' }}</span>
                  </div>
                  <div class="trend-metric">
                    <i class="fas fa-calendar-minus"></i>
                    <span class="trend-label">Lowest Demand:</span>
                    <span class="trend-value">{{ getLowestDemandDay(forecast) || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="inventory-recommendations">
              <h4>Inventory Recommendations</h4>
              <ul class="recommendations-list">
                <li>
                  <i class="fas fa-shopping-cart"></i>
                  <span>Order <strong>{{ getRecommendedStock(forecast) }} units</strong> to maintain optimal inventory</span>
                </li>
                <li>
                  <i class="fas fa-calendar-check"></i>
                  <span>Review inventory levels every <strong>{{ getReviewPeriod() }} days</strong></span>
                </li>
                <li v-if="getPeakDemandDay(forecast)">
                  <i class="fas fa-arrow-up"></i>
                  <span>Prepare for peak demand on <strong>{{ getPeakDemandDay(forecast) }}</strong></span>
                </li>
                <li v-if="getStockAlert(forecast)">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>{{ getStockAlert(forecast) }}</span>
                </li>
              </ul>
            </div>
            
            <div class="seasonal-analysis" v-if="getSeasonal(forecast)">
              <h4>Seasonal Pattern Analysis</h4>
              <div class="seasonal-pattern">
                <div class="pattern-item">
                  <i class="fas fa-arrow-up text-success"></i>
                  <span>Peak Demand: {{ getSeasonal(forecast).peak }}</span>
                </div>
                <div class="pattern-item">
                  <i class="fas fa-arrow-down text-warning"></i>
                  <span>Low Demand: {{ getSeasonal(forecast).low }}</span>
                </div>
              </div>
              <div class="seasonal-insights">
                <p class="insight">
                  <i class="fas fa-lightbulb"></i>
                  {{ getSeasonalInsight(forecast) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="!isGenerating && !forecasts.length && !error" class="empty-state">
        <i class="fas fa-cubes"></i>
        <h3>No Demand Forecast Available</h3>
        <p>Generate demand forecasts to optimize your inventory levels and prevent stockouts.</p>
        <div class="training-info">
          <i class="fas fa-chart-bar"></i>
          <p>The system analyzes historical sales data to identify trends and seasonal patterns for accurate demand prediction.</p>
        </div>
      </div>

      <div id="tooltip" class="tooltip" ref="tooltip" v-show="tooltipVisible">
        <div class="tooltip-date">{{ tooltipDate }}</div>
        <div class="tooltip-value">{{ tooltipValue }}</div>
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
import AdminNavbar from '../../components/AdminNavbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';

export default {
  name: 'SalesForecast',
  components: {
    AdminNavbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      forecasts: [],
      isGenerating: false,
      error: null,
      forecastPeriod: 'monthly',
      selectedQuarter: 'Q1',
      forecastMethod: 'prophet',
      tooltipVisible: false,
      tooltipDate: '',
      tooltipValue: '',
      dateBreakpoints: []
    };
  },
  computed: {
    forecastDays() {
      const periodMap = {
        'weekly': 7,
        'bi-weekly': 14,
        'monthly': 30,
        'quarterly': 90,
        'semi-annual': 180
      };
      return periodMap[this.forecastPeriod] || 30;
    }
  },
  methods: {
    calculateAverage(forecastData) {
      if (!forecastData || !forecastData.length) return '0';
      
      const sum = forecastData.reduce((total, point) => total + point.yhat, 0);
      return (sum / forecastData.length).toFixed(1);
    },
    
    getCurrentStock(forecast) {
      // Try different possible property names for stock
      const stock = forecast.current_stock || 
                   forecast.stock_quantity || 
                   forecast.stock || 
                   forecast.total_stock ||
                   0;
      return parseInt(stock) || 0;
    },
    
    getStockStatusClass(stock) {
      const stockLevel = parseInt(stock) || 0;
      if (stockLevel <= 10) return 'critical-stock';
      if (stockLevel <= 30) return 'low-stock';
      return 'normal-stock';
    },
    
    getStockStatusText(stock) {
      const stockLevel = parseInt(stock) || 0;
      if (stockLevel === 0) return 'Out of Stock';
      if (stockLevel <= 10) return 'Critical Stock';
      if (stockLevel <= 30) return 'Low Stock';
      return 'Normal Stock';
    },
    
    getStockAlert(forecast) {
      const currentStock = this.getCurrentStock(forecast);
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      const totalDemand = avgDemand * this.forecastDays;
      
     
      if (currentStock < totalDemand) {
        const shortfall = Math.ceil(totalDemand - currentStock);
        return `Stock may run out during forecast period. Consider ordering ${shortfall} additional units`;
      }
      
      if (currentStock <= 10) {
        return 'Critical stock level - immediate attention required';
      }
      
      return null;
    },
    
    // New Inventory Optimization Methods
    getTotalDemand(forecast) {
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      return Math.ceil(avgDemand * this.forecastDays);
    },
    
    getDaysUntilStockout(forecast) {
      const currentStock = this.getCurrentStock(forecast);
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      
      if (avgDemand === 0) return 'N/A';
      if (currentStock === 0) return '0 days (Out of Stock)';
      
      const days = Math.floor(currentStock / avgDemand);
      
      if (days > this.forecastDays) {
        return `${this.forecastDays}+ days`;
      }
      
      return `${days} day${days !== 1 ? 's' : ''}`;
    },
    
    getStockoutWarningClass(forecast) {
      const currentStock = this.getCurrentStock(forecast);
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      
      if (avgDemand === 0) return 'normal';
      if (currentStock === 0) return 'critical';
      
      const days = Math.floor(currentStock / avgDemand);
      
      if (days <= 3) return 'critical';
      if (days <= 7) return 'warning';
      return 'normal';
    },
    
    getRecommendedOrderQty(forecast) {
      const currentStock = this.getCurrentStock(forecast);
      const totalDemand = this.getTotalDemand(forecast);
      const safetyStock = this.getSafetyStock(forecast);
      const optimalStock = totalDemand + safetyStock;
      
      const orderQty = Math.max(0, optimalStock - currentStock);
      return Math.ceil(orderQty);
    },
    
    getReorderPoint(forecast) {
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      const leadTime = 3; // Assume 3 days lead time
      const safetyStock = this.getSafetyStock(forecast);
      
      return Math.ceil((avgDemand * leadTime) + safetyStock);
    },
    
    getSafetyStock(forecast) {
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      const volatility = this.getDemandVolatilityValue(forecast);
      
      // Safety stock = Z-score * volatility * sqrt(lead time)
      // Using Z-score of 1.65 for 95% service level
      const zScore = 1.65;
      const leadTime = 3; // days
      
      return Math.ceil(zScore * volatility * Math.sqrt(leadTime));
    },
    
    getInventoryAlert(forecast) {
      const currentStock = this.getCurrentStock(forecast);
      const reorderPoint = this.getReorderPoint(forecast);
      const totalDemand = this.getTotalDemand(forecast);
      const safetyStock = this.getSafetyStock(forecast);
      
      if (currentStock === 0) {
        return '🚨 CRITICAL: Out of Stock - Immediate Action Required!';
      }
      
      if (currentStock < safetyStock) {
        return `⚠️ WARNING: Stock below safety level (${safetyStock} units) - Risk of stockout!`;
      }
      
      if (currentStock < reorderPoint) {
        return `📢 NOTICE: Stock reached reorder point - Order ${this.getRecommendedOrderQty(forecast)} units now`;
      }
      
      if (currentStock < totalDemand) {
        const shortfall = totalDemand - currentStock;
        return `⚡ ALERT: Projected shortage of ${shortfall} units during forecast period`;
      }
      
      const excessStock = currentStock - (totalDemand + safetyStock);
      if (excessStock > totalDemand) {
        return `📦 INFO: Overstock detected (${excessStock} excess units) - Consider reducing orders`;
      }
      
      return null;
    },
    
    getInventoryAlertClass(forecast) {
      const currentStock = this.getCurrentStock(forecast);
      const safetyStock = this.getSafetyStock(forecast);
      const reorderPoint = this.getReorderPoint(forecast);
      
      if (currentStock === 0 || currentStock < safetyStock) return 'alert-critical';
      if (currentStock < reorderPoint) return 'alert-warning';
      return 'alert-info';
    },
    
    getInventoryAlertIcon(forecast) {
      const currentStock = this.getCurrentStock(forecast);
      const safetyStock = this.getSafetyStock(forecast);
      const reorderPoint = this.getReorderPoint(forecast);
      
      if (currentStock === 0 || currentStock < safetyStock) return 'fas fa-exclamation-circle';
      if (currentStock < reorderPoint) return 'fas fa-exclamation-triangle';
      return 'fas fa-info-circle';
    },
    
    getMaxStockLevel(forecast) {
      const currentStock = this.getCurrentStock(forecast);
      const totalDemand = this.getTotalDemand(forecast);
      const recommendedOrder = this.getRecommendedOrderQty(forecast);
      
      return Math.max(currentStock, totalDemand, currentStock + recommendedOrder, 50);
    },
    
    calculateStockLevel(forecast, dayIndex) {
      const currentStock = this.getCurrentStock(forecast);
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      const maxStock = this.getMaxStockLevel(forecast);
      
      // Calculate cumulative demand up to this day
      let cumulativeDemand = 0;
      for (let i = 0; i <= dayIndex; i++) {
        cumulativeDemand += forecast.forecast_data[i].yhat;
      }
      
      const remainingStock = Math.max(0, currentStock - cumulativeDemand);
      return (remainingStock / maxStock) * 100;
    },
    
    getStockPointClass(forecast, dayIndex) {
      const currentStock = this.getCurrentStock(forecast);
      const reorderPoint = this.getReorderPoint(forecast);
      const safetyStock = this.getSafetyStock(forecast);
      
      // Calculate stock level at this day
      let cumulativeDemand = 0;
      for (let i = 0; i <= dayIndex; i++) {
        cumulativeDemand += forecast.forecast_data[i].yhat;
      }
      
      const remainingStock = currentStock - cumulativeDemand;
      
      if (remainingStock <= 0) return 'stock-critical';
      if (remainingStock < safetyStock) return 'stock-critical';
      if (remainingStock < reorderPoint) return 'stock-warning';
      return 'stock-normal';
    },
    
    showStockTooltip(event, forecast, dayIndex) {
      const currentStock = this.getCurrentStock(forecast);
      const point = forecast.forecast_data[dayIndex];
      
      let cumulativeDemand = 0;
      for (let i = 0; i <= dayIndex; i++) {
        cumulativeDemand += forecast.forecast_data[i].yhat;
      }
      
      const remainingStock = Math.max(0, currentStock - cumulativeDemand);
      const date = new Date(point.ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      this.tooltipDate = date;
      this.tooltipValue = `Stock: ${Math.floor(remainingStock)} units | Demand: ${point.yhat.toFixed(1)} units`;
      this.tooltipVisible = true;
      
      const tooltip = this.$refs.tooltip;
      tooltip.style.left = event.clientX + 10 + 'px';
      tooltip.style.top = event.clientY - 40 + 'px';
    },
    
    getStockDateBreakpoints(forecast) {
      if (!forecast.forecast_data || forecast.forecast_data.length === 0) return [];
      
      const breakpoints = [];
      const numPoints = forecast.forecast_data.length;
      const numBreakpoints = Math.min(5, numPoints);
      
      for (let i = 0; i < numBreakpoints; i++) {
        const index = Math.floor((i / (numBreakpoints - 1)) * (numPoints - 1));
        const date = new Date(forecast.forecast_data[index].ds);
        
        breakpoints.push({
          index: index,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      
      return breakpoints;
    },
    
    getDemandVolatility(forecast) {
      const volatilityValue = this.getDemandVolatilityValue(forecast);
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      
      if (avgDemand === 0) return 'N/A';
      
      const coefficient = (volatilityValue / avgDemand) * 100;
      
      if (coefficient < 15) return 'Low (Stable)';
      if (coefficient < 30) return 'Moderate';
      return 'High (Volatile)';
    },
    
    getDemandVolatilityValue(forecast) {
      if (!forecast.forecast_data || forecast.forecast_data.length < 2) return 0;
      
      const values = forecast.forecast_data.map(p => p.yhat);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
      
      return Math.sqrt(variance);
    },
    
    getLowestDemandDay(forecast) {
      if (!forecast.forecast_data || forecast.forecast_data.length === 0) return null;
      
      let lowestIndex = 0;
      let lowestValue = forecast.forecast_data[0].yhat;
      
      forecast.forecast_data.forEach((point, index) => {
        if (point.yhat < lowestValue) {
          lowestValue = point.yhat;
          lowestIndex = index;
        }
      });
      
      const lowDate = new Date(forecast.forecast_data[lowestIndex].ds);
      return lowDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    },
    
    calculatePointHeight(point, forecast) {
      const values = forecast.forecast_data.map(p => p.yhat);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      
      return ((point.yhat - min) / range) * 80;
    },
    
    calculatePointLowerBound(point, forecast) {
      const allValues = forecast.forecast_data.flatMap(p => [p.yhat, p.yhat_lower, p.yhat_upper]);
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const range = max - min || 1;
      
      return ((point.yhat_lower - min) / range) * 80;
    },
    
    calculateConfidenceHeight(point, forecast) {
      const allValues = forecast.forecast_data.flatMap(p => [p.yhat, p.yhat_lower, p.yhat_upper]);
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const range = max - min || 1;
      
      return ((point.yhat_upper - point.yhat_lower) / range) * 80;
    },
    
    getTrendClass(forecast) {
      const first = forecast.forecast_data[0]?.yhat || 0;
      const last = forecast.forecast_data[forecast.forecast_data.length - 1]?.yhat || 0;
      const change = last - first;
      
      if (change > 0) return 'positive';
      if (change < 0) return 'negative';
      return 'neutral';
    },
    
    getTrendIcon(forecast) {
      const trendClass = this.getTrendClass(forecast);
      
      if (trendClass === 'positive') return 'fas fa-arrow-up';
      if (trendClass === 'negative') return 'fas fa-arrow-down';
      return 'fas fa-arrows-alt-h';
    },
    
    getTrendLabel(forecast) {
      const first = forecast.forecast_data[0]?.yhat || 0;
      const last = forecast.forecast_data[forecast.forecast_data.length - 1]?.yhat || 0;
      const change = last - first;
      const percentChange = first === 0 ? 0 : (change / first) * 100;
      
      if (Math.abs(percentChange) < 1) return 'Stable Demand';
      
      // Cap the display percentage at 100% while maintaining accuracy
      const displayPercent = Math.min(Math.abs(percentChange), 100);
      
      // If actual change is over 100%, show it differently
      if (Math.abs(percentChange) > 100) {
        const multiplier = (Math.abs(percentChange) / 100).toFixed(1);
        return `${multiplier}x ${percentChange > 0 ? 'Growth' : 'Decline'} (${displayPercent}%+)`;
      }
      
      return `${displayPercent.toFixed(1)}% ${percentChange > 0 ? 'Increase' : 'Decrease'}`;
    },
    
    getRecommendedStock(forecast) {
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      const days = this.forecastDays;
      const totalDemand = avgDemand * days;
      
      // Add 20% buffer for safety stock
      return Math.ceil(totalDemand * 1.2);
    },
    
    getReviewPeriod() {
      const periodMap = {
        'daily': 1,
        'weekly': 3,
        'monthly': 7,
        'quarterly': 14,
        'annually': 30
      };
      return periodMap[this.forecastPeriod] || 7;
    },
    
    getPeakDemandDay(forecast) {
      if (!forecast.forecast_data || forecast.forecast_data.length === 0) return null;
      
      let highestIndex = 0;
      let highestValue = forecast.forecast_data[0].yhat;
      
      forecast.forecast_data.forEach((point, index) => {
        if (point.yhat > highestValue) {
          highestValue = point.yhat;
          highestIndex = index;
        }
      });
      
      if (highestIndex === 0) return null;
      
      const peakDate = new Date(forecast.forecast_data[highestIndex].ds);
      return peakDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    },
    
    getPeriodLabel() {
      const labels = {
        'weekly': 'Weekly',
        'bi-weekly': 'Bi-weekly',
        'monthly': 'Monthly',
        'quarterly': `Quarterly (${this.selectedQuarter})`,
        'semi-annual': 'Semi-annual'
      };
      return labels[this.forecastPeriod] || 'Monthly';
    },
    
    getPeriodUnit() {
      const units = {
        'weekly': 'Week',
        'bi-weekly': '2 Weeks',
        'monthly': 'Month',
        'quarterly': 'Quarter',
        'semi-annual': '6 Months'
      };
      return units[this.forecastPeriod] || 'Month';
    },
    
    getMethodLabel() {
      return 'Prophet AI - Advanced Time Series Forecasting';
    },
    
    getAccuracyClass(forecast) {
      const accuracy = parseFloat(forecast.model_accuracy) || 70;
      if (accuracy >= 85) return 'high';
      if (accuracy >= 70) return 'medium';
      return 'low';
    },
    
    getAccuracyLabel(forecast) {
      const accuracy = parseFloat(forecast.model_accuracy) || 70;
      if (accuracy >= 90) return `${accuracy.toFixed(1)}% Excellent`;
      if (accuracy >= 80) return `${accuracy.toFixed(1)}% Very Good`;
      if (accuracy >= 70) return `${accuracy.toFixed(1)}% Good`;
      if (accuracy >= 60) return `${accuracy.toFixed(1)}% Fair`;
      return `${accuracy.toFixed(1)}% Needs More Data`;
    },
    
    getTrainingDataInfo() {
      if (this.forecasts.length === 0) return '';
      
      const sample = this.forecasts[0];
      if (!sample.training_size && !sample.validation_size) return '';
      
      return `Analyzed ${sample.training_size || 0} historical data points with ${sample.validation_size || 0} validation samples`;
    },
    
    getSeasonal(forecast) {
      return forecast.seasonal_patterns || forecast.seasonal_info || {
        peak: 'Weekends',
        low: 'Mid-week'
      };
    },
    
    getSeasonalInsight(forecast) {
      const seasonal = this.getSeasonal(forecast);
      return `Historical data shows higher demand during ${seasonal.peak} and lower demand during ${seasonal.low}. Plan inventory accordingly.`;
    },
    
    getTrendDescription(forecast) {
      if (!forecast.seasonal_insights) return '';
      
      const trend = forecast.seasonal_insights.trend_direction;
      if (trend === 'growing' || trend === 'increasing') {
        return 'Your sales are on the rise! Consider stocking more inventory.';
      } else if (trend === 'declining' || trend === 'decreasing') {
        return 'Sales are declining. Review pricing or promotions.';
      } else {
        return 'Sales are steady. Maintain current stock levels.';
      }
    },
        
    showTooltip(event, point, index) {
      this.tooltipVisible = true;
      
      const date = new Date(point.ds);
      this.tooltipDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
      
      this.tooltipValue = `${point.yhat.toFixed(1)} units demand`;
        
      const tooltip = this.$refs.tooltip;
      if (tooltip) {
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.top - 50}px`;
      }
    },
    
    hideTooltip() {
      this.tooltipVisible = false;
    },
    
    handleImageError(e) {
      e.target.src = '/img/placeholder.jpg';
    },
    
    generateDateBreakpoints(forecast) {
      if (!forecast || !forecast.forecast_data || forecast.forecast_data.length === 0) {
        this.dateBreakpoints = [];
        return;
      }
      
      const data = forecast.forecast_data;
      const totalDays = data.length;
      const breakpoints = [];
      
      if (totalDays <= 14) {
        for (let i = 0; i < totalDays; i += 2) {
          const date = new Date(data[i].ds);
          breakpoints.push({
            index: i,
            label: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          });
        }
      } else if (totalDays <= 30) {
        for (let i = 0; i < totalDays; i += 7) {
          const date = new Date(data[i].ds);
          breakpoints.push({
            index: i,
            label: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          });
        }
      } else {
        const interval = Math.floor(totalDays / 4);
        for (let i = 0; i < totalDays; i += interval) {
          const date = new Date(data[i].ds);
          breakpoints.push({
            index: i,
            label: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          });
        }
      }
      
      const lastDate = new Date(data[totalDays - 1].ds);
      breakpoints.push({
        index: totalDays - 1,
        label: lastDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      });
      
      this.dateBreakpoints = breakpoints;
    },

    async generateForecasts() {
      this.isGenerating = true;
      this.error = null;
      this.forecasts = [];
      this.dateBreakpoints = [];
      
      try {
        const token = localStorage.getItem('token');
        
        let method = this.forecastMethod;
        if (method === 'advanced') {
          method = 'prophet';
        }
        
        // Add quarter parameter if quarterly period is selected
        let queryParams = `type=demand&days=${this.forecastDays}&method=${method}`;
        if (this.forecastPeriod === 'quarterly') {
          queryParams += `&quarter=${this.selectedQuarter}`;
        }
        
        const response = await this.$fetch(`/api/admin/forecasts?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate demand forecast');
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.message || 'Failed to generate demand forecast');
        }
        
        this.forecasts = Object.values(data.data || {}).map(item => {
          return {
            ...item,
            forecast_data: Array.isArray(item.forecast_data) ? 
              item.forecast_data.map(point => ({
                ...point,
                yhat: Math.max(0, point.yhat),
                yhat_lower: Math.max(0, point.yhat_lower),
                yhat_upper: Math.max(0, point.yhat_upper)
              })) : []
          };
        });
        
        if (this.forecasts.length > 0) {
          this.generateDateBreakpoints(this.forecasts[0]);
        }
        
      } catch (error) {
        console.error('Error generating demand forecast:', error);
        this.error = error.message || 'Failed to generate demand forecast. Please try again.';
      } finally {
        this.isGenerating = false;
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
    }
  }
}
</script>

<style scoped>
.admin-container {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-left: 250px;
}

.admin-content {
  padding: 2rem;
  margin: 0 auto;
  position: relative;
}

.analysis-button {
  padding: 10px 16px;
  background-color: #f8fafc;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  margin: 0 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.analysis-button:hover {
  background-color: #e2e8f0;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.analysis-button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.benefits-list li {
  padding: 0.5rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.benefits-list strong {
  color: #1e293b;
}

.forecast-method {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.forecast-header {
  margin-bottom: 2rem;
}

.forecast-header h1 {
  font-size: 1.75rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.description {
  color: #64748b;
  font-size: 1rem;
}

.forecast-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.forecast-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.forecast-options label {
  font-weight: 500;
  color: #64748b;
}

.forecast-period select,
.forecast-method select,
.quarter-selection select {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  min-width: 180px;
  font-size: 0.9rem;
}

.quarter-selection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quarter-selection label {
  font-size: 0.85rem;
  color: #64748b;
}

.quarter-selection select {
  min-width: 200px;
}

.generate-btn {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.generate-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.generate-btn:not(:disabled):hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.generating-animation {
  position: relative;
  margin-bottom: 2rem;
}

.generating-animation i {
  font-size: 3rem;
  color: #3b82f6;
}

.dots {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.dots span {
  display: inline-block;
  font-size: 2rem;
  color: #3b82f6;
  animation: dots 1.5s infinite;
}

.dots span:nth-child(2) {
  animation-delay: 0.5s;
}

.dots span:nth-child(3) {
  animation-delay: 1s;
}

@keyframes dots {
  0%, 20% {
    transform: translateY(0);
    opacity: 0;
  }
  50% {
    transform: translateY(-10px);
    opacity: 1;
  }
  80%, 100% {
    transform: translateY(0);
    opacity: 0;
  }
}

.error-message {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.forecasts-container h2 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #1e293b;
}

.forecast-period-badge,
.method-badge {
  font-size: 0.8rem;
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 500;
}

.explanation-card {
  background-color: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.explanation-card i {
  color: #3b82f6;
  font-size: 1.5rem;
}

.explanation-card h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  color: #1e293b;
}

.explanation-card p {
  color: #475569;
  margin: 0;
  line-height: 1.5;
}

.model-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #cbd5e1;
  font-size: 0.85rem;
  color: #64748b;
}

.forecast-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
}

.forecast-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
}

.forecast-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #e2e8f0;
}

.forecast-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-details h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
  font-weight: 600;
}

.product-category {
  font-size: 0.8rem;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  width: fit-content;
}

.product-price {
  font-size: 1rem;
  color: #059669;
  font-weight: 600;
}

.accuracy-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.model-type {
  font-size: 0.75rem;
  color: #64748b;
  text-align: right;
}

.key-metrics {
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid #3b82f6;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.metric-row:last-child {
  margin-bottom: 0;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
}

.metric-item i {
  color: #3b82f6;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.metric-sublabel {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  font-style: italic;
  display: block;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.metric-value.critical {
  color: #dc2626;
}

.metric-value.critical-stock {
  color: #dc2626;
}

.metric-value.low-stock {
  color: #f59e0b;
}

.metric-value.normal-stock {
  color: #16a34a;
}

.stock-status-section {
  background-color: #f0fdf4;
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid #16a34a;
}

.stock-status.critical {
  background-color: #fef2f2;
  border-left-color: #dc2626;
}

.stock-status.low {
  background-color: #fffbeb;
  border-left-color: #f59e0b;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.status-indicator i {
  font-size: 1.25rem;
}

.status-indicator .fa-check-circle {
  color: #16a34a;
}

.status-indicator .fa-exclamation-circle {
  color: #f59e0b;
}

.status-indicator .fa-exclamation-triangle {
  color: #dc2626;
}

.status-text {
  font-weight: 600;
  color: #1e293b;
}

.reorder-info {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.reorder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.reorder-item .label {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.reorder-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.recommendations-section {
  background-color: #fefce8;
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid #eab308;
}

.recommendations-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #1e293b;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recommendation-item {
  font-size: 0.9rem;
  line-height: 1.4;
  color: #1e293b;
}

.seasonal-insights {
  background-color: #f0f9ff;
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid #3b82f6;
}

.seasonal-insights h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #1e293b;
}

.insights-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.insight-item i {
  color: #3b82f6;
  width: 16px;
  text-align: center;
}

.insight-label {
  color: #64748b;
  min-width: 80px;
}

.insight-value {
  color: #1e293b;
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
  border-radius: 8px;
  object-fit: cover;
}

.product-info h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.accuracy-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.accuracy-badge.high {
  background-color: #f0fdf4;
  color: #166534;
}

.accuracy-badge.medium {
  background-color: #fef3c7;
  color: #92400e;
}

.accuracy-badge.low {
  background-color: #fef2f2;
  color: #b91c1c;
}

.demand-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  text-align: center;
}

.metric.highlight {
  background-color: #f0fdf4;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  border: 1px solid #dcfce7;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.metric-value.critical-stock {
  color: #dc2626;
}

.metric-value.low-stock {
  color: #f59e0b;
}

.metric-value.normal-stock {
  color: #16a34a;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.trend-indicator.positive {
  background-color: #f0fdf4;
  color: #166534;
}

.trend-indicator.negative {
  background-color: #fef2f2;
  color: #b91c1c;
}

.trend-indicator.neutral {
  background-color: #f1f5f9;
  color: #475569;
}

.demand-chart {
  padding: 0.5rem 0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.chart-header h4 {
  font-size: 0.9rem;
  color: #475569;
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.prediction {
  background-color: #3b82f6;
}

.legend-dot.confidence {
  background-color: rgba(59, 130, 246, 0.2);
}

.chart-placeholder {
  height: 120px;
  position: relative;
  border-bottom: 1px solid #e2e8f0;
}

.chart-confidence-area {
  position: absolute;
  width: 4px;
  background-color: rgba(59, 130, 246, 0.2);
  transform: translateX(-50%);
}

.chart-line {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 1px;
  background-color: #e2e8f0;
}

.chart-point {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #3b82f6;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  z-index: 2;
  cursor: pointer;
  transition: transform 0.2s;
}

.chart-point:hover {
  transform: translate(-50%, 50%) scale(1.5);
}

.chart-dates {
  position: absolute;
  bottom: -20px;
  width: 100%;
  height: 20px;
}

.date-marker {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
}

.inventory-optimization {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.inventory-optimization h4 {
  font-size: 1rem;
  color: #1e293b;
  margin: 0 0 1rem 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.inventory-alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.inventory-alert.alert-critical {
  background-color: #fef2f2;
  color: #991b1b;
  border: 2px solid #fecaca;
}

.inventory-alert.alert-warning {
  background-color: #fefce8;
  color: #854d0e;
  border: 2px solid #fef08a;
}

.inventory-alert.alert-info {
  background-color: #eff6ff;
  color: #1e40af;
  border: 2px solid #dbeafe;
}

.inventory-alert i {
  font-size: 1.25rem;
}

.optimization-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.optimization-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.optimization-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.optimization-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.optimization-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.optimization-value.highlight {
  color: #059669;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  display: inline-block;
}

.optimization-value.critical {
  color: #dc2626;
}

.optimization-value.warning {
  color: #f59e0b;
}

.optimization-value.normal {
  color: #059669;
}

.optimization-sublabel {
  font-size: 0.7rem;
  color: #94a3b8;
  line-height: 1.3;
}

/* Stock Prediction Chart Styles */
.stock-prediction-chart {
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.stock-prediction-chart h5 {
  font-size: 0.9rem;
  color: #475569;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.stock-chart-container {
  display: flex;
  gap: 0.5rem;
  height: 250px;
  margin-bottom: 1rem;
}

.stock-chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 0;
  min-width: 40px;
}

.stock-chart-y-axis .y-label {
  font-size: 0.7rem;
  color: #64748b;
  text-align: right;
}

.stock-chart-area {
  flex: 1;
  position: relative;
  background: linear-gradient(to bottom, 
    rgba(34, 197, 94, 0.05) 0%, 
    rgba(34, 197, 94, 0.1) 50%, 
    rgba(239, 68, 68, 0.1) 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.stock-zone {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stock-zone.safety-zone {
  background: repeating-linear-gradient(
    45deg,
    rgba(239, 68, 68, 0.1),
    rgba(239, 68, 68, 0.1) 10px,
    rgba(239, 68, 68, 0.15) 10px,
    rgba(239, 68, 68, 0.15) 20px
  );
  border-top: 2px dashed #ef4444;
}

.zone-label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.stock-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  display: flex;
  align-items: center;
}

.stock-line.reorder-line {
  background: linear-gradient(to right, 
    transparent 0%, 
    #f59e0b 10%, 
    #f59e0b 90%, 
    transparent 100%);
  border-top: 2px dashed #f59e0b;
}

.line-label {
  position: absolute;
  left: 10px;
  font-size: 0.7rem;
  color: #f59e0b;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #fbbf24;
}

.stock-prediction-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.stock-point {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stock-point:hover {
  width: 12px;
  height: 12px;
  z-index: 10;
}

.stock-point.stock-normal {
  background-color: #22c55e;
}

.stock-point.stock-warning {
  background-color: #f59e0b;
}

.stock-point.stock-critical {
  background-color: #ef4444;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.stock-chart-dates {
  position: absolute;
  bottom: -25px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
}

.stock-chart-dates .date-marker {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.legend-dot.stock-normal {
  background-color: #22c55e;
}

.legend-dot.stock-warning {
  background-color: #f59e0b;
}

.legend-dot.stock-critical {
  background-color: #ef4444;
}

/* Sales Trend Analysis Styles */
.sales-trend-analysis {
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.sales-trend-analysis h5 {
  font-size: 0.9rem;
  color: #475569;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.trend-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.trend-metric {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.trend-metric i {
  color: #3b82f6;
  font-size: 1rem;
}

.trend-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.trend-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}


.inventory-recommendations {
  background-color: #f0fdf4;
  padding: 1rem;
  border-radius: 8px;
}

.inventory-recommendations h4 {
  font-size: 0.9rem;
  color: #475569;
  margin: 0 0 0.5rem 0;
}

.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recommendations-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #1e293b;
  line-height: 1.4;
}

.recommendations-list i {
  color: #3b82f6;
  margin-top: 0.15rem;
}

.recommendations-list strong {
  font-weight: 600;
}

.seasonal-analysis {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.seasonal-analysis h4 {
  font-size: 0.9rem;
  color: #475569;
  margin: 0 0 0.5rem 0;
}

.seasonal-pattern {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.pattern-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #1e293b;
}

.text-success {
  color: #16a34a;
}

.text-warning {
  color: #ea580c;
}

.seasonal-insights {
  background-color: #fffbeb;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #f59e0b;
}

.insight {
  margin: 0;
  font-size: 0.85rem;
  color: #92400e;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  line-height: 1.4;
}

.insight i {
  color: #f59e0b;
  margin-top: 0.1rem;
}

.tooltip {
  position: fixed;
  background-color: #1e293b;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translate(-50%, -100%);
}

.tooltip::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #1e293b;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.empty-state i {
  font-size: 4rem;
  color: #e2e8f0;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #64748b;
  max-width: 500px;
  line-height: 1.6;
}

.training-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background-color: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 2rem;
  text-align: left;
  max-width: 500px;
}

.training-info i {
  font-size: 1.5rem;
  color: #3b82f6;
  margin-top: 0.25rem;
}

.training-info p {
  margin: 0;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-container {
    padding-left: 60px;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .forecast-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .forecast-options {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .generate-btn {
    width: 100%;
    justify-content: center;
  }
  
  .forecast-items {
    grid-template-columns: 1fr;
  }
  
  .demand-metrics {
    grid-template-columns: 1fr;
  }
}
</style>

