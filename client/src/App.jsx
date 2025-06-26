import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import EventsPage from './components/EventsPage'
import EventDetailPage from './components/EventDetailPage'
import NewEventForm from './components/NewEventForm'
import EditEventPage from './components/EditEventPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={
          <div>
            <header style={{ textAlign: 'center', padding: '2rem 0' }}>
              <h1>🎉 Events Planner</h1>
              <p>Organize and manage your events with ease</p>
            </header>

            <nav style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to="/events"
                  style={{
                    background: '#646cff',
                    color: 'white',
                    textDecoration: 'none',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'inline-block'
                  }}
                >
                  📅 View All Events
                </Link>

                <Link
                  to="/events/new"
                  style={{
                    background: '#28a745',
                    color: 'white',
                    textDecoration: 'none',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'inline-block'
                  }}
                >
                  ➕ Create New Event
                </Link>
              </div>
            </nav>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px', fontSize: '0.9rem', maxWidth: '600px', margin: '2rem auto' }}>
              <strong>🚀 Features Available:</strong>
              <ul style={{ textAlign: 'left', marginTop: '1rem' }}>
                <li>✅ View and manage events</li>
                <li>✅ Create new events with date/time</li>
                <li>✅ Edit and delete events</li>
                <li>✅ RSVP to events</li>
                <li>✅ Add, edit, and delete tasks</li>
                <li>✅ Toggle task completion</li>
              </ul>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                💡 Make sure your Flask backend is running on <code>http://localhost:5000</code>
              </p>
            </div>
          </div>
        } />

        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/new" element={<NewEventForm />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/edit" element={<EditEventPage />} />
      </Routes>
    </div>
  );
}

export default App;
