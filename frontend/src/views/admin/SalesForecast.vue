<template>
  <div class="admin-container">
    <AdminNavbar 
      :username="username"
      @logout="showLogoutModal = true"
    />
    
    <div class="admin-content">
      <div class="forecast-header">
        <h1>Sales & Demand Forecasting</h1>
        <p class="description">Generate predictions for future sales and inventory requirements based on your historical sales data.</p>
      </div>
      
      <div class="forecast-actions">
        <div class="forecast-options">
          <label>Forecast type:</label>
          <div class="forecast-type-selector">
            <button 
              @click="forecastType = 'sales'" 
              :class="['forecast-type-btn', { active: forecastType === 'sales' }]"
            >
              <i class="fas fa-chart-line"></i> Sales Forecasting
            </button>
            <button 
              @click="forecastType = 'demand'" 
              :class="['forecast-type-btn', { active: forecastType === 'demand' }]"
            >
              <i class="fas fa-cubes"></i> Demand Forecasting
            </button>
          </div>
          
          <label>Forecast period:</label>
          <div class="forecast-period">
            <select v-model="forecastDays">
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>

          <label>Analysis method:</label>
          <div class="forecast-method">
            <select v-model="forecastMethod">
              <option value="linear">Linear Trend</option>
              <option value="moving-avg">Moving Average</option>
              <option value="seasonal">Seasonal Analysis</option>
              <option value="advanced">Advanced ML</option>
            </select>
          </div>
        </div>
        
        <button 
          @click="generateForecasts" 
          class="generate-btn"
          :disabled="isGenerating"
        >
          <i class="fas fa-magic"></i>
          {{ isGenerating ? 'Generating...' : 'Generate Forecasts' }}
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
        <p>Analyzing historical data and generating forecasts...</p>
        <p class="generating-detail">This may take a few moments as we train the model using your sales history.</p>
      </div>
      
      <div v-if="!isGenerating && forecasts.length" class="forecasts-container">
        <h2>
          {{ forecastType === 'sales' ? 'Sales Forecast' : 'Demand Forecast' }}
          <span class="forecast-period-badge">Next {{ forecastDays }} days</span>
          <span class="method-badge">{{ getMethodLabel() }}</span>
        </h2>
        
        <div class="forecast-explanation">
          <div class="explanation-card">
            <i class="fas fa-lightbulb"></i>
            <div>
              <h3>{{ forecastType === 'sales' ? 'Sales Forecasting' : 'Demand Forecasting' }}</h3>
              <p v-if="forecastType === 'sales'">
                Predict future sales for products/categories. Helps with inventory planning and revenue projections.
              </p>
              <p v-else>
                Estimate how many units of a product will be needed in the future. Prevents stockouts or overstocking.
              </p>
              <p class="model-info">
                <i class="fas fa-info-circle"></i>
                <span>{{ getTrainingDataInfo() }}</span>
              </p>
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
            
            <div class="forecast-metrics">
              <div class="metric">
                <span class="metric-label">Current Daily {{ forecastType === 'sales' ? 'Revenue' : 'Sales' }}</span>
                <span class="metric-value">{{ forecastType === 'sales' ? '₱' : '' }}{{ forecast.current_sales }}{{ forecastType === 'demand' ? ' units' : '' }}</span>
              </div>
              
              <div class="metric highlight">
                <span class="metric-label">Forecasted {{ forecastType === 'sales' ? 'Revenue' : 'Demand' }}</span>
                <span class="metric-value">
                  {{ forecastType === 'sales' ? '₱' : '' }}{{ calculateAverage(forecast.forecast_data) }}{{ forecastType === 'sales' ? '' : ' units' }}/day
                </span>
              </div>
              
              <div class="metric">
                <span class="metric-label">Trend</span>
                <div class="trend-indicator" :class="getTrendClass(forecast)">
                  <i :class="getTrendIcon(forecast)"></i>
                  {{ getTrendLabel(forecast) }}
                </div>
              </div>
            </div>
            
            <div class="forecast-chart">
              <div class="chart-header">
                <h4>{{ forecastDays }}-Day Forecast</h4>
                <div class="chart-legend">
                  <div class="legend-item">
                    <div class="legend-dot prediction"></div>
                    <span>Prediction</span>
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
            
            <div class="forecast-confidence">
              <span class="confidence-label">Model Confidence</span>
              <div class="confidence-meter">
                <div class="confidence-bar" :style="{ width: getConfidenceWidth(forecast) }"></div>
              </div>
              <span class="confidence-value">{{ getConfidencePercent(forecast) }}%</span>
            </div>
            
            <div class="forecast-recommendations">
              <h4>Recommendations</h4>
              <ul class="recommendations-list">
                <li v-if="forecastType === 'demand'">
                  <i class="fas fa-shopping-cart"></i>
                  <span>Order <strong>{{ getRecommendedStock(forecast) }} units</strong> to maintain optimal inventory</span>
                </li>
                <li v-else>
                  <i class="fas fa-chart-pie"></i>
                  <span>Expected revenue: <strong>₱{{ getExpectedRevenue(forecast) }}</strong> in next {{ forecastDays }} days</span>
                </li>
                <li>
                  <i class="fas fa-history"></i>
                  <span>Schedule next inventory review in <strong>{{ getReviewDate() }}</strong></span>
                </li>
                <li v-if="getPeakDemandDay(forecast)">
                  <i class="fas fa-calendar-day"></i>
                  <span>Prepare for peak demand on <strong>{{ getPeakDemandDay(forecast) }}</strong></span>
                </li>
              </ul>
            </div>
            
            <div class="forecast-seasonal-info" v-if="forecastMethod === 'seasonal' && getSeasonal(forecast)">
              <h4>Seasonal Patterns</h4>
              <div class="seasonal-pattern">
                <div class="pattern-item">
                  <i class="fas fa-arrow-up text-success"></i>
                  <span>Peak: {{ getSeasonal(forecast).peak }}</span>
                </div>
                <div class="pattern-item">
                  <i class="fas fa-arrow-down text-danger"></i>
                  <span>Low: {{ getSeasonal(forecast).low }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="!isGenerating && !forecasts.length && !error" class="empty-state">
        <i class="fas fa-chart-bar"></i>
        <h3>No Forecasts Generated Yet</h3>
        <p>Click the "Generate Forecasts" button to create sales and demand projections based on your historical data.</p>
        <div class="training-info">
          <i class="fas fa-brain"></i>
          <p>The forecasting model needs historical sales data to make accurate predictions. More historical data leads to better forecasts.</p>
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
      forecastType: 'sales', // 'sales' or 'demand'
      forecastDays: '30',
      forecastMethod: 'linear', // 'linear', 'moving-avg', 'seasonal', 'advanced'
      tooltipVisible: false,
      tooltipDate: '',
      tooltipValue: '',
      dateBreakpoints: []
    };
  },
  methods: {
    calculateAverage(forecastData) {
      if (!forecastData || !forecastData.length) return '0';
      
      const sum = forecastData.reduce((total, point) => {
        const value = this.forecastType === 'sales' ? point.yhat * point.price : point.yhat;
        return total + value;
      }, 0);
      
      return (sum / forecastData.length).toFixed(2);
    },
    
    calculatePointHeight(point, forecast) {
      const values = forecast.forecast_data.map(p => p.yhat);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      
      return ((point.yhat - min) / range) * 80;
    },
    
    calculatePointLowerBound(point, forecast) {
      const values = forecast.forecast_data.map(p => p.yhat_lower);
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
      
      if (Math.abs(percentChange) < 1) return 'Stable';
      
      return `${Math.abs(percentChange).toFixed(1)}% ${percentChange > 0 ? 'Increase' : 'Decrease'}`;
    },
    
    getConfidenceWidth(forecast) {
      // Calculate confidence based on model accuracy and data quality
      if (!forecast.model_accuracy) return '75%';
      
      const accuracy = parseFloat(forecast.model_accuracy) || 0;
      return `${Math.max(50, Math.min(98, accuracy))}%`;
    },
    
    getConfidencePercent(forecast) {
      return parseInt(this.getConfidenceWidth(forecast));
    },
    
    getRecommendedStock(forecast) {
      const avgDemand = parseFloat(this.calculateAverage(forecast.forecast_data));
      // Add buffer based on confidence level
      const confidencePercent = this.getConfidencePercent(forecast);
      const buffer = 1 + ((100 - confidencePercent) / 100); // Lower confidence = higher buffer
      return Math.ceil(avgDemand * (parseInt(this.forecastDays) / 7) * buffer);
    },
    
    getExpectedRevenue(forecast) {
      const avgSales = parseFloat(this.calculateAverage(forecast.forecast_data));
      const days = parseInt(this.forecastDays);
      return (avgSales * days).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },
    
    getReviewDate() {
      const days = Math.min(14, Math.floor(parseInt(this.forecastDays) / 2));
      return `${days} days`;
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
      
      if (highestIndex === 0) return null; // No peak if it's the first day
      
      const peakDate = new Date(forecast.forecast_data[highestIndex].ds);
      return peakDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    },
    
    getMethodLabel() {
      const methods = {
        'linear': 'Linear Trend Analysis',
        'moving-avg': 'Moving Average',
        'seasonal': 'Seasonal Pattern Detection',
        'advanced': 'Advanced Machine Learning'
      };
      return methods[this.forecastMethod] || this.forecastMethod;
    },
    
    getAccuracyClass(forecast) {
      const accuracy = parseFloat(forecast.model_accuracy) || 70;
      if (accuracy >= 85) return 'high';
      if (accuracy >= 70) return 'medium';
      return 'low';
    },
    
    getAccuracyLabel(forecast) {
      const accuracy = parseFloat(forecast.model_accuracy) || 70;
      if (accuracy >= 85) return 'High Accuracy';
      if (accuracy >= 70) return 'Medium Accuracy';
      return 'Low Confidence';
    },
    
    getTrainingDataInfo() {
      if (this.forecasts.length === 0) return '';
      
      const sample = this.forecasts[0];
      if (!sample.training_size && !sample.validation_size) return '';
      
      return `Model trained on ${sample.training_size || 0} data points, validated on ${sample.validation_size || 0} data points`;
    },
    
    getSeasonal(forecast) {
      if (!forecast || (this.forecastMethod !== 'seasonal' && this.forecastMethod !== 'advanced')) {
        return null;
      }
      
      return forecast.seasonal_patterns || forecast.seasonal_info || {
        peak: 'Weekends',
        low: 'Mid-week'
      };
    },
        
    showTooltip(event, point, index) {
      this.tooltipVisible = true;
      
      const date = new Date(point.ds);
      this.tooltipDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
      
      this.tooltipValue = this.forecastType === 'sales' 
        ? `₱${(point.yhat * point.price).toFixed(2)}`
        : `${point.yhat.toFixed(1)} units`;
        
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
      
      // Generate date breakpoints
      const breakpoints = [];
      
      // For shorter periods (7-14 days), show more markers
      if (totalDays <= 14) {
        // Show every other day
        for (let i = 0; i < totalDays; i += 2) {
          const date = new Date(data[i].ds);
          breakpoints.push({
            index: i,
            label: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          });
        }
      } else if (totalDays <= 30) {
        // For medium periods show weekly markers
        for (let i = 0; i < totalDays; i += 7) {
          const date = new Date(data[i].ds);
          breakpoints.push({
            index: i,
            label: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          });
        }
      } else {
        // For longer periods show fewer markers
        const interval = Math.floor(totalDays / 4); // 4 markers spread out
        for (let i = 0; i < totalDays; i += interval) {
          const date = new Date(data[i].ds);
          breakpoints.push({
            index: i,
            label: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          });
        }
      }
      
      // Always show the last date
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
        
        // Map the forecast method correctly
        let method = this.forecastMethod;
        if (method === 'advanced') {
          method = 'prophet';  // Use prophet for advanced
        }
        
        const response = await fetch(`http://localhost:7904/api/admin/forecasts?type=${this.forecastType}&days=${this.forecastDays}&method=${method}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate forecasts');
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.message || 'Failed to generate forecasts');
        }
        
        // Process and normalize the forecast data
        this.forecasts = Object.values(data.data || {}).map(item => {
          // Ensure we have price information for forecasts
          return {
            ...item,
            forecast_data: Array.isArray(item.forecast_data) ? 
              item.forecast_data.map(point => ({
                ...point,
                price: item.price || 100,
                // Ensure forecast values are non-negative
                yhat: Math.max(0, point.yhat),
                yhat_lower: Math.max(0, point.yhat_lower),
                yhat_upper: Math.max(0, point.yhat_upper)
              })) : []
          };
        });
        
        // Add seasonal information from the Python model
        if (this.forecastMethod === 'seasonal' || this.forecastMethod === 'advanced') {
          this.forecasts = this.forecasts.map(forecast => {
            return {
              ...forecast,
              seasonal_info: forecast.seasonal_patterns || {
                peak: 'Weekends',
                low: 'Mid-week'
              }
            };
          });
        }
        
        // Generate date breakpoints if we have forecasts
        if (this.forecasts.length > 0) {
          this.generateDateBreakpoints(this.forecasts[0]);
        }
        
      } catch (error) {
        console.error('Error generating forecasts:', error);
        this.error = error.message || 'Failed to generate forecasts. Please try again.';
      } finally {
        this.isGenerating = false;
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
    }
  }
}
</script>

<style scoped>
.admin-container {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-left: 250px; /* Match sidebar width */
}

.admin-content {
  padding: 2rem;
  margin: 0 auto;
  position: relative;
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

.forecast-type-selector {
  display: flex;
  gap: 0.5rem;
}

.forecast-type-btn {
  padding: 0.75rem 1.25rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  transition: all 0.2s;
}

.forecast-type-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.forecast-period select,
.forecast-method select {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  min-width: 140px;
}

.generate-btn {
  padding: 0.75rem 1.5rem;
  background: #10b981;
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
  background: #059669;
  transform: translateY(-1px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
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

.generating-detail {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 0.5rem;
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

.forecasts-container {
  margin-top: 2rem;
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

.method-badge {
  background-color: #f0fdf4;
  color: #166534;
}

.forecast-explanation {
  margin-bottom: 2rem;
}

.explanation-card {
  background-color: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  gap: 1rem;
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
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.forecast-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transition: transform 0.2s;
}

.forecast-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.forecast-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.forecast-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  padding: 0.5rem;
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

.forecast-chart {
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

.tooltip-date {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.tooltip-value {
  font-weight: 600;
}

.forecast-confidence {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.confidence-label {
  font-size: 0.8rem;
  color: #64748b;
  min-width: 120px;
}

.confidence-meter {
  flex: 1;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.confidence-bar {
  height: 100%;
  background-color: #3b82f6;
  border-radius: 3px;
  transition: width 0.5s;
}

.confidence-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
  min-width: 45px;
  text-align: right;
}

.forecast-recommendations {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
}

.forecast-recommendations h4 {
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

.forecast-seasonal-info {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.forecast-seasonal-info h4 {
  font-size: 0.9rem;
  color: #475569;
  margin: 0 0 0.5rem 0;
}

.seasonal-pattern {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
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

.text-danger {
  color: #dc2626;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .forecast-metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-container {
    padding-left: 60px; /* Match collapsed sidebar width */
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
  
  .forecast-type-selector {
    width: 100%;
  }
  
  .forecast-type-btn {
    flex: 1;
    justify-content: center;
  }
  
  .forecast-period select,
  .forecast-method select {
    width: 100%;
  }
  
  .generate-btn {
    width: 100%;
    justify-content: center;
  }
  
  .forecast-items {
    grid-template-columns: 1fr;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .forecast-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .accuracy-badge {
    align-self: flex-start;
  }
  
  .forecast-metrics {
    grid-template-columns: 1fr;
  }
  
  .metric {
    padding: 0.5rem;
  }
}
</style>