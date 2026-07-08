import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np
from datetime import datetime
from dateutil.relativedelta import relativedelta

class SpendingForecaster:
    def __init__(self):
        self.model = LinearRegression()
        
    def forecast_next_month(self, transactions):
        expenses = [t for t in transactions if t.transaction_type == 'Expense']
        if len(expenses) < 100:
            return {"status": "insufficient_data", "message": "More transaction history is required to generate reliable predictions."}
            
        df = pd.DataFrame([{"date": t.date, "amount": t.amount} for t in expenses])
        df['date'] = pd.to_datetime(df['date'])
        
        # Group by month
        monthly = df.groupby(df['date'].dt.to_period('M'))['amount'].sum().reset_index()
        
        if len(monthly) < 3:
            return {"status": "insufficient_data", "message": "Need at least 3 months of data to generate a reliable forecast."}
            
        # Create a simple time index for linear regression (0, 1, 2, ...)
        monthly['time_idx'] = np.arange(len(monthly))
        
        X = monthly[['time_idx']]
        y = monthly['amount']
        
        self.model.fit(X, y)
        
        # Predict next month (current length)
        next_time_idx = len(monthly)
        prediction = self.model.predict([[next_time_idx]])[0]
        
        # Get next month string
        last_period = monthly['date'].iloc[-1]
        next_period = last_period + 1
        next_month_str = next_period.strftime('%B %Y')
        
        return {
            "status": "success",
            "forecast_month": next_month_str,
            "predicted_amount": max(0, float(prediction)), # Ensure no negative predictions
            "historical_avg": float(y.mean()),
            "trend": "up" if self.model.coef_[0] > 0 else "down"
        }

forecaster = SpendingForecaster()
