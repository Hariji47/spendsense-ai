from datetime import datetime, timedelta

def get_start_date_from_timeframe(timeframe: str):
    now = datetime.utcnow()
    
    if timeframe == 'weekly':
        return now - timedelta(days=7)
    elif timeframe == 'monthly':
        return now - timedelta(days=30)
    elif timeframe == 'yearly':
        # Start of current year
        return datetime(now.year, 1, 1)
    
    # 'all' or anything else
    return None
