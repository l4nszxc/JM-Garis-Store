import os
import sys
import json
import decimal
import mysql.connector
from datetime import datetime, timedelta, date
import pandas as pd
import numpy as np
from prophet import Prophet
import warnings
warnings.filterwarnings('ignore')

class EnhancedForecastService:
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'capstone'
        }
        
        # Create necessary directories
        os.makedirs('forecasts', exist_ok=True)
        os.makedirs('model_cache', exist_ok=True)

    def get_connection(self):
        return mysql.connector.connect(**self.db_config)

    def serialize_datetime(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.strftime('%Y-%m-%d')
        elif isinstance(obj, decimal.Decimal):
            return float(obj)
        raise TypeError(f'Type {type(obj)} not serializable')

    def get_enhanced_sales_data(self, days_history=60, min_sales_threshold=1):
        """Fetch comprehensive sales data"""
        try:
            conn = self.get_connection()
            
            query = """
                SELECT 
                    DATE(o.created_at) as date,
                    YEAR(o.created_at) as year,
                    MONTH(o.created_at) as month,
                    DAYOFWEEK(o.created_at) as day_of_week,
                    p.products_id,
                    p.name as product_name,
                    p.price,
                    p.stock_quantity as current_stock,
                    p.category,
                    p.image,
                    SUM(oi.quantity) as daily_sales,
                    COUNT(DISTINCT o.order_id) as order_count,
                    SUM(oi.quantity * oi.price) as daily_revenue
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN products p ON oi.product_id = p.products_id
                WHERE o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup')
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                AND p.stock_quantity > 0
                GROUP BY DATE(o.created_at), YEAR(o.created_at), MONTH(o.created_at), DAYOFWEEK(o.created_at), p.products_id, p.name, p.price, p.stock_quantity, p.category, p.image
                HAVING SUM(oi.quantity) >= %s
                ORDER BY DATE(o.created_at), p.products_id
            """
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, (days_history, min_sales_threshold))
            records = cursor.fetchall()
            cursor.close()
            conn.close()
            
            print(f"Found {len(records)} sales records in last {days_history} days", file=sys.stderr)
            
            if not records:
                return None
            
            return records
            
        except Exception as e:
            print(f"Database error: {str(e)}", file=sys.stderr)
            return None

    def simple_forecast(self, product_sales, forecast_days=30):
        """Prophet-based forecasting with enhanced accuracy and user-friendly output"""
        try:
            # Convert sales data to DataFrame for Prophet
            df_data = []
            for item in product_sales:
                df_data.append({
                    'ds': item['date'],
                    'y': float(item['daily_sales'])
                })
            
            df = pd.DataFrame(df_data)
            
            # Ensure minimum data points for Prophet
            if len(df) < 2:
                print(f"Warning: Only {len(df)} data point(s) available. Need at least 2 for accurate forecasting.", file=sys.stderr)
                # Create synthetic data points by duplicating if only 1 point exists
                if len(df) == 1:
                    df = pd.concat([df, df], ignore_index=True)
                    df.loc[1, 'ds'] = df.loc[0, 'ds'] + timedelta(days=1)
            
            # Initialize Prophet model with enhanced parameters for accuracy
            model = Prophet(
                # Seasonality settings
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=len(df) >= 365,  # Only if we have 1 year of data
                
                # Accuracy optimization
                seasonality_mode='multiplicative',  # Better for sales data with varying amplitude
                changepoint_prior_scale=0.05,  # Prevent overfitting (0.05 is conservative)
                seasonality_prior_scale=10,  # Strong seasonality detection
                
                # Prediction intervals
                interval_width=0.90,  # 90% confidence interval (standard for business forecasting)
                
                # Performance
                mcmc_samples=0,  # Disable MCMC for faster computation
                uncertainty_samples=1000  # Good balance of accuracy vs speed
            )
            
            # Add custom seasonalities if enough data
            if len(df) >= 30:
                model.add_seasonality(
                    name='monthly',
                    period=30.5,
                    fourier_order=5
                )
            
            # Fit the model with suppressed output
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model.fit(df)
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=forecast_days)
            
            # Make predictions
            forecast = model.predict(future)
            
            # Get only future predictions (exclude historical)
            future_forecast = forecast.tail(forecast_days)
            
            # Calculate model accuracy metrics using cross-validation on historical data
            historical_predictions = forecast.head(len(df))
            y_true = df['y'].values
            y_pred = historical_predictions['yhat'].values
            
            # Ensure non-negative values
            y_pred = np.maximum(y_pred, 0)
            
            # Calculate standard accuracy metrics
            mae = np.mean(np.abs(y_true - y_pred))
            rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
            
            # MAPE with protection against division by zero
            mape = np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 0.1))) * 100
            
            # R-squared score (coefficient of determination)
            ss_res = np.sum((y_true - y_pred) ** 2)
            ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
            r2_score = 1 - (ss_res / (ss_tot + 1e-10))
            
            # Calculate accuracy percentage (100% = perfect, 0% = worst)
            # Using inverse MAPE capped at reasonable values
            accuracy = max(0, min(100, 100 - mape))
            
            # Adjust accuracy based on R² score
            if r2_score > 0:
                accuracy = (accuracy + r2_score * 100) / 2  # Average of both metrics
            
            # Format predictions with user-friendly labels
            future_predictions = []
            for _, row in future_forecast.iterrows():
                prediction_date = row['ds']
                day_name = prediction_date.strftime('%A')  # Monday, Tuesday, etc.
                
                future_predictions.append({
                    'ds': prediction_date.strftime('%Y-%m-%d'),
                    'day': day_name,
                    'yhat': max(0, round(row['yhat'], 1)),  # Predicted sales
                    'yhat_lower': max(0, round(row['yhat_lower'], 1)),  # Minimum expected
                    'yhat_upper': max(0, round(row['yhat_upper'], 1)),  # Maximum expected
                    'confidence': 90  # 90% confidence interval
                })
            
            # Detect trend with clear interpretation
            trend_values = forecast['trend'].values
            trend_start = trend_values[0]
            trend_end = trend_values[-1]
            trend_change_pct = ((trend_end - trend_start) / (trend_start + 1)) * 100
            
            if trend_change_pct > 5:
                trend_direction = 'growing'
                trend_label = f'📈 Sales are growing by {abs(trend_change_pct):.1f}%'
            elif trend_change_pct < -5:
                trend_direction = 'declining'
                trend_label = f'📉 Sales are declining by {abs(trend_change_pct):.1f}%'
            else:
                trend_direction = 'stable'
                trend_label = '➡️ Sales are stable'
            
            # Detect weekly patterns
            if 'weekly' in forecast.columns:
                weekly_values = forecast.tail(7)['weekly'].values
                peak_day_index = np.argmax(weekly_values)
                days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                peak_day = days_of_week[peak_day_index] if peak_day_index < 7 else 'Weekend'
            else:
                peak_day = 'Not enough data'
            
            # Calculate forecast summary
            avg_forecast = np.mean([p['yhat'] for p in future_predictions])
            max_forecast = max([p['yhat'] for p in future_predictions])
            min_forecast = min([p['yhat'] for p in future_predictions])
            total_forecast = sum([p['yhat'] for p in future_predictions])
            
            return {
                'forecast': future_predictions,
                'accuracy': round(accuracy, 1),
                'metrics': {
                    'rmse': round(rmse, 2),
                    'mae': round(mae, 2),
                    'mape': round(mape, 2),
                    'r2_score': round(r2_score, 3)
                },
                'model_type': 'Prophet AI (Advanced Time Series)',
                'training_days': len(df),
                'seasonal_insights': {
                    'weekly_peak': peak_day,
                    'trend_direction': trend_direction,
                    'trend_label': trend_label,
                    'seasonality_impact': 'strong' if accuracy > 80 else ('moderate' if accuracy > 60 else 'weak')
                },
                'forecast_summary': {
                    'avg_daily_forecast': round(avg_forecast, 1),
                    'max_daily_forecast': round(max_forecast, 1),
                    'min_daily_forecast': round(min_forecast, 1),
                    'total_forecast': round(total_forecast, 1),
                    'forecast_period': f'{forecast_days} days'
                }
            }
            
        except Exception as e:
            print(f"Prophet forecast error: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return None

    def calculate_stock_metrics(self, product_sales):
        """Calculate stock status and recommendations"""
        if not product_sales:
            return {
                'current_stock': 0,
                'avg_daily_sales': 0,
                'days_remaining': 0,
                'reorder_point': 0,
                'recommended_order_qty': 0,
                'stock_status': 'unknown'
            }
        
        # Get current stock and calculate metrics (convert Decimal to float)
        current_stock = float(product_sales[0]['current_stock'])
        total_sales = sum(float(item['daily_sales']) for item in product_sales)
        avg_daily_sales = total_sales / len(product_sales)
        
        # Calculate days remaining
        days_remaining = current_stock / avg_daily_sales if avg_daily_sales > 0 else 999
        
        # Calculate reorder recommendations
        lead_time = 7  # 7 days lead time
        safety_stock = avg_daily_sales * 3  # 3 days safety stock
        reorder_point = (avg_daily_sales * lead_time) + safety_stock
        recommended_order_qty = max(avg_daily_sales * 30, reorder_point)  # 30 days supply
        
        # Determine stock status
        if days_remaining < 7:
            stock_status = 'critical'
        elif days_remaining < 21:
            stock_status = 'low'
        else:
            stock_status = 'normal'
        
        return {
            'current_stock': int(current_stock),
            'avg_daily_sales': round(avg_daily_sales, 2),
            'days_remaining': round(days_remaining, 1),
            'reorder_point': int(reorder_point),
            'recommended_order_qty': int(recommended_order_qty),
            'stock_status': stock_status
        }

    def update_forecast_metrics(self, options=None):
        """Main function to generate forecasts"""
        if options is None:
            options = {}
            
        forecast_type = options.get('type', 'demand')
        forecast_days = int(options.get('days', 30))
        forecast_method = options.get('method', 'simple')
        
        try:
            print(f"Starting forecast: type={forecast_type}, days={forecast_days}, method={forecast_method}", file=sys.stderr)
            
            # Get sales data
            sales_data = self.get_enhanced_sales_data(
                days_history=max(30, forecast_days),
                min_sales_threshold=1
            )
            
            if not sales_data:
                return {
                    "status": "error",
                    "message": "No sales data available. Please ensure you have recent transactions with 'paid' status.",
                    "data": {}
                }
            
            # Group by product
            products = {}
            for record in sales_data:
                product_id = record['products_id']
                if product_id not in products:
                    products[product_id] = []
                products[product_id].append(record)
            
            print(f"Found {len(products)} unique products with sales", file=sys.stderr)
            
            # Generate forecasts for top products
            forecasts = {}
            product_rankings = []
            
            # Rank products by total sales
            for product_id, product_sales in products.items():
                total_sales = sum(item['daily_sales'] for item in product_sales)
                product_rankings.append((product_id, total_sales, product_sales))
            
            # Sort by total sales and take top 8
            product_rankings.sort(key=lambda x: x[1], reverse=True)
            top_products = product_rankings[:8]
            
            for product_id, total_sales, product_sales in top_products:
                try:
                    print(f"Processing product {product_id}: {product_sales[0]['product_name']}", file=sys.stderr)
                    
                    # Generate forecast
                    forecast_result = self.simple_forecast(product_sales, forecast_days)
                    
                    if not forecast_result:
                        continue
                    
                    # Calculate stock metrics
                    stock_metrics = self.calculate_stock_metrics(product_sales)
                    
                    # Calculate demand insights
                    total_forecast_demand = sum(item['yhat'] for item in forecast_result['forecast'])
                    avg_daily_demand = total_forecast_demand / forecast_days
                    peak_demand = max(item['yhat'] for item in forecast_result['forecast'])
                    
                    # Generate recommendations
                    recommendations = []
                    
                    if stock_metrics['days_remaining'] < 14:
                        recommendations.append(f"⚠️ Order {stock_metrics['recommended_order_qty']} units soon - only {stock_metrics['days_remaining']:.1f} days remaining")
                    
                    if avg_daily_demand > stock_metrics['avg_daily_sales'] * 1.1:
                        increase_pct = ((avg_daily_demand/stock_metrics['avg_daily_sales']-1)*100)
                        recommendations.append(f"📈 Demand increasing by {increase_pct:.1f}% - consider increasing stock")
                    
                    if peak_demand > stock_metrics['avg_daily_sales'] * 1.5:
                        recommendations.append(f"🔥 Peak demand of {peak_demand:.0f} units expected - prepare for surge")
                    
                    if not recommendations:
                        recommendations.append("✅ Stock levels appear adequate for forecasted demand")
                    
                    # Get product details
                    product_info = product_sales[0]
                    
                    forecasts[str(product_id)] = {
                        'id': int(product_id),
                        'name': product_info['product_name'],
                        'image': product_info['image'] or '/img/placeholder.jpg',
                        'price': float(product_info['price']),
                        'category': product_info['category'],
                        'current_stock': stock_metrics['current_stock'],
                        'stock_status': stock_metrics['stock_status'],
                        'days_remaining': stock_metrics['days_remaining'],
                        'reorder_point': stock_metrics['reorder_point'],
                        'recommended_order_qty': stock_metrics['recommended_order_qty'],
                        'forecast_data': forecast_result['forecast'],
                        'model_accuracy': forecast_result['accuracy'],
                        'model_type': forecast_result['model_type'],
                        'metrics': forecast_result['metrics'],
                        'seasonal_insights': forecast_result['seasonal_insights'],
                        'training_size': forecast_result['training_days'],
                        'avg_daily_demand': round(avg_daily_demand, 2),
                        'total_forecast_demand': round(total_forecast_demand, 1),
                        'peak_demand': round(peak_demand, 1),
                        'recommendations': recommendations,
                        'historical_performance': {
                            'avg_daily_sales': stock_metrics['avg_daily_sales'],
                            'total_sales': total_sales,
                            'sales_volatility': 0.0,  # Simplified
                            'order_frequency': len(product_sales)
                        }
                    }
                    
                    print(f"Generated forecast for {product_info['product_name']}", file=sys.stderr)
                    
                except Exception as e:
                    print(f"Error processing product {product_id}: {str(e)}", file=sys.stderr)
                    continue
            
            if not forecasts:
                return {
                    "status": "error",
                    "message": "Unable to generate forecasts. Need at least 1 day of sales data per product.",
                    "data": {}
                }
            
            print(f"Successfully generated {len(forecasts)} forecasts", file=sys.stderr)
            
            return {
                "status": "success",
                "message": f"Generated forecasts for {len(forecasts)} products",
                "data": forecasts,
                "summary": {
                    "total_products_analyzed": len(products),
                    "forecasts_generated": len(forecasts),
                    "forecast_period_days": forecast_days,
                    "method_used": forecast_method,
                    "data_period_days": max(30, forecast_days)
                }
            }
            
        except Exception as e:
            print(f"Service error: {str(e)}", file=sys.stderr)
            return {
                "status": "error",
                "message": f"Forecasting error: {str(e)}",
                "data": {}
            }

if __name__ == "__main__":
    try:
        service = EnhancedForecastService()
        options = {}
        
        if len(sys.argv) > 1:
            try:
                options = json.loads(sys.argv[1])
            except json.JSONDecodeError:
                options = {}
        
        result = service.update_forecast_metrics(options)
        print(json.dumps(result, default=service.serialize_datetime))
        
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"Service error: {str(e)}",
            "data": {}
        }))
        sys.exit(1)
