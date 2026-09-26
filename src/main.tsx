import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui';
import './style.css';
import './addon.css';
import './matching.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html contains a <div id="root">.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
