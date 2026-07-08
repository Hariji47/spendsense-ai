from sqlalchemy import Column, Integer, Float, Boolean, String, ForeignKey
from app.database.database import Base

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True, nullable=True) # Making nullable=True initially for migration
    monthly_budget = Column(Float, default=50000.0)
    yearly_budget = Column(Float, default=600000.0)
    tier = Column(String, default="free")
    ai_credits = Column(Integer, default=50)
    email_alerts = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    weekly_reports = Column(Boolean, default=True)
