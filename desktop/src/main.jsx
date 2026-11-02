import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

async function start() {
  // Plain-browser preview during development: stand in for the Electron preload.
  if (!window.fuc && import.meta.env.DEV) {
    const { installBrowserBridge } = await import('./dev/browserBridge.js');
    installBrowserBridge();
  }
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

start();
