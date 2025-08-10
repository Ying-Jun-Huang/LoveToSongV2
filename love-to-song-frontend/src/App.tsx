// file: love-to-song-frontend/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Homepage from './pages/Homepage';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Default route redirects to homepage */}
      <Route path="/" element={<Navigate to="/homepage" replace />} />
      {/* Homepage */}
      <Route path="/homepage" element={<Homepage />} />
      {/* Login page */}
      <Route path="/login" element={<Login />} />
      {/* Dashboard page (protected, should be accessible only after login) */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
};

export default App;
