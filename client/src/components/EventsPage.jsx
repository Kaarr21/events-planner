import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * EventsPage component displays a list of all events
 * 
 * Key React concepts used:
 * - useState: Manages component state (events, loading, error)
 * - useEffect: Handles side effects (API calls on component mount)
 * - Conditional rendering: Shows different content based on state
 */
const EventsPage = () => {
  // State management using React hooks
  const [events, setEvents] = useState([]);        // Store events data
  const [loading, setLoading] = useState(true);    // Track loading state
  const [error, setError] = useState(null);        // Store error messages

  /**
   * useEffect hook runs after component mounts
   * Dependency array [] means it only runs once when component mounts
   */
  useEffect(() => {
    fetchEvents();
  }, []); // Empty dependency array = run once on mount

  /**
   * Fetch events from the Flask API
   * Uses async/await for cleaner promise handling
   */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make API call to Flask backend
      const response = await fetch('http://localhost:5000/events');
      
      // Check if request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse JSON response
      const eventsData = await response.json();
      
      // Update state with fetched data
      setEvents(eventsData);
      
    } catch (err) {
      // Handle any errors during fetch
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      // Always set loading to false when done
      setLoading(false);
    }
  };

  /**
   * Format date string for display
   * Converts ISO string to readable format
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'No date specified';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  /**
   * Refresh events by calling fetchEvents again
   */
  const handleRefresh = () => {
    fetchEvents();
  };

  // Conditional rendering based on state
  if (loading) {
    return (
      <div className="events-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-page">
        <div className="error-message">
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>All Events</h1>
        <div className="header-actions">
          <button onClick={handleRefresh} className="btn btn-secondary">
            Refresh
          </button>
          <Link to="/events/new" className="btn btn-primary">
            Create New Event
          </Link>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        // Empty state when no events exist
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No events yet</h3>
          <p>Get started by creating your first event!</p>
          <Link to="/events/new" className="btn btn-primary">
            Create First Event
          </Link>
        </div>
      ) : (
        // Display events in a grid
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <h3 className="event-title">{event.title}</h3>
                <div className="event-date">
                  {formatDate(event.date)}
                </div>
              </div>
              
              <div className="event-body">
                {event.description && (
                  <p className="event-description">
                    {event.description.length > 150 
                      ? `${event.description.substring(0, 150)}...`
                      : event.description
                    }
                  </p>
                )}
                
                {event.location && (
                  <div className="event-location">
                    📍 {event.location}
                  </div>
                )}
              </div>
              
              <div className="event-footer">
                <small className="created-date">
                  Created: {formatDate(event.created_at)}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
