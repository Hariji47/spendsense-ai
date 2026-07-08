from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.database.database import Base
from datetime import datetime

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True, nullable=True) # Making nullable=True initially for migration
    date = Column(DateTime, default=datetime.utcnow)
    description = Column(String, index=True)
    amount = Column(Float)
    category = Column(String, index=True)
    transaction_type = Column(String, index=True) # "Expense" or "Income"
    created_at = Column(DateTime, default=datetime.utcnow)
