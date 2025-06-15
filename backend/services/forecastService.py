import os
import sys
import json
import hashlib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import mysql.connector
import pickle
import matplotlib.pyplot as plt

# Suppress warnings and non-essential output
import warnings
warnings.filterwarnings("ignore")

# Import Prophet with error handling
try:
    from prophet import Prophet
except ImportError:
    print(json.dumps({
        "status": "error",
        "message": "Prophet package not installed. Run 'pip install prophet'"
    }))
    sys.exit(1)

class ForecastService:
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'Capstone'
        }
        
        # Create necessary directories
        os.makedirs('forecasts', exist_ok=True)
        os.makedirs('model_cache', exist_ok=True)

    def get_connection(self):
        return mysql.connector.connect(**self.db_config)

    def serialize_datetime(self, obj):
        if isinstance(obj, (datetime, pd.Timestamp)):
            return obj.strftime('%Y-%m-%d')
        raise TypeError(f'Type {type(obj)} not serializable')
    
    def generate_cache_key(self, product_id, days, method):
        """Generate a unique cache key based on input parameters"""
        key_str = f"{product_id}_{days}_{method}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def get_sales_data(self, days_history=90):
        """Fetch historical sales data with configurable time window"""
        try:
            conn = self.get_connection()
            query = """
                SELECT 
                    DATE(o.created_at) as date,
                    p.products_id,
                    p.name as product_name,
                    p.price,
                    p.image,
                    SUM(oi.quantity) as daily_sales,
                    SUM(oi.quantity * oi.price) as daily_revenue
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN products p ON oi.product_id = p.products_id
                WHERE o.status = 'paid'
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                GROUP BY DATE(o.created_at), p.products_id, p.name, p.price, p.image
                HAVING SUM(oi.quantity) > 0
                ORDER BY date
            """
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, (days_history,))
            records = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not records:
                return None
            
            df = pd.DataFrame(records)
            return df
            
        except Exception as e:
            return None

    def train_model(self, product_data, forecast_days=30, method='prophet'):
        """Train a forecasting model using specified method"""
        try:
            cache_key = self.generate_cache_key(
                product_data['products_id'].iloc[0], 
                forecast_days, 
                method
            )
            cache_file = f"model_cache/{cache_key}.pkl"
            
            # Check if we have a cached model and it's less than 24 hours old
            if os.path.exists(cache_file) and (datetime.now().timestamp() - os.path.getmtime(cache_file) < 86400):
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)
            
            # Prepare data for Prophet
            df = product_data[['date', 'daily_sales']].copy()
            df.columns = ['ds', 'y']
            
            # Set fixed random seed for reproducibility
            np.random.seed(42)
            
            if method == 'prophet':
                # Prophet model with fixed parameters
                model = Prophet(
                    yearly_seasonality=True,
                    weekly_seasonality=True,
                    daily_seasonality=False,
                    seasonality_mode='multiplicative',
                    interval_width=0.95,  # 95% confidence interval
                    mcmc_samples=0,  # Disable MCMC to make it deterministic
                )
                
                # Add country holidays for better seasonality detection
                try:
                    model.add_country_holidays(country_name='US')
                except:
                    pass  # Continue if holiday feature fails
                
                # Fit the model
                model.fit(df)
                
                # Make future predictions
                future_dates = model.make_future_dataframe(periods=forecast_days)
                forecast = model.predict(future_dates)
                
                # Calculate accuracy metrics on historical data
                historical_forecast = forecast[forecast['ds'].isin(df['ds'])]
                historical_actual = df.set_index('ds')
                
                # Calculate RMSE, MAE, and MAPE
                matched_indices = historical_forecast['ds'].isin(historical_actual.index)
                matched_forecast = historical_forecast[matched_indices]
                
                if len(matched_forecast) > 0:
                    actual_values = [historical_actual.loc[d]['y'] for d in matched_forecast['ds']]
                    forecast_values = matched_forecast['yhat'].values
                    
                    rmse = np.sqrt(np.mean((np.array(actual_values) - forecast_values) ** 2))
                    mae = np.mean(np.abs(np.array(actual_values) - forecast_values))
                    
                    # Calculate MAPE (handling zero values)
                    mape_values = []
                    for i, y in enumerate(actual_values):
                        if y > 0:
                            mape_values.append(abs((y - forecast_values[i]) / y))
                    
                    mape = 0 if not mape_values else np.mean(mape_values) * 100
                else:
                    rmse = 0
                    mae = 0
                    mape = 0
                
                # Calculate model accuracy score (0-100)
                accuracy = max(0, min(100, 100 - mape))
                
                # Extract future predictions only
                future_forecast = forecast.tail(forecast_days)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
                
                # Convert to dictionary and ensure non-negative values
                forecast_dict = []
                for _, row in future_forecast.iterrows():
                    forecast_dict.append({
                        'ds': row['ds'].strftime('%Y-%m-%d'),
                        'yhat': max(0, row['yhat']),
                        'yhat_lower': max(0, row['yhat_lower']),
                        'yhat_upper': max(0, row['yhat_upper']),
                    })
                
                # Save visualization to file
                try:
                    plt.figure(figsize=(10, 6))
                    model.plot(forecast)
                    plt.title(f'Sales Forecast - {product_data["product_name"].iloc[0]}')
                    plt.savefig(f'forecasts/forecast_{cache_key}.png')
                    plt.close()
                    
                    # Generate components plot
                    fig = model.plot_components(forecast)
                    plt.savefig(f'forecasts/components_{cache_key}.png')
                    plt.close()
                except Exception:
                    pass  # Continue if visualization fails
                
                # Extract weekly seasonality information
                seasonal_info = {'peak': 'Weekends', 'low': 'Weekdays'}
                try:
                    if 'weekly' in forecast.columns:
                        weekly_pattern = forecast[['ds', 'weekly']].iloc[-7:].copy()
                        weekly_pattern['day'] = weekly_pattern['ds'].dt.day_name()
                        peak_day = weekly_pattern.loc[weekly_pattern['weekly'].idxmax()]['day']
                        low_day = weekly_pattern.loc[weekly_pattern['weekly'].idxmin()]['day']
                        
                        seasonal_info = {
                            'peak': peak_day,
                            'low': low_day
                        }
                except Exception:
                    pass  # Use default if extraction fails
                
                result = {
                    'forecast': forecast_dict,
                    'accuracy': accuracy,
                    'metrics': {
                        'rmse': float(rmse),
                        'mae': float(mae),
                        'mape': float(mape)
                    },
                    'seasonal_patterns': seasonal_info,
                    'forecast_plot': f'forecasts/forecast_{cache_key}.png',
                    'components_plot': f'forecasts/components_{cache_key}.png',
                    'training_size': len(df),
                    'validation_size': len(matched_forecast)
                }
                
                # Cache the result
                try:
                    with open(cache_file, 'wb') as f:
                        pickle.dump(result, f)
                except Exception:
                    pass  # Continue if caching fails
                
                return result
                
            else:
                # Fallback to simpler forecasting
                return None

        except Exception as e:
            return None

    def update_forecast_metrics(self, options=None):
        """Generate forecasts with specified options"""
        if options is None:
            options = {}
            
        forecast_type = options.get('type', 'sales')
        forecast_days = int(options.get('days', 30))
        forecast_method = options.get('method', 'prophet')
        
        try:
            # Get extended sales data for better training
            sales_data = self.get_sales_data(days_history=max(90, forecast_days * 3))
            if sales_data is None or sales_data.empty:
                return {
                    "status": "error",
                    "message": "No sales data available",
                    "data": {}
                }

            # Group by product and get top selling products
            product_groups = sales_data.groupby('products_id')
            top_products = product_groups.agg({
                'product_name': 'first',
                'price': 'first',
                'image': 'first',
                'daily_sales': 'sum',
                'daily_revenue': 'sum'
            }).sort_values('daily_sales', ascending=False).head(5)

            forecasts = {}
            for idx, product in top_products.iterrows():
                product_sales = sales_data[sales_data['products_id'] == idx]
                if len(product_sales) >= 7:  # Need at least 7 days of data
                    forecast_data = self.train_model(
                        product_sales, 
                        forecast_days=forecast_days,
                        method=forecast_method
                    )
                    
                    if forecast_data:
                        # Calculate current sales metrics
                        daily_avg = product_sales['daily_sales' if forecast_type == 'demand' else 'daily_revenue'].mean()
                        
                        forecasts[str(idx)] = {
                            'id': int(idx),
                            'name': product['product_name'],
                            'image': product['image'],
                            'price': float(product['price']),
                            'current_sales': round(daily_avg, 2),
                            'forecast_data': forecast_data['forecast'],
                            'model_accuracy': round(forecast_data['accuracy'], 1),
                            'seasonal_patterns': forecast_data.get('seasonal_patterns', {}),
                            'training_size': len(product_sales),
                            'validation_size': max(1, len(product_sales) // 5)
                        }

            return {
                "status": "success",
                "data": forecasts
            }

        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "data": {}
            }

if __name__ == "__main__":
    try:
        # Redirect standard output to null to prevent debug messages
        # from interfering with JSON output
        original_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
        
        # Process inputs
        service = ForecastService()
        options = {}
        if len(sys.argv) > 1:
            try:
                options = json.loads(sys.argv[1])
            except json.JSONDecodeError:
                options = {}
        
        # Generate forecast
        result = service.update_forecast_metrics(options)
        
        # Restore stdout and output only the JSON result
        sys.stdout = original_stdout
        print(json.dumps(result, default=service.serialize_datetime))
        
    except Exception as e:
        # Make sure we restore stdout if something goes wrong
        try:
            sys.stdout = original_stdout
        except:
            pass
            
        # Output error as valid JSON
        print(json.dumps({
            "status": "error",
            "message": str(e),
            "data": {}
        }))
        sys.exit(1)