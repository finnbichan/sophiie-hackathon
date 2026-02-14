import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'; // Using MemoryRouter for Electron
import LandingPage from './pages/LandingPage';
import CallPage from './pages/CallPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/call" element={<CallPage />} />
      </Routes>
    </Router>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error("Root element not found");
}
