from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app.api import transactions, dashboard, analytics, ai, subscriptions, settings, auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SpendSense AI API")

os.makedirs("uploads/avatars", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(subscriptions.router)
app.include_router(settings.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SpendSense AI API"}
