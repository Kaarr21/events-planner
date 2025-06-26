import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import EventDetailPage from './components/EventDetailPage'

/**
 * Main App Component
 * 
 * This is the root component that demonstrates both existing functionality
 * and the new EventDetailPage component for Feature 2.
 * 
 * How it works:
 * 1. Uses useState to manage which view to show (original demo or event detail)
 * 2. Uses useState to manage which event ID to display in detail view
 * 3. Provides buttons to switch between views
 * 4. Renders EventDetailPage component with specific event ID
 * 
 * In a real application, you would use React Router for navigation,
 * but for testing purposes, we're using simple state management.
 */

function App() {
  // Original counter state from Vite template
  const [count, setCount] = useState(0)
  
  // New state for managing views
  const [currentView, setCurrentView] = useState('home') // 'home' or 'event-detail'
  const [selectedEventId, setSelectedEventId] = useState(1) // Default to event ID 1

  /**
   * Handle switching to event detail view
   * @param {number} eventId - The ID of the event to view
   */
  const showEventDetail = (eventId) => {
    setSelectedEventId(eventId);
    setCurrentView('event-detail');
  };

  /**
   * Handle returning to home view
   */
  const showHome = () => {
    setCurrentView('home');
  };

  // Render event detail view
  if (currentView === 'event-detail') {
    return (
      <div className="App">
        <EventDetailPage eventId={selectedEventId} />
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            onClick={showHome}
            style={{
              background: '#646cff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Render home view (original + event detail demo buttons)
  return (
    <div className="App">
      {/* Original Vite + React Demo */}
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      {/* New Event Detail Demo Section */}
      <div className="card" style={{ marginTop: '2rem', borderTop: '2px solid #646cff', paddingTop: '2rem' }}>
        <h2>🎉 Event Planner App - Feature 2 Demo</h2>
        <p>Test the Event Detail Page with different event IDs:</p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button 
            onClick={() => showEventDetail(1)}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            View Event ID 1
          </button>
          
          <button 
            onClick={() => showEventDetail(2)}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            View Event ID 2
          </button>
          
          <button 
            onClick={() => showEventDetail(999)}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            View Event ID 999 (404 Test)
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px', fontSize: '0.9rem' }}>
          <strong>💡 Testing Instructions:</strong>
          <br />
          1. Make sure your Flask backend is running on <code>http://localhost:5000</code>
          <br />
          2. Create some events using the POST /events endpoint first
          <br />
          3. Click the buttons above to test different scenarios
          <br />
          4. The red button tests 404 error handling
        </div>
      </div>
    </div>
  )
}

export default App
