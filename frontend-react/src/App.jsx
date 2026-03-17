import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext'; 

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics'; 
import History from './pages/History'; // <-- IMPORT THE NEW HISTORY PAGE
import Layout from './components/Layout';

function App() {
  return (
    <AppProvider> 
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* ALL INTERNAL PAGES WRAPPED IN YOUR EXISTING LAYOUT */}
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
            
            {/* REPLACE THE 'COMING SOON' DIV WITH THE ACTUAL HISTORY COMPONENT */}
            <Route path="/history" element={<Layout><History /></Layout>} />
          </Routes>
        </Router>
    </AppProvider>
  );
}

export default App;