// file: love-to-song-frontend/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Default route redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Login page */}
      <Route path="/login" element={<Login />} />
      {/* Dashboard page (protected, should be accessible only after login) */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
};

export default App;
