import { useState, useEffect } from 'react';
import RSVPForm from './RSVPForm';
import TaskList from './TaskList';
import NewTaskForm from './NewTaskForm';
import EditEventForm from './EditEventForm';
import './EventDetailPage.css';

/**
 * EventDetailPage Component
 * 
 * This component displays detailed information about a single event with RSVP functionality.
 * It fetches event data from the backend API and allows users to RSVP to the event.
 * 
 * Props:
 * - eventId: The ID of the event to display (will come from URL params in a real router setup)
 * 
 * How it works:
 * 1. Uses useState to manage event data, loading states, and RSVP display
 * 2. Uses useEffect to fetch event data when component mounts or eventId changes
 * 3. Makes HTTP GET request to /events/{id} endpoint
 * 4. Displays loading state while fetching
 * 5. Shows error message if event not found or fetch fails
 * 6. Renders event details in a structured layout
 * 7. Includes working RSVP form and RSVP summary display
 * 8. Fetches and displays current RSVPs for the event
 */

function EventDetailPage({ eventId }) {
  // State management using React hooks
  const [event, setEvent] = useState(null);          // Stores the event data
  const [loading, setLoading] = useState(true);      // Tracks if data is being loaded
  const [error, setError] = useState(null);          // Stores any error messages
  const [showRSVPForm, setShowRSVPForm] = useState(false); // Controls RSVP form visibility
  const [rsvps, setRsvps] = useState([]);            // Stores RSVP data
  const [rsvpLoading, setRsvpLoading] = useState(false); // Tracks RSVP loading state
  const [showTaskForm, setShowTaskForm] = useState(false); // Controls Task form visibility
  const [tasks, setTasks] = useState([]);            // Stores task data
  const [taskSummary, setTaskSummary] = useState(null); // Stores task summary
  const [taskLoading, setTaskLoading] = useState(false); // Tracks task loading state
  const [showEditForm, setShowEditForm] = useState(false); // Controls Edit Event form visibility
  const [deleteLoading, setDeleteLoading] = useState(false); // Tracks delete loading state

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
   * Fetch RSVPs for the current event
   */
  const fetchEventRSVPs = async () => {
    try {
      setRsvpLoading(true);
      const response = await fetch(`http://localhost:5000/events/${eventId}/rsvps`);
      
      if (response.ok) {
        const data = await response.json();
        setRsvps(data.rsvps || []);
      }
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    } finally {
      setRsvpLoading(false);
    }
  };

  /**
   * Handle successful RSVP submission
   */
  const handleRSVPSuccess = (newRsvp) => {
    // Refresh event data to get updated RSVP summary
    fetchEvent();
    // Refresh RSVP list
    fetchEventRSVPs();
    // Hide the form
    setShowRSVPForm(false);
  };

  /**
   * Handle RSVP update (when user submits RSVP)
   */
  const handleRSVPUpdate = () => {
    fetchEventRSVPs();
  };

  /**
   * Fetch Tasks for the current event
   */
  const fetchEventTasks = async () => {
    try {
      setTaskLoading(true);
      const response = await fetch(`http://localhost:5000/events/${eventId}/tasks`);
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setTaskSummary(data.task_summary || null);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setTaskLoading(false);
    }
  };

  /**
   * Handle successful task creation
   */
  const handleTaskCreated = (newTask) => {
    // Refresh task list
    fetchEventTasks();
    // Hide the form
    setShowTaskForm(false);
  };

  /**
   * Handle task update (when user toggles completion or updates task)
   */
  const handleTaskUpdate = () => {
    fetchEventTasks();
  };

  /**
   * Handle task toggle (when user marks task as complete/incomplete)
   */
  const handleTaskToggle = (updatedTask) => {
    // Update the task in the local state
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    // Also refresh the summary
    fetchEventTasks();
  };

  /**
   * Handle successful event update
   */
  const handleEventUpdate = (updatedEvent) => {
    // Update the event in the local state
    setEvent(updatedEvent);
    // Hide the edit form
    setShowEditForm(false);
  };

  /**
   * Handle event deletion
   */
  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(`http://localhost:5000/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Event deleted successfully!');
        // Navigate back to events list
        window.history.back();
      } else {
        const errorData = await response.json();
        alert(`Error deleting event: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    } finally {
      setDeleteLoading(false);
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

        {/* RSVP Summary Section */}
        {event.rsvp_summary && (
          <div className="rsvp-summary">
            <h3>RSVP Summary</h3>
            <div className="rsvp-stats">
              <div className="stat-item">
                <span className="stat-value">{event.rsvp_summary.yes}</span>
                <span className="stat-label">✅ Yes</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{event.rsvp_summary.no}</span>
                <span className="stat-label">❌ No</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{event.rsvp_summary.maybe}</span>
                <span className="stat-label">🤔 Maybe</span>
              </div>
              <div className="stat-item total">
                <span className="stat-value">{event.rsvp_summary.total}</span>
                <span className="stat-label">Total RSVPs</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="event-actions">
          <h3>Event Actions</h3>
          <div className="action-buttons">
            {/* RSVP Button - Feature 3 Implementation */}
            <button 
              className="action-button rsvp-button"
              onClick={() => setShowRSVPForm(!showRSVPForm)}
            >
              📝 {showRSVPForm ? 'Hide RSVP Form' : 'RSVP to Event'}
            </button>
            
            {/* View RSVPs Button */}
            <button 
              className="action-button view-rsvps-button"
              onClick={fetchEventRSVPs}
              disabled={rsvpLoading}
            >
              👥 {rsvpLoading ? 'Loading...' : 'View RSVPs'}
            </button>
            
            {/* Create Task Button - Feature 4 Implementation */}
            <button 
              className="action-button tasks-button"
              onClick={() => setShowTaskForm(!showTaskForm)}
            >
              📝 {showTaskForm ? 'Hide Task Form' : 'Create Task'}
            </button>
            
            {/* View Tasks Button */}
            <button 
              className="action-button view-tasks-button"
              onClick={fetchEventTasks}
              disabled={taskLoading}
            >
              📋 {taskLoading ? 'Loading...' : 'View Tasks'}
            </button>

            {/* Edit Event Button - Feature 6 Implementation */}
            <button 
              className="action-button edit-event-button"
              onClick={() => setShowEditForm(!showEditForm)}
            >
              ✏️ {showEditForm ? 'Cancel Edit' : 'Edit Event'}
            </button>

            {/* Delete Event Button - Feature 6 Implementation */}
            <button 
              className="action-button delete-event-button"
              onClick={handleDeleteEvent}
              disabled={deleteLoading}
              style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
            >
              🗑️ {deleteLoading ? 'Deleting...' : 'Delete Event'}
            </button>
          </div>
        </div>

        {/* RSVP Form Section */}
        {showRSVPForm && (
          <RSVPForm 
            eventId={eventId}
            onRSVPSuccess={handleRSVPSuccess}
            onRSVPUpdate={handleRSVPUpdate}
          />
        )}

        {/* RSVPs List Section */}
        {rsvps.length > 0 && (
          <div className="rsvps-list">
            <h3>Event RSVPs ({rsvps.length})</h3>
            <div className="rsvps-container">
              {rsvps.map((rsvp) => (
                <div key={rsvp.id} className="rsvp-item">
                  <div className="rsvp-header">
                    <span className="guest-name">{rsvp.guest_name}</span>
                    <span className={`rsvp-status ${rsvp.rsvp_status.toLowerCase()}`}>
                      {rsvp.rsvp_status === 'Yes' && '✅'}
                      {rsvp.rsvp_status === 'No' && '❌'}
                      {rsvp.rsvp_status === 'Maybe' && '🤔'}
                      {rsvp.rsvp_status}
                    </span>
                  </div>
                  <div className="guest-email">{rsvp.guest_email}</div>
                  {rsvp.note_to_host && (
                    <div className="guest-note">
                      <strong>Note:</strong> {rsvp.note_to_host}
                    </div>
                  )}
                  <div className="rsvp-date">
                    RSVP'd on {formatDate(rsvp.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Event Form Section - Feature 6 Implementation */}
        {showEditForm && (
          <EditEventForm 
            eventId={eventId}
            onEventUpdate={handleEventUpdate}
            onCancel={() => setShowEditForm(false)}
          />
        )}

        {/* Task Form Section */}
        {showTaskForm && (
          <NewTaskForm 
            eventId={eventId}
            onTaskCreated={handleTaskCreated}
            onCancel={() => setShowTaskForm(false)}
          />
        )}

        {/* Tasks List Section */}
        {(tasks.length > 0 || taskSummary) && (
          <TaskList 
            tasks={tasks}
            taskSummary={taskSummary}
            onTaskToggle={handleTaskToggle}
            onTaskUpdate={handleTaskUpdate}
            loading={taskLoading}
          />
        )}

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
