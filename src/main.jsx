
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './app/styles/index.css';
import React from 'react';
import App from '../src/app/pages/App.jsx';

createRoot(document.getElementById('root')).render(
  < React.StrictMode >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode >,
)
