from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models.user import User
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np

from app.database.database import get_db
from app.models.transaction import Transaction

router = APIRouter(
    prefix="/api/subscriptions",
    tags=["subscriptions"]
)

@router.get("/")
def get_subscriptions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id, Transaction.transaction_type == 'Expense').all()
    if not transactions:
        return {"subscriptions": [], "total_fixed_cost": 0}
        
    df = pd.DataFrame([{
        "date": t.date,
        "amount": t.amount,
        "description": t.description.strip(),
        "category": t.category
    } for t in transactions])
    
    df['date'] = pd.to_datetime(df['date'])
    df['desc_lower'] = df['description'].str.lower()
    
    detected_subs = []
    
    # Group by description
    grouped = df.groupby('desc_lower')
    
    for name, group in grouped:
        if len(group) >= 2:
            # Sort chronologically
            group = group.sort_values('date')
            
            # Calculate days between transactions
            group['days_diff'] = group['date'].diff().dt.days
            
            # If standard deviation of amount is very low (e.g. constant amount)
            # OR if average days between is around 30, flag as subscription
            avg_days = group['days_diff'].mean()
            amount_std = group['amount'].std()
            avg_amount = group['amount'].mean()
            
            is_recurring_name = any(keyword in name.lower() for keyword in ['subscription', 'rent', 'bill', 'insurance', 'gym'])
            
            # Allow some tolerance for weekends/holidays or force if name implies it
            is_monthly = (15 <= avg_days <= 45) or is_recurring_name
            is_yearly = 330 <= avg_days <= 400
            
            # Subscriptions usually have identical amounts, but we allow more variance for mocked data
            is_fixed_amount = pd.isna(amount_std) or (amount_std / avg_amount) < 0.5 or is_recurring_name
            
            if (is_monthly or is_yearly) and is_fixed_amount:
                last_date = group['date'].max()
                frequency = "Monthly" if is_monthly else "Yearly"
                
                # Estimate next date
                if is_monthly:
                    next_date = last_date + pd.DateOffset(months=1)
                else:
                    next_date = last_date + pd.DateOffset(years=1)
                    
                detected_subs.append({
                    "name": group['description'].iloc[0],
                    "category": group['category'].iloc[0],
                    "amount": float(avg_amount),
                    "frequency": frequency,
                    "last_paid": last_date.strftime("%Y-%m-%d"),
                    "next_due": next_date.strftime("%Y-%m-%d")
                })
                
    # Calculate total monthly fixed costs
    total_monthly = sum(s['amount'] for s in detected_subs if s['frequency'] == 'Monthly')
    total_yearly_monthly_equivalent = sum(s['amount']/12 for s in detected_subs if s['frequency'] == 'Yearly')
    total_fixed = total_monthly + total_yearly_monthly_equivalent
    
    return {
        "subscriptions": detected_subs,
        "total_fixed_cost_monthly": float(total_fixed)
    }
