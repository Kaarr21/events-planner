from datetime import datetime

class Event:
    """
    Event model - this is a base class that will be converted to SQLAlchemy model
    """
    pass

class EventGuest:
    """
    EventGuest model - this is a base class that will be converted to SQLAlchemy model
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
        
        # Relationship to RSVPs
        rsvps = db.relationship('EventGuest', backref='event', lazy=True, cascade='all, delete-orphan')
        
        def __init__(self, title, description='', location='', date=None):
            """Initialize a new Event instance"""
            self.title = title
            self.description = description
            self.location = location
            self.date = date
        
        def __repr__(self):
            """String representation of Event for debugging"""
            return f'<Event {self.id}: {self.title} on {self.date}>'
        
        def to_dict(self):
            """Convert Event instance to dictionary for JSON serialization"""
            return {
                'id': self.id,
                'title': self.title,
                'description': self.description,
                'location': self.location,
                'date': self.date.isoformat() if self.date else None,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }
        
        def get_rsvp_summary(self):
            """Get RSVP summary for this event"""
            yes_count = len([r for r in self.rsvps if r.rsvp_status == 'Yes'])
            no_count = len([r for r in self.rsvps if r.rsvp_status == 'No'])
            maybe_count = len([r for r in self.rsvps if r.rsvp_status == 'Maybe'])
            
            return {
                'total': len(self.rsvps),
                'yes': yes_count,
                'no': no_count,
                'maybe': maybe_count
            }
    
    class EventGuest(db.Model):
        """
        EventGuest model - represents an RSVP to an event
        This is an association model that connects events with guest responses
        """
        __tablename__ = 'event_guests'
        
        # Primary key
        id = db.Column(db.Integer, primary_key=True)
        
        # Foreign key to Event
        event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
        
        # Guest information (for now, we'll use simple fields)
        # In a real app with authentication, this would be user_id
        guest_name = db.Column(db.String(100), nullable=False)
        guest_email = db.Column(db.String(200), nullable=False)
        
        # RSVP details
        rsvp_status = db.Column(db.String(10), nullable=False)  # 'Yes', 'No', 'Maybe'
        note_to_host = db.Column(db.Text, default='')
        
        # Metadata
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
        
        # Unique constraint to prevent duplicate RSVPs from same email for same event
        __table_args__ = (
            db.UniqueConstraint('event_id', 'guest_email', name='unique_event_guest_email'),
        )
        
        def __init__(self, event_id, guest_name, guest_email, rsvp_status, note_to_host=''):
            """
            Initialize a new EventGuest (RSVP) instance
            
            Args:
                event_id (int): ID of the event
                guest_name (str): Name of the guest
                guest_email (str): Email of the guest
                rsvp_status (str): 'Yes', 'No', or 'Maybe'
                note_to_host (str, optional): Optional note to the host
            """
            self.event_id = event_id
            self.guest_name = guest_name
            self.guest_email = guest_email
            self.rsvp_status = rsvp_status
            self.note_to_host = note_to_host
        
        def __repr__(self):
            """String representation for debugging"""
            return f'<EventGuest {self.guest_name} - {self.rsvp_status} for Event {self.event_id}>'
        
        def to_dict(self):
            """Convert EventGuest instance to dictionary for JSON serialization"""
            return {
                'id': self.id,
                'event_id': self.event_id,
                'guest_name': self.guest_name,
                'guest_email': self.guest_email,
                'rsvp_status': self.rsvp_status,
                'note_to_host': self.note_to_host,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }
        
        @classmethod
        def get_rsvp_by_email_and_event(cls, event_id, guest_email):
            """
            Get existing RSVP for a guest at a specific event
            
            Args:
                event_id (int): Event ID
                guest_email (str): Guest email
                
            Returns:
                EventGuest or None: Existing RSVP if found
            """
            return cls.query.filter_by(event_id=event_id, guest_email=guest_email).first()
        
        @classmethod
        def get_rsvps_for_event(cls, event_id):
            """
            Get all RSVPs for a specific event
            
            Args:
                event_id (int): Event ID
                
            Returns:
                list: List of EventGuest instances
            """
            return cls.query.filter_by(event_id=event_id).all()
        
        def save(self):
            """Save the current RSVP to database"""
            db.session.add(self)
            db.session.commit()
        
        def delete(self):
            """Delete the current RSVP from database"""
            db.session.delete(self)
            db.session.commit()
    
    return Event, EventGuest
