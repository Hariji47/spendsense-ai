from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models.user import User
from sqlalchemy.orm import Session
from pydantic import BaseModel

import re
from app.database.database import get_db
from app.models.transaction import Transaction
from app.ml.categorizer import categorizer
from app.ml.anomaly_detector import anomaly_detector
from app.ml.forecaster import forecaster
from app.api.analytics import get_insights
from app.models.settings import Settings

router = APIRouter(
    prefix="/api/ai",
    tags=["ai"]
)

class PredictRequest(BaseModel):
    description: str

@router.post("/train")
def train_models(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    success = categorizer.train(transactions)
    if success:
        return {"message": "Models retrained successfully based on current database."}
    return {"message": "Not enough data to train models."}

@router.post("/predict-category")
def predict_category(req: PredictRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not categorizer.is_trained:
        # Try to train it first time
        transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
        categorizer.train(transactions)
        
    predicted = categorizer.predict(req.description)
    if predicted:
        return {"category": predicted}
    return {"category": None}

@router.get("/anomalies")
def get_anomalies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    anomalies = anomaly_detector.detect_anomalies(transactions)
    return {"anomalies": anomalies}

@router.get("/forecast")
def get_forecast(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    forecast = forecaster.forecast_next_month(transactions)
    return forecast

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat_with_bot(req: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = req.message.lower()
    
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    if not settings:
        return {"response": "System settings not found. Please setup the application."}

    # Credit Enforcement
    if settings.tier == "free":
        return {"response": "Your Free tier does not include AI Chatbot access. Please upgrade to Pro or Max."}
    elif settings.tier == "pro":
        if settings.ai_credits <= 0:
            return {"response": "🚨 **Out of AI Credits!** You have exhausted your 50 credits for this month. Upgrade to the **Max Tier** for unlimited AI access!"}
        # Deduct a credit
        settings.ai_credits -= 1
        db.commit()

    import random
    from sqlalchemy import extract
    import datetime
    now = datetime.datetime.utcnow()

    # 1. Dynamic Greetings
    if re.search(r'^(hi|hello|hey|greetings|yo)\b', msg):
        greetings = [
            "Hello! I am your SpendSense AI Assistant. How can I help you today?",
            "Hi there! Ready to look at some finances?",
            "Hey! What would you like to know about your budget or spending?"
        ]
        return {"response": random.choice(greetings) + "\n\nTry asking me:\n- 'How much did I spend on Food?'\n- 'What was my biggest expense?'\n- 'Am I over budget?'"}

    # 2. Specific Category Extraction
    category_match = re.search(r'\b(?:spend|spent|spending) (?:on|in|for) ([a-z]+)\b', msg)
    if category_match:
        category_name = category_match.group(1).title()
        
        # Query specific category
        cat_expenses = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == 'Expense',
            Transaction.category.ilike(f'%{category_name}%')
        ).all()
        
        if not cat_expenses:
            return {"response": f"I couldn't find any expenses in the **{category_name}** category."}
            
        total_cat = sum(t.amount for t in cat_expenses)
        return {"response": f"You have spent a total of **₹{total_cat:,.2f}** on **{category_name}**."}

    # 3. Largest / Biggest Expense
    if re.search(r'\b(biggest|largest|highest|maximum) (?:expense|purchase|transaction)\b', msg):
        biggest = db.query(Transaction).filter(Transaction.user_id == current_user.id, Transaction.transaction_type == 'Expense').order_by(Transaction.amount.desc()).first()
        if biggest:
            return {"response": f"Your largest expense so far is **₹{biggest.amount:,.2f}** for **{biggest.description}** in the {biggest.category} category, on {biggest.date.strftime('%b %d, %Y')}."}
        return {"response": "You don't have any expenses yet!"}

    # 4. Total Spent / Balance Status
    if re.search(r'\b(total spent|current balance|status|how much money|have left)\b', msg):
        settings_budget = settings.monthly_budget if settings else 50000.0
        
        current_expenses = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == 'Expense',
            extract('year', Transaction.date) == now.year,
            extract('month', Transaction.date) == now.month
        ).all()
        
        total_spent = sum(t.amount for t in current_expenses)
        remaining = settings_budget - total_spent
        
        return {"response": f"This month you have spent **₹{total_spent:,.2f}**.\nYour monthly budget is **₹{settings_budget:,.2f}**.\nYou have **₹{remaining:,.2f}** remaining."}

    # 5. Intent: Forecast / Predict
    if re.search(r'\b(predict|forecast|future|next month|will i spend)\b', msg):
        forecast = get_forecast(db, current_user)
        if "error" in forecast:
            return {"response": f"I tried to calculate a forecast, but ran into an issue: {forecast['error']}. We might need a few more months of data!"}
        
        predicted = forecast.get('predicted_next_month')
        if predicted is not None:
            return {"response": f"Based on my Machine Learning models analyzing your past trends, I predict your spending for next month will be approximately **₹{predicted:,.2f}**. Keep an eye on your budget!"}
        return {"response": "I don't have enough multi-month data yet to generate a reliable forecast. Keep tracking!"}

    # 6. Intent: Anomalies / Unusual
    if re.search(r'\b(anomaly|anomalies|unusual|weird|strange|outlier)\b', msg):
        anomalies_res = get_anomalies(db, current_user)
        anoms = anomalies_res.get('anomalies', [])
        if not anoms:
            return {"response": "I ran my Isolation Forest algorithm on your transactions and didn't find any highly unusual spending patterns. You're doing great!"}
        
        top = anoms[0]
        return {"response": f"I found {len(anoms)} unusual transaction(s). For example, there was an unusually high expense of **₹{top['amount']}** in the **{top['category']}** category on {top['date']}. Watch out for these spikes!"}

    # 7. Intent: Analytics / Insights / Highest
    if re.search(r'\b(analyze|analysis|insight|insights|trend|most)\b', msg):
        insights_res = get_insights(db, current_user)
        insights_list = insights_res.get('insights', [])
        if not insights_list:
            return {"response": "I need a bit more data before I can provide deep insights."}
        
        bullet_points = "\n".join([f"- {i}" for i in insights_list])
        return {"response": f"Here is what my analysis of your data shows:\n\n{bullet_points}"}

    # 8. Intent: Budget Limit
    if re.search(r'\b(budget|limit|overspending|overspend)\b', msg):
        settings_budget = settings.monthly_budget if settings else 50000.0
        
        current_expenses = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == 'Expense',
            extract('year', Transaction.date) == now.year,
            extract('month', Transaction.date) == now.month
        ).all()
        
        total_spent = sum(t.amount for t in current_expenses)
        percent = (total_spent / settings_budget) * 100
        
        if percent > 100:
            return {"response": f"🚨 **Warning!** You have spent **₹{total_spent:,.2f}** this month, which exceeds your monthly budget of **₹{settings_budget:,.2f}**! You are at **{percent:.0f}%** of your budget. Time to cut back!"}
        elif percent > 80:
            return {"response": f"⚠️ **Careful!** You have spent **₹{total_spent:,.2f}** this month, which is **{percent:.0f}%** of your **₹{settings_budget:,.2f}** budget. You only have **₹{(settings_budget - total_spent):,.2f}** left."}
        else:
            return {"response": f"✅ You are doing great! You have spent **₹{total_spent:,.2f}** this month, which is only **{percent:.0f}%** of your **₹{settings_budget:,.2f}** budget. Keep it up!"}

    # 9. Intent: Subscriptions
    if re.search(r'\b(subscription|recurring|netflix|rent|gym)\b', msg):
        from app.api.subscriptions import get_subscriptions
        subs = get_subscriptions(db, current_user)
        if not subs['subscriptions']:
            return {"response": "I didn't find any recurring subscriptions in your history."}
        return {"response": f"You currently have {len(subs['subscriptions'])} active subscriptions, costing you approximately **₹{subs['total_fixed_cost_monthly']:,.2f}** every month. Your biggest fixed cost is {subs['subscriptions'][0]['name']} at ₹{subs['subscriptions'][0]['amount']}."}

    # 10. Default Greeting / Fallback
    return {
        "response": "I'm not quite sure how to answer that! Try asking me:\n- 'How much did I spend on Food?'\n- 'What was my biggest expense?'\n- 'Am I over budget?'\n- 'What are my subscriptions?'"
    }
