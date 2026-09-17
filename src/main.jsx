import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './store/StoreContext';
import './index.css';

// HashRouter, not BrowserRouter: this deploys to GitHub Pages as static files,
// where deep links to /p/bz-1001 would 404 without server rewrites.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>
);
