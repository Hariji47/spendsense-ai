# SpendSense AI

SpendSense AI is a full-stack AI-powered personal finance management application designed to help users track transactions, analyze spending patterns, and gain intelligent financial insights using machine learning.

The application combines a modern React frontend with a FastAPI backend and machine learning models for expense categorization, anomaly detection, and spending forecasting.

## Features

- User registration and authentication
- Personal finance dashboard
- Income and expense tracking
- Add, edit, and delete transactions
- CSV transaction data import
- Interactive financial analytics
- Expense category analysis
- Income vs expense comparison
- AI-powered financial insights
- Automatic expense categorization
- Unusual spending detection
- Future spending forecasts
- User profile management
- Application settings
- Responsive user interface

## Machine Learning Features

### Automatic Expense Categorization

SpendSense AI uses machine learning to classify transactions into appropriate expense categories based on transaction information.

### Anomaly Detection

The application analyzes spending patterns to identify potentially unusual transactions and spending behavior.

### Spending Forecasting

Historical transaction data is analyzed to estimate future spending trends and provide users with useful financial insights.

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- Recharts

### Backend

- Python
- FastAPI
- Pandas
- NumPy
- Scikit-learn
- SQLAlchemy

### Database

- SQLite

### Development & Deployment

- Docker
- Docker Compose
- Git
- GitHub

## Project Structure

```text
spendsense-ai/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── database/
│   │   ├── ml/
│   │   ├── models/
│   │   └── schemas/
│   │
│   ├── scripts/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   │
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md