from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import datetime, timezone
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
Event, EventGuest, Task = create_models(db)

# Validation helper functions
def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_rsvp_status(status):
    return status in ['Yes', 'No', 'Maybe']

def parse_iso_datetime_aware(date_str):
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        raise ValueError("Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)")

@app.route('/events', methods=['GET'])
def get_events():
    try:
        events = Event.query.all()
        events_data = [event.to_dict() | {'rsvp_summary': event.get_rsvp_summary()} for event in events]
        return jsonify(events_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events', methods=['POST'])
def create_event():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400

        date_str = data.get('date')
        if not date_str:
            return jsonify({'error': 'Date is required'}), 400

        try:
            event_date = parse_iso_datetime_aware(date_str)
            if event_date <= datetime.now(timezone.utc):
                return jsonify({'error': 'Date must be in the future'}), 400
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        new_event = Event(
            title=data['title'],
            description=data.get('description', ''),
            location=data.get('location', ''),
            date=event_date
        )

        db.session.add(new_event)
        db.session.commit()
        return jsonify(new_event.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/events/<int:event_id>', methods=['GET'])
def get_single_event(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        event_data = event.to_dict()
        event_data['rsvp_summary'] = event.get_rsvp_summary() if hasattr(event, 'get_rsvp_summary') else {}
        return jsonify(event_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events/<int:event_id>', methods=['PATCH'])
def update_event(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        if 'title' in data:
            if not data['title'].strip():
                return jsonify({'error': 'Title cannot be empty'}), 400
            event.title = data['title'].strip()

        if 'description' in data:
            event.description = data['description'].strip()

        if 'location' in data:
            event.location = data['location'].strip()

        if 'date' in data:
            date_str = data['date']
            if not date_str:
                return jsonify({'error': 'Date cannot be empty'}), 400
            try:
                event_date = parse_iso_datetime_aware(date_str)
                if event_date <= datetime.now(timezone.utc):
                    return jsonify({'error': 'Date must be in the future'}), 400
                event.date = event_date
            except ValueError as e:
                return jsonify({'error': str(e)}), 400

        event.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return jsonify(event.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        db.session.delete(event)
        db.session.commit()

        return jsonify({'message': f'Event {event_id} deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
