import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminPortal from './AdminPortal.tsx';
import './style.css';
const adminRoute = new URLSearchParams(window.location.search).get('admin') === '1';
createRoot(document.getElementById('root')).render(
  <React.StrictMode>{adminRoute ? <AdminPortal /> : <App />}</React.StrictMode>,
);
