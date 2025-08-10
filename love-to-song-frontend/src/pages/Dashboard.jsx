// file: love-to-song-frontend/src/pages/Dashboard.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { authService } from '../services/authService';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simple auth guard: if no token, redirect to login
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <h2>Your Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>
      {/* The drag-and-drop layout component */}
      <DashboardLayout />
    </div>
  );
};

export default Dashboard;
