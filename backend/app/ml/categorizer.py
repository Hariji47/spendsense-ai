from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
import pandas as pd

class ExpenseCategorizer:
    def __init__(self):
        self.model = make_pipeline(
            TfidfVectorizer(ngram_range=(1, 2)),
            LogisticRegression(class_weight='balanced')
        )
        self.is_trained = False
        
    def train(self, transactions):
        # Filter only expenses with valid descriptions and categories
        data = [
            {"desc": t.description, "cat": t.category} 
            for t in transactions 
            if t.transaction_type == 'Expense' and t.description and t.category
        ]
        
        if len(data) < 10:
            return False # Need more data to train
            
        df = pd.DataFrame(data)
        
        # Check if we have at least 2 distinct categories
        if df['cat'].nunique() < 2:
            return False
            
        X = df['desc']
        y = df['cat']
        
        self.model.fit(X, y)
        self.is_trained = True
        return True
        
    def predict(self, description):
        if not self.is_trained:
            return None
        return self.model.predict([description])[0]

# Singleton instance
categorizer = ExpenseCategorizer()
