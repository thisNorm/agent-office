import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ponytail: StrictMode removed — it double-invokes updater functions, causing duplicate chat messages and double walk timers
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
