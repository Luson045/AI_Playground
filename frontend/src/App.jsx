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
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import RatingPopup from './components/RatingPopup';
import Seo from './components/Seo';
function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/chat" replace />
          ) : (
            <>
              <Seo
                title="Discover products faster"
                description="Chat your way to products from real sellers with ADA AI, the advertisement agent that helps you find what you need faster."
              />
              <LandingPage />
            </>
          )
        }
      />
      <Route
        path="/chat"
        element={
          <>
            <Seo title="Chat search" noIndex />
            <ChatPage />
          </>
        }
      />
      <Route
        path="/market"
        element={
          <>
            <Seo
              title="Marketplace"
              description="Browse products from real sellers, compare options, and connect directly with the marketplace on ADA AI."
            />
            <MarketPage />
          </>
        }
      />
      <Route
        path="/about"
        element={
          <>
            <Seo
              title="About"
              description="Learn how ADA AI helps people discover products faster with conversational search and real seller listings."
            />
            <AboutPage />
          </>
        }
      />
      <Route
        path="/explore"
        element={
          <>
            <Seo
              title="Explore sellers"
              description="Explore featured sellers and product collections curated by ADA AI."
            />
            <ExplorePage />
          </>
        }
      />
      <Route
        path="/explore/:id"
        element={
          <>
            <Seo title="Seller profile" noIndex />
            <UserProfilePage />
          </>
        }
      />
      <Route
        path="/messages"
        element={
          user ? (
            <>
              <Seo title="Messages" noIndex />
              <MessagesPage />
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/chat" replace />
          ) : (
            <>
              <Seo title="Log in" noIndex />
              <LoginPage />
            </>
          )
        }
      />
      <Route
        path="/upload"
        element={
          user ? (
            <>
              <Seo title="Upload product" noIndex />
              <UploadPage />
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <>
              <Seo title="Dashboard" noIndex />
              <DashboardPage />
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          <>
            <Seo title="Page not found" noIndex />
            <NotFoundPage />
          </>
        }
      />
    </Routes>
  );
}

function AppContent() {
  const location = useLocation();
  const showFooter = location.pathname !== '/chat';
  const showRating = location.pathname !== '/login';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <AppRoutes />
        {showFooter && <Footer />}
      </main>
      {showRating && <RatingPopup />}
      <Analytics />
      <SpeedInsights />
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
