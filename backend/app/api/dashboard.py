from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models.user import User
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from typing import Dict, Any
import pandas as pd
from app.ml.anomaly_detector import anomaly_detector

from app.database.database import get_db
from app.models.transaction import Transaction
from app.models.settings import Settings
from app.utils import get_start_date_from_timeframe

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"]
)

@router.get("/stats")
def get_dashboard_stats(timeframe: str = 'all', db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    start_date = get_start_date_from_timeframe(timeframe)
    
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
        
    # Total expenses
    total_expenses = query.filter(Transaction.transaction_type == "Expense").with_entities(func.sum(Transaction.amount)).scalar() or 0.0
    
    # Total income
    total_income = query.filter(Transaction.transaction_type == "Income").with_entities(func.sum(Transaction.amount)).scalar() or 0.0
    
    # Number of transactions
    total_transactions = query.with_entities(func.count(Transaction.id)).scalar() or 0
    
    # Get settings
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    if settings:
        budget_limit = settings.yearly_budget if timeframe == 'yearly' else settings.monthly_budget
        tier = settings.tier
    else:
        budget_limit = 600000.0 if timeframe == 'yearly' else 50000.0
        tier = 'free'
    
    # Financial Health Score (Pro/Max only)
    health_score = None
    if tier != 'free' and total_transactions >= 5:
        # Base score
        score = 60
        
        # Savings ratio (+20)
        if total_income > 0:
            savings_ratio = (total_income - total_expenses) / total_income
            if savings_ratio > 0.5:
                score += 30
            elif savings_ratio > 0.2:
                score += 20
            elif savings_ratio > 0:
                score += 10
            else:
                score -= 20 # Overspending
                
        # Anomaly penalty
        transactions = query.all()
        anomalies = anomaly_detector.detect_anomalies(transactions)
        score -= (len(anomalies) * 5)
        
        # Diversity check
        expenses = [t for t in transactions if t.transaction_type == 'Expense']
        if expenses:
            df = pd.DataFrame([{"category": t.category} for t in expenses])
            unique_cats = df['category'].nunique()
            if unique_cats > 5:
                score += 10
                
        # Bound score between 0 and 100
        health_score = max(0, min(100, score))
    
    return {
        "totalExpenses": total_expenses,
        "totalIncome": total_income,
        "currentMonthSpending": total_expenses, # Reusing total_expenses as period spending for the UI
        "totalTransactions": total_transactions,
        "healthScore": health_score,
        "budgetLimit": budget_limit
    }
