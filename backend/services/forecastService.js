const db = require('../config/db');

class ForecastService {
    async updateForecastMetrics(options = {}) {
        try {
            const { type = 'sales', days = 30 } = options;
            
            // Get sales data for past 90 days (more historical data for better training)
            const [salesData] = await db.execute(`
                SELECT 
                    DATE(o.created_at) as date,
                    p.products_id,
                    p.name as product_name,
                    p.image,
                    SUM(oi.quantity) as daily_sales,
                    SUM(oi.price * oi.quantity) as daily_revenue
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN products p ON oi.product_id = p.products_id
                WHERE o.status = 'paid'
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
                GROUP BY DATE(o.created_at), p.products_id, p.name, p.image
                HAVING SUM(oi.quantity) > 0
                ORDER BY date
            `);
            
            if (!salesData.length) {
                return {
                    status: "error",
                    message: "No sales data found in the last 90 days"
                };
            }

            // Group by product and organize time-series data
            const productSales = {};
            
            salesData.forEach(record => {
                if (!productSales[record.products_id]) {
                    productSales[record.products_id] = {
                        id: record.products_id,
                        name: record.product_name,
                        image: record.image,
                        dates: [],
                        sales: [],
                        revenue: [],
                        total_sales: 0,
                        total_revenue: 0
                    };
                }
                
                const date = new Date(record.date);
                productSales[record.products_id].dates.push(date);
                productSales[record.products_id].sales.push(Number(record.daily_sales));
                productSales[record.products_id].revenue.push(Number(record.daily_revenue));
                productSales[record.products_id].total_sales += Number(record.daily_sales);
                productSales[record.products_id].total_revenue += Number(record.daily_revenue);
            });
            
            // Sort products by total sales and get top 5
            const topProducts = Object.values(productSales)
                .sort((a, b) => b.total_sales - a.total_sales)
                .slice(0, 5);
            
            // Generate forecasts using statistical models
            const forecasts = {};
            
            for (const product of topProducts) {
                if (product.sales.length >= 7) { // Need at least 1 week of data
                    // Split data into training (80%) and validation (20%) sets
                    const trainingSize = Math.floor(product.sales.length * 0.8);
                    
                    const trainingDates = product.dates.slice(0, trainingSize);
                    const trainingValues = type === 'sales' ? 
                        product.revenue.slice(0, trainingSize) : 
                        product.sales.slice(0, trainingSize);
                    
                    const validationDates = product.dates.slice(trainingSize);
                    const validationValues = type === 'sales' ?
                        product.revenue.slice(trainingSize) :
                        product.sales.slice(trainingSize);
                    
                    // Train the model (using moving average with trend detection)
                    const model = this.trainTimeSeriesModel(trainingDates, trainingValues);
                    
                    // Evaluate model accuracy using validation set
                    const accuracy = this.evaluateModel(model, validationDates, validationValues);
                    
                    // Generate future forecast
                    const forecastData = this.generateForecast(
                        product.dates, 
                        type === 'sales' ? product.revenue : product.sales,
                        model,
                        parseInt(days)
                    );
                    
                    forecasts[product.id] = {
                        id: product.id,
                        name: product.name,
                        image: product.image,
                        current_sales: type === 'sales' 
                            ? (product.total_revenue / product.dates.length).toFixed(2)
                            : Math.round(product.total_sales / product.dates.length),
                        forecast_data: forecastData,
                        model_accuracy: accuracy,
                        training_size: trainingSize,
                        validation_size: product.sales.length - trainingSize
                    };
                }
            }
            
            return {
                status: "success",
                data: forecasts
            };
            
        } catch (error) {
            console.error("Forecast error:", error);
            return {
                status: "error",
                message: error.message,
                data: {}
            };
        }
    }
    
    trainTimeSeriesModel(dates, values) {
        // Simple but effective time series model with multiple components
        
        // 1. Calculate trend using linear regression
        const trend = this.calculateTrend(dates, values);
        
        // 2. Extract seasonality (weekly patterns)
        const seasonality = this.extractSeasonality(dates, values);
        
        // 3. Calculate moving averages of different window sizes
        const movingAverages = {
            short: this.calculateMovingAverage(values, 3),  // 3-day MA
            medium: this.calculateMovingAverage(values, 7), // 7-day MA
            long: this.calculateMovingAverage(values, 14)   // 14-day MA
        };
        
        // 4. Detect anomalies and outliers
        const outliers = this.detectOutliers(values);
        
        // 5. Calculate volatility (standard deviation over time)
        const volatility = this.calculateVolatility(values);
        
        return {
            trend,
            seasonality,
            movingAverages,
            outliers,
            volatility,
            // Used for forecasting
            lastValue: values[values.length - 1],
            lastDate: dates[dates.length - 1]
        };
    }
    
    calculateTrend(dates, values) {
        // Linear regression to detect trend
        const n = values.length;
        
        // Convert dates to numerical x values (days since first date)
        const x = dates.map(date => 
            (new Date(date) - new Date(dates[0])) / (1000 * 60 * 60 * 24)
        );
        const y = values;
        
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
        }
        
        const xMean = sumX / n;
        const yMean = sumY / n;
        
        // Calculate slope and intercept
        let slope = 0;
        if (sumX2 - sumX * xMean !== 0) {
            slope = (sumXY - sumX * yMean) / (sumX2 - sumX * xMean);
        }
        const intercept = yMean - slope * xMean;
        
        // Calculate R-squared (coefficient of determination)
        let totalSS = 0;
        let residualSS = 0;
        
        for (let i = 0; i < n; i++) {
            const predicted = slope * x[i] + intercept;
            totalSS += Math.pow(y[i] - yMean, 2);
            residualSS += Math.pow(y[i] - predicted, 2);
        }
        
        const rSquared = totalSS === 0 ? 0 : 1 - (residualSS / totalSS);
        
        return {
            slope,
            intercept,
            rSquared
        };
    }
    
    extractSeasonality(dates, values) {
        // Extract day-of-week patterns (weekly seasonality)
        const dayOfWeekSums = new Array(7).fill(0); // Sun-Sat
        const dayOfWeekCounts = new Array(7).fill(0);
        
        dates.forEach((date, i) => {
            const dayOfWeek = new Date(date).getDay();
            dayOfWeekSums[dayOfWeek] += values[i];
            dayOfWeekCounts[dayOfWeek]++;
        });
        
        // Calculate average value for each day of week
        const dayOfWeekAvgs = dayOfWeekSums.map((sum, day) => 
            dayOfWeekCounts[day] === 0 ? 0 : sum / dayOfWeekCounts[day]
        );
        
        // Calculate the overall average
        const overallAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
        
        // Calculate seasonality factors (relative to average)
        const seasonalityFactors = dayOfWeekAvgs.map(avg => 
            overallAvg === 0 ? 1 : avg / overallAvg
        );
        
        return {
            factors: seasonalityFactors,
            strength: this.calculateSeasonalityStrength(values, dates, seasonalityFactors)
        };
    }
    
    calculateSeasonalityStrength(values, dates, seasonalityFactors) {
        // Measure how strong the weekly pattern is (0-1)
        if (values.length < 14) return 0; // Need at least 2 weeks of data
        
        const deseasonalized = [];
        
        for (let i = 0; i < values.length; i++) {
            const dayOfWeek = new Date(dates[i]).getDay();
            const factor = seasonalityFactors[dayOfWeek];
            deseasonalized.push(factor === 0 ? values[i] : values[i] / factor);
        }
        
        // Calculate variance of original and deseasonalized data
        const originalVar = this.calculateVariance(values);
        const deseasonalizedVar = this.calculateVariance(deseasonalized);
        
        // Strength is reduction in variance
        return originalVar === 0 ? 0 : Math.max(0, Math.min(1, 1 - (deseasonalizedVar / originalVar)));
    }
    
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    }
    
    calculateMovingAverage(values, window) {
        const result = [];
        
        for (let i = 0; i < values.length; i++) {
            if (i < window - 1) {
                result.push(null); // Not enough data yet
            } else {
                let sum = 0;
                for (let j = 0; j < window; j++) {
                    sum += values[i - j];
                }
                result.push(sum / window);
            }
        }
        
        return result;
    }
    
    detectOutliers(values) {
        // Use IQR (Interquartile Range) method to detect outliers
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        const outliers = [];
        
        values.forEach((value, index) => {
            if (value < lowerBound || value > upperBound) {
                outliers.push({
                    index,
                    value,
                    severity: Math.abs((value - (q1 + q3) / 2) / iqr)
                });
            }
        });
        
        return {
            count: outliers.length,
            items: outliers,
            percentage: values.length > 0 ? (outliers.length / values.length) * 100 : 0
        };
    }
    
    calculateVolatility(values) {
        if (values.length <= 1) return 0;
        
        // Calculate percentage changes
        const changes = [];
        for (let i = 1; i < values.length; i++) {
            if (values[i-1] !== 0) {
                changes.push((values[i] - values[i-1]) / Math.abs(values[i-1]));
            }
        }
        
        if (changes.length === 0) return 0;
        
        // Standard deviation of changes
        const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
        const stdDev = Math.sqrt(
            changes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / changes.length
        );
        
        return stdDev;
    }
    
    evaluateModel(model, validationDates, validationValues) {
        if (!validationDates.length) return { mape: 0, rmse: 0 };
        
        // Make predictions for validation period
        const predictions = [];
        
        for (let i = 0; i < validationDates.length; i++) {
            const date = validationDates[i];
            const daysSinceStart = (new Date(date) - new Date(model.lastDate)) / (1000 * 60 * 60 * 24);
            
            // Calculate trend component
            const trendValue = model.trend.intercept + model.trend.slope * 
                ((new Date(date) - new Date(model.lastDate)) / (1000 * 60 * 60 * 24) + 1);
            
            // Calculate seasonality component
            const dayOfWeek = new Date(date).getDay();
            const seasonalFactor = model.seasonality.factors[dayOfWeek];
            
            // Baseline prediction with trend and seasonality
            let prediction = trendValue * seasonalFactor;
            
            // Ensure prediction is not negative
            prediction = Math.max(0, prediction);
            
            predictions.push(prediction);
        }
        
        // Calculate error metrics
        let sumAbsPercentError = 0;
        let sumSquaredError = 0;
        let countValidPredictions = 0;
        
        for (let i = 0; i < validationValues.length; i++) {
            const actual = validationValues[i];
            const predicted = predictions[i];
            
            if (actual !== 0) {
                sumAbsPercentError += Math.abs((actual - predicted) / actual);
                countValidPredictions++;
            }
            
            sumSquaredError += Math.pow(actual - predicted, 2);
        }
        
        // Mean Absolute Percentage Error
        const mape = countValidPredictions > 0 
            ? (sumAbsPercentError / countValidPredictions) * 100 
            : 0;
        
        // Root Mean Squared Error
        const rmse = Math.sqrt(sumSquaredError / validationValues.length);
        
        return {
            mape, // Lower is better, e.g., 10% means predictions are off by 10% on average
            rmse,  // Lower is better, in same units as original data
            predictions
        };
    }
    
    generateForecast(historicalDates, historicalValues, model, forecastDays) {
        // Generate forecast for specified number of days
        const forecastData = [];
        const lastDate = historicalDates[historicalDates.length - 1];
        
        for (let i = 1; i <= forecastDays; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setDate(forecastDate.getDate() + i);
            
            // Calculate trend component
            const trendValue = model.trend.intercept + model.trend.slope * i;
            
            // Calculate seasonality component
            const dayOfWeek = forecastDate.getDay();
            const seasonalFactor = model.seasonality.factors[dayOfWeek];
            
            // Base forecast with trend and seasonality
            let forecast = trendValue * seasonalFactor;
            
            // Add some uncertainty based on volatility
            const uncertaintyRange = model.volatility * forecast;
            const lowerBound = Math.max(0, forecast - uncertaintyRange);
            const upperBound = forecast + uncertaintyRange;
            
            // Add small random variation for realistic forecasts
            const randomVariation = (Math.random() * 0.1 - 0.05) * forecast;
            forecast += randomVariation;
            
            // Ensure forecast is not negative
            forecast = Math.max(0, forecast);
            
            forecastData.push({
                ds: forecastDate.toISOString().split('T')[0],
                yhat: forecast,
                yhat_lower: lowerBound,
                yhat_upper: upperBound,
                confidence: this.calculateConfidence(model, forecast, i)
            });
        }
        
        return forecastData;
    }
    
    calculateConfidence(model, forecast, daysAhead) {
        // Calculate confidence based on model quality and prediction distance
        const baseConfidence = Math.max(0, Math.min(100, 100 - (model.volatility * 100)));
        
        // Confidence decreases with forecast distance
        const distanceFactor = Math.max(0, 1 - (daysAhead / 60)); // Drops to 0 after 60 days
        
        // Confidence affected by data quality
        const dataQualityFactor = 1 - (model.outliers.percentage / 100);
        
        // Confidence affected by R-squared of trend
        const trendQualityFactor = Math.max(0.5, model.trend.rSquared);
        
        return Math.round(baseConfidence * distanceFactor * dataQualityFactor * trendQualityFactor);
    }
}

module.exports = new ForecastService();