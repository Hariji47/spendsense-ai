from pydantic import BaseModel

class SettingsBase(BaseModel):
    monthly_budget: float
    yearly_budget: float
    tier: str
    ai_credits: int
    email_alerts: bool
    push_notifications: bool
    weekly_reports: bool

class SettingsCreate(SettingsBase):
    pass

class SettingsUpdate(BaseModel):
    monthly_budget: float | None = None
    yearly_budget: float | None = None
    tier: str | None = None
    ai_credits: int | None = None
    email_alerts: bool | None = None
    push_notifications: bool | None = None
    weekly_reports: bool | None = None

class SettingsResponse(SettingsBase):
    id: int

    class Config:
        from_attributes = True
