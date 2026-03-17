import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext'; // NEW IMPORT

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics'; // Make sure you have this!
import Layout from './components/Layout';

function App() {
  return (
    <AppProvider> {/* WRAP THE ROUTER */}
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
            <Route path="/history" element={<Layout><div className="p-10">History Coming Soon</div></Layout>} />
          </Routes>
        </Router>
    </AppProvider>
  );
}

export default App;