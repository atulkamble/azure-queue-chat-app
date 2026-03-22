import { useState } from 'react';
import App from './App';
import Admin from './Admin';
import './Router.css';

type View = 'chat' | 'admin';

function Router() {
  const [currentView, setCurrentView] = useState<View>('chat');

  return (
    <div className="app-wrapper">
      <nav className="main-nav">
        <div className="nav-container">
          <h1
            className="app-title"
            onClick={() => setCurrentView('chat')}
            style={{ cursor: 'pointer' }}
          >
            💬 Azure Queue Chat
          </h1>
          <div className="nav-links">
            <button
              className={currentView === 'chat' ? 'active' : ''}
              onClick={() => setCurrentView('chat')}
            >
              Chat
            </button>
            <button
              className={currentView === 'admin' ? 'active' : ''}
              onClick={() => setCurrentView('admin')}
            >
              Admin Panel
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        {currentView === 'chat' ? <App /> : <Admin />}
      </main>
    </div>
  );
}

export default Router;
