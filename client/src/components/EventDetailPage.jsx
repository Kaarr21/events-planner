import { useState, useEffect } from 'react';
import './EventDetailPage.css';

/**
 * EventDetailPage Component
 * 
 * This component displays detailed information about a single event.
 * It fetches event data from the backend API and displays it in a formatted layout.
 * 
 * Props:
 * - eventId: The ID of the event to display (will come from URL params in a real router setup)
 * 
 * How it works:
 * 1. Uses useState to manage event data and loading states
 * 2. Uses useEffect to fetch event data when component mounts or eventId changes
 * 3. Makes HTTP GET request to /events/{id} endpoint
 * 4. Displays loading state while fetching
 * 5. Shows error message if event not found or fetch fails
 * 6. Renders event details in a structured layout
 * 7. Includes placeholder links for future RSVP and Task features
 */

function EventDetailPage({ eventId }) {
  // State management using React hooks
  const [event, setEvent] = useState(null);          // Stores the event data
  const [loading, setLoading] = useState(true);      // Tracks if data is being loaded
  const [error, setError] = useState(null);          // Stores any error messages

  // useEffect hook runs when component mounts or when eventId changes
  useEffect(() => {
    fetchEvent();
  }, [eventId]); // Dependency array - effect runs when eventId changes

  /**
   * Fetches event data from the backend API
   * 
   * How the fetch process works:
   * 1. Reset error state and set loading to true
   * 2. Make HTTP GET request to backend endpoint
   * 3. Check if response is successful (status 200-299)
   * 4. Parse JSON response data
   * 5. Update state with event data or error message
   * 6. Set loading to false when complete
   */
  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make API call to backend
      const response = await fetch(`http://localhost:5000/events/${eventId}`);
      
      if (!response.ok) {
        // If response is not ok (status 400-599), throw error
        if (response.status === 404) {
          throw new Error('Event not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse JSON response
      const eventData = await response.json();
      setEvent(eventData);
      
    } catch (err) {
      // Handle any errors during fetch
      console.error('Error fetching event:', err);
      setError(err.message || 'Failed to load event');
    } finally {
      // Always set loading to false, whether success or error
      setLoading(false);
    }
  };

  /**
   * Format date string for display
   * Converts ISO date string to readable format
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not specified';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="event-detail-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchEvent} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render event details
  return (
    <div className="event-detail-page">
      <div className="event-detail-container">
        {/* Event Header */}
        <div className="event-header">
          <h1 className="event-title">{event.title}</h1>
          <div className="event-meta">
            <span className="event-date">
              📅 {formatDate(event.date)}
            </span>
            {event.location && (
              <span className="event-location">
                📍 {event.location}
              </span>
            )}
          </div>
        </div>

        {/* Event Description */}
        <div className="event-description">
          <h3>Description</h3>
          <p>{event.description || 'No description provided'}</p>
        </div>

        {/* Action Buttons Section */}
        <div className="event-actions">
          <h3>Event Actions</h3>
          <div className="action-buttons">
            {/* RSVP Button - placeholder for Feature 3 */}
            <button className="action-button rsvp-button" disabled>
              📝 RSVP to Event
              <span className="coming-soon">(Coming Soon)</span>
            </button>
            
            {/* Task List Button - placeholder for Feature 4 */}
            <button className="action-button tasks-button" disabled>
              ✅ View Tasks
              <span className="coming-soon">(Coming Soon)</span>
            </button>
          </div>
        </div>

        {/* Event Details Section */}
        <div className="event-details">
          <h3>Event Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <strong>Event ID:</strong> {event.id}
            </div>
            <div className="detail-item">
              <strong>Created:</strong> {formatDate(event.created_at)}
            </div>
            {event.updated_at && (
              <div className="detail-item">
                <strong>Last Updated:</strong> {formatDate(event.updated_at)}
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="navigation">
          <button 
            onClick={() => window.history.back()} 
            className="back-button"
          >
            ← Back to Events
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;
