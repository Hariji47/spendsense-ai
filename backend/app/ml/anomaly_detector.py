from sklearn.ensemble import IsolationForest
import pandas as pd

class AnomalyDetector:
    def __init__(self):
        # contamination sets the expected proportion of outliers
        self.model = IsolationForest(contamination=0.05, random_state=42)
        
    def detect_anomalies(self, transactions):
        # We only care about anomalies in Expenses
        expenses = [t for t in transactions if t.transaction_type == 'Expense']
        if len(expenses) < 50:
            return [] # Need a reasonable baseline to detect anomalies
            
        df = pd.DataFrame([{
            "id": t.id,
            "date": t.date,
            "description": t.description,
            "amount": t.amount,
            "category": t.category
        } for t in expenses])
        
        anomalies = []
        
        # Detect anomalies per category so a high rent doesn't flag as anomalous compared to food
        for cat in df['category'].unique():
            cat_df = df[df['category'] == cat].copy()
            if len(cat_df) < 10:
                continue # Skip categories with too little data
                
            X = cat_df[['amount']]
            preds = self.model.fit_predict(X)
            
            # IsolationForest returns -1 for anomalies, 1 for normal
            cat_df['is_anomaly'] = preds
            
            anomaly_rows = cat_df[cat_df['is_anomaly'] == -1]
            
            for _, row in anomaly_rows.iterrows():
                # Filter out "anomalies" that are actually unusually small amounts, 
                # we usually only care about unusually large spending
                mean_amount = cat_df['amount'].mean()
                if row['amount'] > mean_amount * 1.5: 
                    anomalies.append({
                        "id": row['id'],
                        "date": row['date'],
                        "description": row['description'],
                        "amount": row['amount'],
                        "category": row['category'],
                        "reason": f"Amount ₹{row['amount']} is unusually high for {row['category']} (avg: ₹{mean_amount:.2f})"
                    })
                    
        return sorted(anomalies, key=lambda x: x['date'], reverse=True)

anomaly_detector = AnomalyDetector()
