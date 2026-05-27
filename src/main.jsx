import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Disregistra tutti i Service Worker e forza il reload per aggiornare la cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
    if (registrations.length > 0) {
      window.location.reload(true);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)