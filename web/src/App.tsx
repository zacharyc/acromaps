import { useEffect, useState } from 'react'
import './App.css'

interface Event {
  id: string
  title: string
  description: string
  eventType: 'class' | 'festival' | 'jam' | 'event'
  startDate: string
  location?: {
    city: string
    country: string
    venueName?: string
  }
}

interface ApiInfo {
  name: string
  version: string
  description: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  class: 'Classes',
  jam: 'Jams',
  festival: 'Festivals',
  event: 'Events',
}

const EVENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  class: 'Learn from experienced teachers in structured classes',
  jam: 'Practice with the community in open jam sessions',
  festival: 'Multi-day gatherings celebrating acroyoga',
  event: 'Workshops, performances, and special events',
}

function App() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null)
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    // Check API connection
    fetch('/api/')
      .then(res => res.json())
      .then((data: ApiInfo) => {
        setApiInfo(data)
        setApiStatus('connected')
      })
      .catch(() => setApiStatus('error'))

    // Fetch events
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(() => {})
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">Acromaps</h1>
          <nav className="nav">
            <a href="#events">Events</a>
            <a href="#about">About</a>
            <button className="btn btn-primary">Sign In</button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h2>Find Acroyoga Events Near You</h2>
            <p>Discover classes, jams, festivals, and events in your area. Connect with the global acroyoga community.</p>
            <div className="hero-actions">
              <button className="btn btn-large btn-primary">Explore Events</button>
              <button className="btn btn-large btn-secondary">List Your Event</button>
            </div>
            <div className="api-status">
              {apiStatus === 'loading' && <span className="status loading">Connecting to API...</span>}
              {apiStatus === 'connected' && <span className="status connected">API Connected: {apiInfo?.name} v{apiInfo?.version}</span>}
              {apiStatus === 'error' && <span className="status error">API Offline - Start the server with `npm run dev`</span>}
            </div>
          </div>
        </section>

        <section className="event-types" id="events">
          <h3>Explore by Type</h3>
          <div className="type-grid">
            {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
              <div key={type} className={`type-card ${type}`}>
                <h4>{label}</h4>
                <p>{EVENT_TYPE_DESCRIPTIONS[type]}</p>
                <button className="btn btn-outline">Browse {label}</button>
              </div>
            ))}
          </div>
        </section>

        <section className="upcoming-events">
          <h3>Upcoming Events</h3>
          {events.length > 0 ? (
            <div className="events-grid">
              {events.slice(0, 6).map(event => (
                <div key={event.id} className="event-card">
                  <span className={`event-type-badge ${event.eventType}`}>
                    {EVENT_TYPE_LABELS[event.eventType]}
                  </span>
                  <h4>{event.title}</h4>
                  <p className="event-date">
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {event.location && (
                    <p className="event-location">
                      {event.location.venueName && `${event.location.venueName}, `}
                      {event.location.city}, {event.location.country}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-events">
              <p>No events yet. Be the first to add one!</p>
              <button className="btn btn-primary">Create Event</button>
            </div>
          )}
        </section>

        <section className="about" id="about">
          <h3>About Acromaps</h3>
          <p>
            Acromaps is a community-driven platform for discovering and sharing acroyoga events worldwide.
            Whether you're looking for a weekly class, an open jam session, or an international festival,
            we help you find your tribe.
          </p>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Acromaps. Made with love for the acroyoga community.</p>
      </footer>
    </div>
  )
}

export default App
