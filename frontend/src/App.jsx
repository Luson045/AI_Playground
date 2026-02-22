import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ChatPage from './pages/ChatPage';
import MarketPage from './pages/MarketPage';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ExplorePage from './pages/ExplorePage';
import UserProfilePage from './pages/UserProfilePage';
import MessagesPage from './pages/MessagesPage';
import NotFoundPage from './pages/NotFoundPage';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/chat" replace /> : <LandingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/market" element={<MarketPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/explore/:id" element={<UserProfilePage />} />
      <Route path="/messages" element={user ? <MessagesPage /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={user ? <Navigate to="/chat" replace /> : <LoginPage />} />
      <Route path="/upload" element={user ? <UploadPage /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function AppContent() {
  const location = useLocation();
  const showFooter = location.pathname !== '/chat';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <AppRoutes />
        {showFooter && <Footer />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
