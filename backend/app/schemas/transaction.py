from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TransactionBase(BaseModel):
    date: datetime
    description: str = Field(min_length=1)
    amount: float = Field(gt=0)
    category: str = Field(min_length=1)
    transaction_type: str = Field(pattern='^(Expense|Income)$')

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    date: Optional[datetime] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    transaction_type: Optional[str] = Field(None, pattern='^(Expense|Income)$')

class Transaction(TransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
