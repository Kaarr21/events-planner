from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///event_planner.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app)

# Import and create models after db initialization
from models import create_models
Event = create_models(db)

# Routes for Feature 1: Create and View Events
@app.route('/events', methods=['GET'])
def get_events():
    """
    GET /events - Retrieve all events
    Returns: JSON array of all events with their details
    
    How it works:
    1. Query all events from database using Event.query.all()
    2. Convert each event to dictionary format for JSON response
    3. Return as JSON array with HTTP 200 status
    """
    try:
        events = Event.query.all()
        events_data = []
        
        for event in events:
            events_data.append({
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'location': event.location,
                'date': event.date.isoformat() if event.date else None,
                'created_at': event.created_at.isoformat() if event.created_at else None
            })
        
        return jsonify(events_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events', methods=['POST'])
def create_event():
    """
    POST /events - Create a new event
    Expected JSON body: {title, description, location, date}
    Returns: JSON of created event or validation errors
    
    How it works:
    1. Get JSON data from request body
    2. Validate required fields (title, date)
    3. Parse and validate date format and ensure it's in future
    4. Create new Event instance
    5. Save to database using SQLAlchemy session
    6. Return created event as JSON with HTTP 201 status
    """
    try:
        data = request.get_json()
        
        # Validation
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        # Parse and validate date
        date_str = data.get('date')
        if not date_str:
            return jsonify({'error': 'Date is required'}), 400
        
        try:
            event_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            if event_date <= datetime.now():
                return jsonify({'error': 'Date must be in the future'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'}), 400
        
        # Create new event
        new_event = Event(
            title=data.get('title'),
            description=data.get('description', ''),
            location=data.get('location', ''),
            date=event_date
        )
        
        db.session.add(new_event)
        db.session.commit()
        
        # Return created event
        return jsonify({
            'id': new_event.id,
            'title': new_event.title,
            'description': new_event.description,
            'location': new_event.location,
            'date': new_event.date.isoformat(),
            'created_at': new_event.created_at.isoformat()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Routes for Feature 2: View Single Event
@app.route('/events/<int:event_id>', methods=['GET'])
def get_single_event(event_id):
    """
    GET /events/<int:id> - Retrieve a single event by ID
    URL Parameters: event_id (integer) - The ID of the event to retrieve
    Returns: JSON object of the event or 404 if not found
    
    How it works:
    1. Use event_id from URL parameter (Flask automatically converts <int:event_id> to integer)
    2. Query database for event with specific ID using Event.query.get(event_id)
    3. Event.query.get() returns None if no event found with that ID
    4. If event exists, convert to dictionary and return as JSON with 200 status
    5. If event doesn't exist, return 404 error with descriptive message
    
    URL Examples:
    - GET /events/1 -> Returns event with ID 1
    - GET /events/999 -> Returns 404 if no event with ID 999
    """
    try:
        # Query for specific event by ID
        # get() method returns the instance or None if not found
        event = Event.query.get(event_id)
        
        # Check if event exists
        if not event:
            return jsonify({
                'error': f'Event with ID {event_id} not found'
            }), 404
        
        # Convert event to dictionary and return
        event_data = {
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'location': event.location,
            'date': event.date.isoformat() if event.date else None,
            'created_at': event.created_at.isoformat() if event.created_at else None,
            'updated_at': event.updated_at.isoformat() if event.updated_at else None
        }
        
        return jsonify(event_data), 200
    
    except Exception as e:
        # Handle any unexpected errors (like database connection issues)
        return jsonify({'error': str(e)}), 500

# Health check route
@app.route('/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint
    Returns basic status to verify API is running
    """
    return jsonify({'status': 'healthy', 'message': 'Event Planner API is running'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables if they don't exist
    app.run(debug=True, port=5000)
    