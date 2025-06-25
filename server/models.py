from datetime import datetime

class Event:
    """
    Event model - this is a base class that will be converted to SQLAlchemy model
    """
    pass

def create_models(db):
    """
    Create SQLAlchemy models with the database instance
    This function should be called from app.py after db is initialized
    """
    
    class Event(db.Model):
        # Define table name explicitly
        __tablename__ = 'events'
        
        # Primary key
        id = db.Column(db.Integer, primary_key=True)
        
        # Event details
        title = db.Column(db.String(200), nullable=False)
        description = db.Column(db.Text, default='')
        location = db.Column(db.String(300), default='')
        date = db.Column(db.DateTime, nullable=False)
        
        # Metadata
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
        
        def __init__(self, title, description='', location='', date=None):
            """
            Initialize a new Event instance
            
            Args:
                title (str): The event title
                description (str, optional): Event description
                location (str, optional): Event location
                date (datetime): Event date and time
            """
            self.title = title
            self.description = description
            self.location = location
            self.date = date
        
        def __repr__(self):
            """String representation of Event for debugging"""
            return f'<Event {self.id}: {self.title} on {self.date}>'
        
        def to_dict(self):
            """
            Convert Event instance to dictionary for JSON serialization
            
            Returns:
                dict: Dictionary representation of the event
            """
            return {
                'id': self.id,
                'title': self.title,
                'description': self.description,
                'location': self.location,
                'date': self.date.isoformat() if self.date else None,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }
        
        @classmethod
        def get_all_events(cls):
            """
            Class method to get all events
            
            Returns:
                list: List of all Event instances
            """
            return cls.query.all()
        
        @classmethod
        def get_event_by_id(cls, event_id):
            """
            Get event by ID
            
            Args:
                event_id (int): The event ID
                
            Returns:
                Event or None: Event instance if found, None otherwise
            """
            return cls.query.get(event_id)
        
        def save(self):
            """Save the current event to database"""
            db.session.add(self)
            db.session.commit()
        
        def delete(self):
            """Delete the current event from database"""
            db.session.delete(self)
            db.session.commit()
    
    return Event
    