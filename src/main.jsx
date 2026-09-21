import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = '/api';
const DEFAULT_EVENTS = [
  { key: 'Dance', title: 'DANCE', description: 'Bring your energy to the stage.', imageKey: 'danceImage' },
  { key: 'Drama / Acting', title: 'DRAMA / ACTING', description: 'Tell a story. Own the stage.', imageKey: 'dramaImage' },
  { key: 'Singing', title: 'SINGING', description: 'Let your voice be heard.', imageKey: 'singingImage' },
];

function App() {
  const [settings, setSettings] = useState({});
  const [media, setMedia] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [route, setRoute] = useState(window.location.pathname || '/');
  const [token, setToken] = useState(localStorage.getItem('freshersToken') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('Dance');

  useEffect(() => {
    fetchPublic();
    const onPop = () => setRoute(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const fetchPublic = async () => {
    try {
      const response = await fetch(`${API}/public`);
      const data = await response.json();
      setSettings(data.settings || {});
      setMedia(data.media || {});
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error(error);
    }
  };

  const navigate = (path) => {
    const next = path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
    window.history.pushState({}, '', next);
    setRoute(next);
  };

  const renderPage = () => {
    if (route === '/organiser/login') {
      return <OrganiserPage token={token} setToken={setToken} settings={settings} media={media} setSettings={setSettings} fetchPublic={fetchPublic} announcements={announcements} setAnnouncements={setAnnouncements} />;
    }
    if (route === '/info') {
      return <InfoPage settings={settings} media={media} />;
    }
    if (route === '/passes') {
      return <PassesPage settings={settings} media={media} />;
    }
    if (route === '/participate') {
      return <ParticipatePage settings={settings} media={media} selectedEvent={selectedEvent} onBack={() => navigate('/')} />;
    }
    return <HomePage settings={settings} media={media} navigate={navigate} onParticipate={setSelectedEvent} openForm={() => setModalOpen(true)} />;
  };

  const openParticipate = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  return (
    <>
      <div className="page-shell">
        <Header settings={settings} navigate={navigate} onParticipate={openParticipate} />
        {renderPage()}
        <Footer settings={settings} />
      </div>
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <ParticipatePage settings={settings} media={media} selectedEvent={selectedEvent} onBack={() => setModalOpen(false)} compact />
          </div>
        </div>
      )}
    </>
  );
}

function Header({ settings, navigate, onParticipate }) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">◫</div>
        <div>
          <div className="brand-name">USHA MARTIN</div>
          <div className="brand-sub">University</div>
        </div>
      </div>

      <nav className="main-nav">
        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/#events')}>Events</button>
        <button onClick={() => navigate('/passes')}>Passes</button>
        <button onClick={() => navigate('/participate')}>Participate</button>
        <button onClick={() => navigate('/info')}>Info</button>
        <button onClick={() => navigate('/#contact')}>Contact</button>
      </nav>

      <div className="header-actions">
        <button className="text-link" onClick={() => navigate('/info')}>Help</button>
        <button className="gold-button" onClick={() => navigate('/passes')}>Get My Pass</button>
      </div>
    </header>
  );
}

function HomePage({ settings, media, navigate, onParticipate, openForm }) {
  const eventCards = DEFAULT_EVENTS.map((event) => ({
    ...event,
    image: media[event.imageKey] || DEFAULT_EVENTS.find((item) => item.key === event.key)?.image,
  }));

  return (
    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="status-row">⏱ {settings.eventDate || 'TO BE ANNOUNCED SOON'}</div>
          <h1 className="hero-title">{settings.heroHeading || 'DIPLOMA ENGINEERING\nFRESHERS\nPASS &\nCULTURAL EVENTS'}</h1>
          <p className="hero-subtitle">{settings.heroSubtitle || 'A new chapter. A shared stage. Make your first university memories unforgettable.'}</p>
          <div className="hero-actions">
            <button className="gold-button hero-btn" onClick={() => navigate('/passes')}>Get My Pass →</button>
            <button className="secondary-btn hero-btn" onClick={() => navigate('/passes')}>Already Purchased? Retrieve Pass →</button>
          </div>
        </div>
        <div className="hero-media" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,5,5,0.9) 0%, rgba(5,5,5,0.3) 30%, rgba(5,5,5,0.1) 60%), url(${media.heroImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1500&q=80'})` }} />
      </section>

      <div className="secondary-nav">
        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/#events')}>Events</button>
        <button onClick={() => navigate('/participate')}>Participate</button>
        <button onClick={() => navigate('/info')}>Timeline</button>
        <button onClick={() => navigate('/info')}>Info</button>
        <button className="gold-button compact" onClick={() => navigate('/passes')}>Get My Pass</button>
      </div>

      <section className="culture-section" id="events">
        <div className="culture-intro">
          <p className="mini-label">Be Part of</p>
          <h2>The Culture</h2>
          <p>Showcase your talent, connect with peers and make memories that last beyond the campus.</p>
          <button className="gold-button" onClick={() => navigate('/participate')}>Participate Now →</button>
        </div>

        <div className="culture-grid">
          {eventCards.map((event) => (
            <article key={event.key} className="culture-card" onClick={() => onParticipate(event.key)} style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${event.image})` }}>
              <div className="card-content">
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </div>
              <span className="arrow-badge">→</span>
            </article>
          ))}
        </div>
      </section>

      <InfoStrip settings={settings} />

      <section className="feature-panel">
        <div>
          <p className="mini-label">What's Next</p>
          <h3>{settings.eventName || 'Diploma Engineering Freshers'}</h3>
          <p>{settings.announcement || 'Freshers event date will be announced soon.'}</p>
        </div>
        <div className="feature-divider" />
        <div>
          <p className="mini-label">Venue</p>
          <h3>{settings.venue || 'USHA MARTIN UNIVERSITY CAMPUS'}</h3>
          <p>All Diploma Engineering students are welcome.</p>
        </div>
      </section>
    </main>
  );
}

function InfoStrip({ settings }) {
  const items = [
    { label: 'Event Date', value: settings.eventDate || 'TO BE ANNOUNCED SOON' },
    { label: 'Venue', value: settings.venue || 'USHA MARTIN UNIVERSITY CAMPUS' },
    { label: 'Who Can Join', value: 'ALL DIPLOMA ENGINEERING STUDENTS' },
    { label: 'Pass Includes', value: 'EVENT ACCESS + PARTICIPATION' },
  ];

  return (
    <div className="info-strip">
      {items.map((item) => (
        <div key={item.label} className="info-item">
          <span className="info-badge">◌</span>
          <div>
            <small>{item.label}</small>
            <strong>{item.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function PassesPage({ settings, media }) {
  const [form, setForm] = useState({ type: 'FRESHER', coupon: '' });
  const [status, setStatus] = useState(null);
  const [retrieveMode, setRetrieveMode] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const endpoint = retrieveMode ? `${API}/retrieve` : `${API}/passes`;
    const payload = retrieveMode ? { registration: form.registration, passCode: form.passCode } : { ...form };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus({ error: data.error || 'Something went wrong.' });
      return;
    }

    setStatus(data);
  };

  return (
    <main className="page-section">
      <div className="section-heading">
        <p className="mini-label">{retrieveMode ? 'Already Purchased?' : 'Get My Pass'}</p>
        <h2>{retrieveMode ? 'Retrieve your pass' : 'Your place is here.'}</h2>
      </div>

      {status && !status.pass && !status.error ? (
        <div className="success-box">
          <h3>{status.message}</h3>
          <p>Original price: ₹{status.original}</p>
          <p>Discount: ₹{status.discount}</p>
          <p>Final amount: ₹{status.amount}</p>
          <p>Pass code: <strong>{status.passCode}</strong></p>
        </div>
      ) : null}

      {status && status.error ? <div className="error-box">{status.error}</div> : null}

      <form className="form-grid" onSubmit={submit}>
        {!retrieveMode ? (
          <label className="field wide">
            PASS TYPE
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="FRESHER">FRESHER</option>
              <option value="SENIOR">SENIOR</option>
            </select>
          </label>
        ) : null}

        {!retrieveMode ? (
          <>
            <label className="field"><span>FULL NAME</span><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label className="field"><span>REGISTRATION NUMBER</span><input value={form.registration || ''} onChange={(e) => setForm({ ...form, registration: e.target.value })} required /></label>
            <label className="field"><span>BRANCH</span><input value={form.branch || ''} onChange={(e) => setForm({ ...form, branch: e.target.value })} required /></label>
            <label className="field"><span>YEAR / SEMESTER</span><input value={form.semester || ''} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></label>
            <label className="field"><span>PHONE NUMBER</span><input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="field"><span>EMAIL</span><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="field wide"><span>COUPON CODE</span><input value={form.coupon || ''} onChange={(e) => setForm({ ...form, coupon: e.target.value })} placeholder="FRESHER50" /></label>
          </>
        ) : (
          <>
            <label className="field"><span>REGISTRATION NUMBER</span><input value={form.registration || ''} onChange={(e) => setForm({ ...form, registration: e.target.value })} required /></label>
            <label className="field"><span>PASS CODE</span><input value={form.passCode || ''} onChange={(e) => setForm({ ...form, passCode: e.target.value })} required /></label>
          </>
        )}

        {!retrieveMode ? (
          <div className="summary-box wide">
            <div><span>ORIGINAL PRICE</span><strong>₹{settings.passPrice || 499}</strong></div>
            <div><span>DISCOUNT</span><strong>₹{(form.coupon || '').toUpperCase() === 'FRESHER50' ? 249 : 0}</strong></div>
            <div><span>FINAL PRICE</span><strong>₹{((form.coupon || '').toUpperCase() === 'FRESHER50' ? (Number(settings.passPrice || 499) - 249) : Number(settings.passPrice || 499))}</strong></div>
          </div>
        ) : null}

        <div className="wide action-row">
          <button className="gold-button" type="submit">{retrieveMode ? 'RETRIEVE MY PASS →' : 'PROCEED TO PAYMENT →'}</button>
          <button className="secondary-btn" type="button" onClick={() => setRetrieveMode((value) => !value)}>{retrieveMode ? 'New Pass Purchase' : 'Already Purchased?'}</button>
        </div>
      </form>
    </main>
  );
}

function ParticipatePage({ settings, media, selectedEvent, onBack, compact }) {
  const [eventType, setEventType] = useState(selectedEvent || 'Dance');
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const payload = { ...form, eventType };
    const response = await fetch(`${API}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Submission failed.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="page-section compact-page">
        <div className="success-box">
          <h2>Submitted successfully</h2>
          <p>Your performance request has been submitted successfully.</p>
          <button className="gold-button" onClick={onBack}>Back</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-section compact-page">
      <div className="section-heading">
        <p className="mini-label">CULTURAL PARTICIPATION</p>
        <h2>Own the stage.</h2>
      </div>
      <div className="event-picker">
        {DEFAULT_EVENTS.map((event) => (
          <button key={event.key} className={eventType === event.key ? 'active' : ''} onClick={() => setEventType(event.key)}>{event.title}</button>
        ))}
      </div>

      <form className="form-grid" onSubmit={submit}>
        <label className="field"><span>FULL NAME</span><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label className="field"><span>REGISTRATION NUMBER</span><input value={form.registration || ''} onChange={(e) => setForm({ ...form, registration: e.target.value })} required /></label>
        <label className="field"><span>BRANCH</span><input value={form.branch || ''} onChange={(e) => setForm({ ...form, branch: e.target.value })} required /></label>
        <label className="field"><span>PHONE NUMBER</span><input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label className="field"><span>EMAIL</span><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label className="field"><span>EVENT TYPE</span><select value={eventType} onChange={(e) => setEventType(e.target.value)}>
          <option value="Dance">Dance</option>
          <option value="Drama / Acting">Drama / Acting</option>
          <option value="Singing">Singing</option>
        </select></label>
        <label className="field"><span>PERFORMANCE NAME</span><input value={form.performance || ''} onChange={(e) => setForm({ ...form, performance: e.target.value })} /></label>
        <label className="field"><span>NUMBER OF PARTICIPANTS</span><input type="number" value={form.participants || 1} onChange={(e) => setForm({ ...form, participants: e.target.value })} /></label>
        <label className="field wide"><span>SHORT DESCRIPTION</span><textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <div className="wide action-row"><button className="gold-button" type="submit">SUBMIT PERFORMANCE →</button>{compact ? <button type="button" className="secondary-btn" onClick={onBack}>Close</button> : null}</div>
      </form>
    </main>
  );
}

function InfoPage({ settings, media }) {
  return (
    <main className="page-section info-page">
      <div className="section-heading">
        <p className="mini-label">INFO</p>
        <h2>One campus. One beginning.</h2>
      </div>
      <InfoStrip settings={settings} />
      <div className="info-copy">
        <p>Freshers 2026 is a celebration of talent, friendship and the people who make university feel like home.</p>
      </div>
    </main>
  );
}

function OrganiserPage({ token, setToken, settings, media, setSettings, fetchPublic, announcements, setAnnouncements }) {
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [dashboard, setDashboard] = useState(null);
  const [content, setContent] = useState({});
  const [uploading, setUploading] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', published: true });

  useEffect(() => {
    if (!token) return;
    loadDashboard();
  }, [token]);

  const handleLogin = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API}/organiser/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Login failed');
      return;
    }
    localStorage.setItem('freshersToken', data.token);
    setToken(data.token);
  };

  const loadDashboard = async () => {
    const response = await fetch(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Unable to load dashboard');
      return;
    }
    setDashboard(data);

    const contentResponse = await fetch(`${API}/admin/content`, { headers: { Authorization: `Bearer ${token}` } });
    const contentData = await contentResponse.json();
    if (contentResponse.ok) {
      setContent(contentData);
      setSettings(contentData.settings || {});
      setAnnouncements(contentData.announcements || []);
    }
  };

  const saveSettings = async () => {
    const response = await fetch(`${API}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    if (response.ok) {
      setSettings(data.settings || {});
      await fetchPublic();
      alert('Settings updated successfully');
    }
  };

  const uploadMedia = async (key, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API}/admin/media/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      await fetchPublic();
      alert(`${key} updated successfully.`);
    } else {
      alert(data.error || 'Upload failed');
    }
  };

  const saveAnnouncement = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API}/admin/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(announcementForm),
    });
    const data = await response.json();
    if (response.ok) {
      const updated = await fetch(`${API}/admin/content`, { headers: { Authorization: `Bearer ${token}` } });
      const next = await updated.json();
      setAnnouncements(next.announcements || []);
      setAnnouncementForm({ title: '', body: '', published: true });
    } else {
      alert(data.error || 'Failed to create announcement');
    }
  };

  if (!token) {
    return (
      <main className="page-section organiser-login">
        <div className="section-heading">
          <p className="mini-label">ORGANISER LOGIN</p>
          <h2>Dashboard access</h2>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <label className="field"><span>ID</span><input value={loginForm.id} onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })} required /></label>
          <label className="field"><span>PASSWORD</span><input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required /></label>
          <button className="gold-button" type="submit">LOGIN →</button>
        </form>
      </main>
    );
  }

  return (
    <main className="page-section organiser-dashboard">
      <div className="section-heading">
        <p className="mini-label">ORGANISER DASHBOARD</p>
        <h2>Welcome</h2>
      </div>

      {dashboard && (
        <div className="stats-grid">
          <div className="stat-card"><small>Total Passes</small><strong>{dashboard.stats.total || 0}</strong></div>
          <div className="stat-card"><small>Paid / Verified</small><strong>{dashboard.stats.paid || 0}</strong></div>
          <div className="stat-card"><small>Used Passes</small><strong>{dashboard.stats.used || 0}</strong></div>
          <div className="stat-card"><small>Unused Passes</small><strong>{Number(dashboard.stats.total || 0) - Number(dashboard.stats.used || 0)}</strong></div>
          <div className="stat-card"><small>Total Revenue</small><strong>₹{dashboard.stats.revenue || 0}</strong></div>
          <div className="stat-card"><small>Total Discounts</small><strong>₹{dashboard.stats.discounts || 0}</strong></div>
        </div>
      )}

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h3>Recent Pass Activity</h3>
          {dashboard && dashboard.passes && dashboard.passes.length ? dashboard.passes.slice(0, 6).map((pass) => (
            <div className="activity-row" key={pass.id}>
              <div>
                <strong>{pass.name}</strong>
                <small>{pass.branch}</small>
              </div>
              <span>{pass.pass_code}</span>
              <span>{pass.status}</span>
            </div>
          )) : <p>No recent passes.</p>}
        </section>

        <section className="dashboard-panel">
          <h3>Announcements</h3>
          <form className="announcement-form" onSubmit={saveAnnouncement}>
            <input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="Title" />
            <textarea value={announcementForm.body} onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })} placeholder="Announcement" />
            <label><input type="checkbox" checked={announcementForm.published} onChange={(e) => setAnnouncementForm({ ...announcementForm, published: e.target.checked })} /> Publish</label>
            <button className="gold-button" type="submit">Create</button>
          </form>
          {announcements.map((item) => (
            <div key={item.id} className="mini-announcement">
              <strong>{item.title}</strong>
              <small>{item.body}</small>
            </div>
          ))}
        </section>
      </div>

      <section className="dashboard-panel settings-panel">
        <h3>Content Management</h3>
        <div className="settings-grid">
          <label className="field"><span>Event Name</span><input value={settings.eventName || ''} onChange={(e) => setSettings({ ...settings, eventName: e.target.value })} /></label>
          <label className="field"><span>Event Year</span><input value={settings.eventYear || ''} onChange={(e) => setSettings({ ...settings, eventYear: e.target.value })} /></label>
          <label className="field"><span>University Name</span><input value={settings.university || ''} onChange={(e) => setSettings({ ...settings, university: e.target.value })} /></label>
          <label className="field"><span>Hero Heading</span><textarea value={settings.heroHeading || ''} onChange={(e) => setSettings({ ...settings, heroHeading: e.target.value })} /></label>
          <label className="field"><span>Hero Subtitle</span><textarea value={settings.heroSubtitle || ''} onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })} /></label>
          <label className="field"><span>Event Date</span><input value={settings.eventDate || ''} onChange={(e) => setSettings({ ...settings, eventDate: e.target.value })} /></label>
          <label className="field"><span>Venue</span><input value={settings.venue || ''} onChange={(e) => setSettings({ ...settings, venue: e.target.value })} /></label>
          <label className="field"><span>Pass Price</span><input value={settings.passPrice || ''} onChange={(e) => setSettings({ ...settings, passPrice: e.target.value })} /></label>
          <label className="field"><span>Announcement</span><textarea value={settings.announcement || ''} onChange={(e) => setSettings({ ...settings, announcement: e.target.value })} /></label>
          <label className="field"><span>Coordinator Name</span><input value={settings.coordinatorName || ''} onChange={(e) => setSettings({ ...settings, coordinatorName: e.target.value })} /></label>
          <label className="field"><span>Coordinator Phone</span><input value={settings.coordinatorPhone || ''} onChange={(e) => setSettings({ ...settings, coordinatorPhone: e.target.value })} /></label>
          <label className="field"><span>Coordinator Email</span><input value={settings.coordinatorEmail || ''} onChange={(e) => setSettings({ ...settings, coordinatorEmail: e.target.value })} /></label>
          <button className="gold-button wide-button" onClick={saveSettings}>Save Content</button>
        </div>
      </section>

      <section className="dashboard-panel image-panel">
        <h3>Image Management</h3>
        <div className="upload-grid">
          {Object.entries({ heroImage: 'Hero Image', danceImage: 'Dance Image', dramaImage: 'Drama Image', singingImage: 'Singing Image', logo: 'University Logo' }).map(([key, label]) => (
            <label key={key} className="upload-card">
              <span>{label}</span>
              <input type="file" accept="image/*" onChange={(event) => uploadMedia(key, event.target.files[0])} />
            </label>
          ))}
        </div>
      </section>
    </main>
  );
}

function Footer({ settings }) {
  return (
    <footer className="footer">
      <span>© {settings.eventYear || '2026'} {settings.university || 'USHA MARTIN UNIVERSITY'}</span>
      <span>Freshers • Culture • Community</span>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
