import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registro de Service Worker para soporte Offline total
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Facilito POS Offline Engine activo:', reg.scope);
      })
      .catch((err) => {
        console.warn('Error registrando Service Worker:', err);
      });
  });
}
