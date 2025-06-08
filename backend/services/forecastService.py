import pandas as pd
from prophet import Prophet
import mysql.connector
from datetime import datetime, timedelta
import json
import os
import sys
import matplotlib.pyplot as plt

class ForecastService:
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'Capstone'
        }
        
        os.makedirs('forecasts', exist_ok=True)

    def get_connection(self):
        return mysql.connector.connect(**self.db_config)

    def serialize_datetime(self, obj):
        if isinstance(obj, (datetime, pd.Timestamp)):
            return obj.strftime('%Y-%m-%d')
        raise TypeError(f'Type {type(obj)} not serializable')

    def get_sales_data(self):
        try:
            conn = self.get_connection()
            query = """
                SELECT 
                    DATE(o.created_at) as date,
                    p.products_id,
                    p.name as product_name,
                    p.image,  # Changed from p.image as product_image
                    SUM(oi.quantity) as daily_sales
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN products p ON oi.product_id = p.products_id
                WHERE o.status = 'paid'
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(o.created_at), p.products_id, p.name, p.image
                HAVING SUM(oi.quantity) > 0
                ORDER BY date
            """
            
            df = pd.read_sql(query, conn)
            conn.close()
            
            if df.empty:
                print(json.dumps({
                    "status": "error",
                    "message": "No sales data found in the last 30 days"
                }))
                return None
                
            print(json.dumps({
                "status": "success",
                "message": f"Retrieved {len(df)} sales records for {df['products_id'].nunique()} products"
            }))
            
            return df
            
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "message": f"Database error: {str(e)}"
            }))
            return None

    def train_model(self, product_data):
        try:
            df = product_data[['date', 'daily_sales']].copy()
            df.columns = ['ds', 'y']
            
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode='multiplicative'
            )
            
            model.fit(df)
            future_dates = model.make_future_dataframe(periods=30)
            forecast = model.predict(future_dates)

            # Convert Timestamp to string format
            forecast_dict = forecast.tail(30)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records')
            for item in forecast_dict:
                item['ds'] = item['ds'].strftime('%Y-%m-%d')

            # Save forecast plot
            plt.figure(figsize=(10, 6))
            model.plot(forecast)
            plt.title('Sales Forecast')
            plt.savefig(f'forecasts/forecast_plot.png')
            plt.close()

            return {
                'forecast': forecast_dict,
                'forecast_plot': 'forecasts/forecast_plot.png'
            }

        except Exception as e:
            print(json.dumps({
                "status": "error",
                "message": f"Error training model: {str(e)}"
            }))
            return None

    def update_forecast_metrics(self):
        try:
            # Get sales data
            sales_data = self.get_sales_data()
            if sales_data is None or sales_data.empty:
                return {
                    "status": "error",
                    "message": "No sales data available",
                    "data": {}
                }

            # Group by product and get total sales
            top_products = sales_data.groupby('products_id').agg({
                'product_name': 'first',
                'daily_sales': 'sum'
            }).sort_values('daily_sales', ascending=False).head(5)

            print(json.dumps({
                "status": "info",
                "message": f"Processing {len(top_products)} top products"
            }))

            forecasts = {}
            for idx, product in top_products.iterrows():
                product_sales = sales_data[sales_data['products_id'] == idx]
                if len(product_sales) >= 7:  # Need at least 7 days of data
                    forecast_data = self.train_model(product_sales)
                    if forecast_data:
                        forecasts[str(idx)] = {
                            'name': product['product_name'],
                            'image': product_sales['image'].iloc[0],  # Changed from product['product_image']
                            'current_sales': int(product['daily_sales']),
                            'forecast_data': forecast_data
                        }

            result = {
                "status": "success",
                "data": forecasts
            }

            # Use custom JSON encoder for datetime objects
            print(json.dumps(result, default=self.serialize_datetime))
            return result

        except Exception as e:
            error_result = {
                "status": "error",
                "message": str(e),
                "data": {}
            }
            print(json.dumps(error_result))
            return error_result

if __name__ == "__main__":
    try:
        service = ForecastService()
        result = service.update_forecast_metrics()
        print(json.dumps(result, default=service.serialize_datetime))
        sys.stdout.flush()
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e),
            "data": {}
        }))
        sys.exit(1)