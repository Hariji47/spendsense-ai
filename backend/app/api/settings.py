from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.models.user import User
from app.database.database import get_db
from app.models.settings import Settings
from app.schemas.settings import SettingsUpdate, SettingsResponse

router = APIRouter(
    prefix="/api/settings",
    tags=["settings"]
)

def get_current_settings(db: Session, current_user: User):
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/", response_model=SettingsResponse)
def read_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_current_settings(db, current_user)

@router.put("/", response_model=SettingsResponse)
def update_settings(updates: SettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = get_current_settings(db, current_user)
    
    if updates.monthly_budget is not None:
        settings.monthly_budget = updates.monthly_budget
    if updates.yearly_budget is not None:
        settings.yearly_budget = updates.yearly_budget
    if updates.tier is not None:
        settings.tier = updates.tier
        if updates.tier == "pro":
            settings.ai_credits = 50
        elif updates.tier == "free":
            settings.ai_credits = 0
            
    if updates.email_alerts is not None:
        settings.email_alerts = updates.email_alerts
    if updates.push_notifications is not None:
        settings.push_notifications = updates.push_notifications
    if updates.weekly_reports is not None:
        settings.weekly_reports = updates.weekly_reports
        
    db.commit()
    db.refresh(settings)
    return settings
