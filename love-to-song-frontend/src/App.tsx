// file: love-to-song-frontend/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuthV2';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Homepage from './pages/Homepage';
import PermissionTest from './test/PermissionTest';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Default route redirects to homepage */}
        <Route path="/" element={<Navigate to="/homepage" replace />} />
        {/* Homepage */}
        <Route path="/homepage" element={<Homepage />} />
        {/* Login page */}
        <Route path="/login" element={<Login />} />
        {/* Dashboard page (protected, should be accessible only after login) */}
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Permission test page */}
        <Route path="/test-permissions" element={<PermissionTest />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
