from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.api.auth import get_current_user
from app.models.user import User
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import pandas as pd
import io
import csv

from app.database.database import get_db
from app.models.transaction import Transaction as TransactionModel
from app.schemas.transaction import Transaction, TransactionCreate, TransactionUpdate
from app.utils import get_start_date_from_timeframe

router = APIRouter(
    prefix="/api/transactions",
    tags=["transactions"]
)

@router.post("/", response_model=Transaction)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transaction = TransactionModel(**transaction.model_dump(), user_id=current_user.id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get("/export")
def export_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(TransactionModel).filter(TransactionModel.user_id == current_user.id).order_by(TransactionModel.date.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Date', 'Description', 'Amount', 'Category', 'Transaction Type'])
    
    # Write data rows
    for txn in transactions:
        writer.writerow([txn.date.strftime("%Y-%m-%d"), txn.description, txn.amount, txn.category, txn.transaction_type])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=spendsense_export.csv"}
    )

@router.get("/", response_model=List[Transaction])
def read_transactions(timeframe: str = 'all', skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    start_date = get_start_date_from_timeframe(timeframe)
    query = db.query(TransactionModel).filter(TransactionModel.user_id == current_user.id)
    
    if start_date:
        query = query.filter(TransactionModel.date >= start_date)
        
    transactions = query.order_by(TransactionModel.date.desc()).offset(skip).limit(limit).all()
    return transactions

@router.put("/{transaction_id}", response_model=Transaction)
def update_transaction(transaction_id: int, transaction: TransactionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transaction = db.query(TransactionModel).filter(TransactionModel.id == transaction_id, TransactionModel.user_id == current_user.id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = transaction.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
        
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/all")
def delete_all_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(TransactionModel).filter(TransactionModel.user_id == current_user.id).delete()
    db.commit()
    return {"ok": True, "message": "All transactions deleted."}

@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transaction = db.query(TransactionModel).filter(TransactionModel.id == transaction_id, TransactionModel.user_id == current_user.id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(db_transaction)
    db.commit()
    return {"ok": True}

@router.post("/upload/validate")
async def validate_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    content = await file.read()
    try:
        # Use pandas to read the CSV
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")
        
    required_columns = {'date', 'description', 'amount', 'category'}
    if not required_columns.issubset(set(df.columns.str.lower())):
        raise HTTPException(
            status_code=400, 
            detail=f"CSV must contain columns: {', '.join(required_columns)}"
        )
        
    # Standardize column names to lower case
    df.columns = df.columns.str.lower()
    
    valid_records = []
    invalid_records = []
    
    # Optional: ensure we have a transaction_type column
    if 'transaction_type' not in df.columns:
        df['transaction_type'] = 'Expense' # Default
        
    # Drop exact duplicate rows
    initial_count = len(df)
    df = df.drop_duplicates()
    duplicate_count = initial_count - len(df)
        
    for index, row in df.iterrows():
        try:
            # Clean and validate row
            amount = float(str(row.get('amount', 0)).replace(',', '').strip())
            
            # Simple missing value check
            if pd.isna(row.get('description')) or pd.isna(row.get('category')) or pd.isna(row.get('date')):
                raise ValueError("Missing required fields")
                
            date_val = pd.to_datetime(row['date']).isoformat()
            
            valid_records.append({
                "date": date_val,
                "description": str(row['description']).strip(),
                "amount": amount,
                "category": str(row['category']).strip(),
                "transaction_type": str(row.get('transaction_type', 'Expense')).strip()
            })
        except Exception as e:
            invalid_records.append({
                "row": index + 2, # +2 for 1-based index and header row
                "data": row.to_dict(),
                "error": str(e)
            })
            
    return {
        "summary": {
            "validCount": len(valid_records),
            "invalidCount": len(invalid_records),
            "duplicateCount": duplicate_count
        },
        "validRecords": valid_records,
        "invalidRecords": invalid_records
    }

@router.post("/upload/confirm")
def confirm_upload(records: List[TransactionCreate], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transactions = []
    for record in records:
        db_transaction = TransactionModel(**record.model_dump(), user_id=current_user.id)
        db.add(db_transaction)
        db_transactions.append(db_transaction)
        
    db.commit()
    return {"message": f"Successfully imported {len(records)} transactions"}
