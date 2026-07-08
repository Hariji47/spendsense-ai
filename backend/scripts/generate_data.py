import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_synthetic_data(num_records=5000, output_path="synthetic_transactions.csv"):
    categories = {
        'Food': ['Swiggy', 'Zomato', 'Dominos Pizza', 'McDonalds', 'Local Bakery', 'Starbucks', 'Cafe Coffee Day'],
        'Transportation': ['Uber', 'Ola', 'Metro Card Recharge', 'Petrol Pump', 'Indian Railways'],
        'Shopping': ['Amazon', 'Flipkart', 'Myntra', 'Reliance Digital', 'DMart', 'Zara'],
        'Entertainment': ['Netflix', 'Spotify', 'Amazon Prime', 'PVR Cinemas', 'BookMyShow'],
        'Bills & Utilities': ['Electricity Bill', 'Water Bill', 'Jio Recharge', 'Airtel Broadband', 'Gas Cylinder'],
        'Healthcare': ['Apollo Pharmacy', 'Practo Consultation', 'Hospital Bill', 'Dental Checkup'],
        'Travel': ['MakeMyTrip', 'Indigo Airlines', 'Hotel Taj', 'Oyo Rooms'],
        'Rent': ['Monthly Rent'],
        'Salary': ['Tech Corp Salary', 'Freelance Gig', 'Consulting Fee']
    }
    
    category_weights = {
        'Food': 0.25,
        'Transportation': 0.20,
        'Shopping': 0.15,
        'Entertainment': 0.10,
        'Bills & Utilities': 0.10,
        'Healthcare': 0.05,
        'Travel': 0.05,
        'Rent': 0.05,
        'Salary': 0.05
    }
    
    start_date = datetime.now() - timedelta(days=730) # 2 years ago
    
    records = []
    
    cats = list(category_weights.keys())
    weights = list(category_weights.values())
    
    for _ in range(num_records):
        cat = random.choices(cats, weights=weights, k=1)[0]
        desc = random.choice(categories[cat])
        
        # Determine amount based on category
        if cat == 'Salary':
            amount = round(random.uniform(30000, 150000), 2)
            txn_type = 'Income'
        elif cat == 'Rent':
            amount = round(random.uniform(10000, 30000), 2)
            txn_type = 'Expense'
        elif cat == 'Travel':
            amount = round(random.uniform(2000, 15000), 2)
            txn_type = 'Expense'
        else:
            amount = round(random.uniform(100, 3000), 2)
            txn_type = 'Expense'
            
        # Add some anomalies occasionally
        if random.random() < 0.02 and txn_type == 'Expense' and cat not in ['Rent']:
            amount = amount * random.uniform(5, 10) # 5x to 10x normal amount
            amount = round(amount, 2)
            
        # Random date within last 2 years
        random_days = random.randint(0, 730)
        txn_date = start_date + timedelta(days=random_days)
        
        records.append({
            'date': txn_date.strftime('%Y-%m-%d'),
            'description': desc,
            'amount': amount,
            'category': cat,
            'transaction_type': txn_type
        })
        
    df = pd.DataFrame(records)
    # Sort by date
    df = df.sort_values('date')
    df.to_csv(output_path, index=False)
    print(f"Generated {num_records} transactions to {output_path}")

if __name__ == "__main__":
    generate_synthetic_data()
