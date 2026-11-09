import React from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx'; import Admin from './pages/Admin.jsx'; import './assets/styles.css';
createRoot(document.getElementById('root')).render(<BrowserRouter><Routes>
  <Route path="/" element={<Home />} />
  <Route path="/bd-admin" element={<Admin />} />{/* hidden: not linked anywhere */}
  <Route path="*" element={<Home />} /></Routes></BrowserRouter>);
if ('serviceWorker' in navigator && import.meta.env.PROD) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
