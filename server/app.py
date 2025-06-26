from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import datetime
import os
import re

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
Event, EventGuest = create_models(db)

# Validation helper functions
def validate_email(email):
    """Simple email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_rsvp_status(status):
    """Validate RSVP status"""
    return status in ['Yes', 'No', 'Maybe']

# Routes for Feature 1: Create and View Events
@app.route('/events', methods=['GET'])
def get_events():
    """GET /events - Retrieve all events"""
    try:
        events = Event.query.all()
        events_data = []
        
        for event in events:
            event_dict = event.to_dict()
            # Add RSVP summary to each event
            event_dict['rsvp_summary'] = event.get_rsvp_summary()
            events_data.append(event_dict)
        
        return jsonify(events_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events', methods=['POST'])
def create_event():
    """POST /events - Create a new event"""
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
        return jsonify(new_event.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Routes for Feature 2: View Single Event
@app.route('/events/<int:event_id>', methods=['GET'])
def get_single_event(event_id):
    """GET /events/<int:id> - Retrieve a single event by ID"""
    try:
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({'error': f'Event with ID {event_id} not found'}), 404
        
        event_data = event.to_dict()
        # Add RSVP summary to single event view
        event_data['rsvp_summary'] = event.get_rsvp_summary()
        
        return jsonify(event_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Routes for Feature 3: RSVP to Events
@app.route('/rsvps', methods=['POST'])
def create_rsvp():
    """
    POST /rsvps - Create a new RSVP for an event
    Expected JSON: {event_id, guest_name, guest_email, rsvp_status, note_to_host}
    """
    try:
        data = request.get_json()
        
        # Validation
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Required fields validation
        required_fields = ['event_id', 'guest_name', 'guest_email', 'rsvp_status']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate event exists
        event = Event.query.get(data['event_id'])
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Validate email format
        if not validate_email(data['guest_email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate RSVP status
        if not validate_rsvp_status(data['rsvp_status']):
            return jsonify({'error': 'RSVP status must be Yes, No, or Maybe'}), 400
        
        # Check if RSVP already exists for this email and event
        existing_rsvp = EventGuest.get_rsvp_by_email_and_event(
            data['event_id'], 
            data['guest_email']
        )
        
        if existing_rsvp:
            return jsonify({
                'error': 'RSVP already exists for this email and event',
                'existing_rsvp_id': existing_rsvp.id
            }), 409
        
        # Create new RSVP
        new_rsvp = EventGuest(
            event_id=data['event_id'],
            guest_name=data['guest_name'].strip(),
            guest_email=data['guest_email'].lower().strip(),
            rsvp_status=data['rsvp_status'],
            note_to_host=data.get('note_to_host', '').strip()
        )
        
        db.session.add(new_rsvp)
        db.session.commit()
        
        return jsonify(new_rsvp.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/rsvps/<int:rsvp_id>', methods=['PATCH'])
def update_rsvp(rsvp_id):
    """
    PATCH /rsvps/<id> - Update an existing RSVP
    Expected JSON: {rsvp_status, note_to_host} (all optional)
    """
    try:
        rsvp = EventGuest.query.get(rsvp_id)
        
        if not rsvp:
            return jsonify({'error': 'RSVP not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields if provided
        if 'rsvp_status' in data:
            if not validate_rsvp_status(data['rsvp_status']):
                return jsonify({'error': 'RSVP status must be Yes, No, or Maybe'}), 400
            rsvp.rsvp_status = data['rsvp_status']
        
        if 'note_to_host' in data:
            rsvp.note_to_host = data['note_to_host'].strip()
        
        # Update timestamp
        rsvp.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(rsvp.to_dict()), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/events/<int:event_id>/rsvps', methods=['GET'])
def get_event_rsvps(event_id):
    """
    GET /events/<id>/rsvps - Get all RSVPs for a specific event
    """
    try:
        # Verify event exists
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Get all RSVPs for this event
        rsvps = EventGuest.get_rsvps_for_event(event_id)
        
        rsvps_data = []
        for rsvp in rsvps:
            rsvps_data.append(rsvp.to_dict())
        
        return jsonify({
            'event_id': event_id,
            'event_title': event.title,
            'rsvp_summary': event.get_rsvp_summary(),
            'rsvps': rsvps_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check route
@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Event Planner API is running'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables if they don't exist
    app.run(debug=True, port=5000)
    