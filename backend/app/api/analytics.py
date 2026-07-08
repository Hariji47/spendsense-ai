from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models.user import User
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
import numpy as np
from fastapi.responses import StreamingResponse
import io
from fpdf import FPDF

from app.database.database import get_db
from app.models.transaction import Transaction
from app.utils import get_start_date_from_timeframe

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"]
)

@router.get("/charts")
def get_charts_data(timeframe: str = 'all', db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    start_date = get_start_date_from_timeframe(timeframe)
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
        
    transactions = query.all()
    if not transactions:
        return {"category_data": [], "monthly_trend": [], "income_vs_expense": []}
    
    # Convert to Pandas DataFrame for easier aggregation
    df = pd.DataFrame([{
        "date": t.date,
        "amount": t.amount,
        "category": t.category,
        "type": t.transaction_type
    } for t in transactions])
    
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.strftime('%b %Y') # e.g. Jan 2024
    
    # 1. Spending by Category (Donut Chart)
    expenses_df = df[df['type'] == 'Expense']
    category_data = []
    if not expenses_df.empty:
        cat_grouped = expenses_df.groupby('category')['amount'].sum().reset_index()
        category_data = [{"name": row['category'], "value": row['amount']} for _, row in cat_grouped.iterrows()]
    
    # 2. Monthly Trend (Line Chart)
    monthly_trend = []
    if not expenses_df.empty:
        # Group by year-month to keep chronological order, then format
        trend_grouped = expenses_df.groupby(df['date'].dt.to_period('M'))['amount'].sum().reset_index()
        trend_grouped['month'] = trend_grouped['date'].dt.strftime('%b %Y')
        monthly_trend = [{"month": row['month'], "amount": row['amount']} for _, row in trend_grouped.iterrows()]
        
    # 3. Income vs Expense (Bar Chart)
    inc_exp_grouped = df.groupby(['month', 'type'])['amount'].sum().unstack(fill_value=0).reset_index()
    # Sort chronologically by recreating period
    inc_exp_grouped['period'] = pd.to_datetime(inc_exp_grouped['month'], format='%b %Y').dt.to_period('M')
    inc_exp_grouped = inc_exp_grouped.sort_values('period')
    
    income_vs_expense = []
    for _, row in inc_exp_grouped.iterrows():
        income = row.get('Income', 0)
        expense = row.get('Expense', 0)
        income_vs_expense.append({
            "month": row['month'],
            "Income": float(income),
            "Expense": float(expense)
        })
        
    return {
        "category_data": category_data,
        "monthly_trend": monthly_trend,
        "income_vs_expense": income_vs_expense
    }

@router.get("/insights")
def get_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id, Transaction.transaction_type == 'Expense').all()
    if len(transactions) < 2:
        return {"insights": ["Not enough expense data to generate insights. Keep adding transactions!"]}
        
    df = pd.DataFrame([{
        "date": t.date,
        "amount": t.amount,
        "category": t.category
    } for t in transactions])
    
    df['date'] = pd.to_datetime(df['date'])
    df['month_period'] = df['date'].dt.to_period('M')
    
    insights = []
    
    # 1. Highest spending category overall
    cat_totals = df.groupby('category')['amount'].sum()
    highest_cat = cat_totals.idxmax()
    highest_amount = cat_totals.max()
    insights.append(f"Your highest spending category overall is {highest_cat} (₹{highest_amount:,.2f}).")
    
    # 2. Month over Month comparison
    monthly_totals = df.groupby('month_period')['amount'].sum().sort_index()
    if len(monthly_totals) >= 2:
        last_month = monthly_totals.iloc[-2]
        this_month = monthly_totals.iloc[-1]
        
        if last_month > 0:
            pct_change = ((this_month - last_month) / last_month) * 100
            trend_word = "increased" if pct_change > 0 else "decreased"
            insights.append(f"Your spending {trend_word} by {abs(pct_change):.1f}% compared to the previous month.")
            
    # 3. Largest single transaction
    largest_idx = df['amount'].idxmax()
    largest_txn = df.loc[largest_idx]
    insights.append(f"Your largest single expense was ₹{largest_txn['amount']:,.2f} for '{largest_txn['category']}' on {largest_txn['date'].strftime('%b %d, %Y')}.")
    
    return {"insights": insights}

@router.get("/tax-report")
def generate_tax_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Define categories that are typically tax-deductible (business, healthcare, education, etc.)
    deductible_categories = ['Healthcare', 'Education', 'Bills & Utilities']
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == 'Expense',
        Transaction.category.in_(deductible_categories)
    ).all()
    
    total_deductible = sum(t.amount for t in transactions)
    
    # Create PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", style="B", size=16)
    
    # Header
    pdf.cell(200, 10, txt=f"SpendSense - Tax Deductible Expenses", ln=True, align='C')
    pdf.set_font("Helvetica", size=12)
    pdf.cell(200, 10, txt=f"Generated for: {current_user.full_name} ({current_user.email})", ln=True, align='C')
    pdf.ln(10)
    
    # Summary
    pdf.set_font("Helvetica", style="B", size=14)
    pdf.cell(200, 10, txt=f"Total Deductible Amount: Rs. {total_deductible:,.2f}", ln=True, align='L')
    pdf.ln(5)
    
    # Table Header
    pdf.set_font("Helvetica", style="B", size=12)
    pdf.cell(40, 10, "Date", border=1)
    pdf.cell(80, 10, "Description", border=1)
    pdf.cell(40, 10, "Category", border=1)
    pdf.cell(30, 10, "Amount", border=1, ln=True)
    
    # Table Rows
    pdf.set_font("Helvetica", size=10)
    for t in transactions:
        pdf.cell(40, 10, t.date.strftime("%Y-%m-%d"), border=1)
        # Limit description length to fit column
        desc = (t.description[:35] + '..') if len(t.description) > 35 else t.description
        pdf.cell(80, 10, desc, border=1)
        pdf.cell(40, 10, t.category, border=1)
        pdf.cell(30, 10, f"Rs. {t.amount:,.2f}", border=1, ln=True)
    
    # Return as StreamingResponse
    pdf_bytes = pdf.output(dest='S')
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=tax_report_{current_user.full_name.replace(' ', '_')}.pdf"}
    )
