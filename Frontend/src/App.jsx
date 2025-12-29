import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Recommendation from './pages/Recommendation'
import Checklist from './pages/Checklist'
import Profile from './pages/Profile'
import Documents from './pages/Documents'
import FAQ from './pages/FAQ'
import GoogleCallback from './pages/GoogleCallback'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { initScrollAnimations } from './utils/scrollAnimation'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    // Initialize scroll animations after route change
    setTimeout(() => {
      initScrollAnimations()
    }, 100)
  }, [pathname])

  return null
}

function AppRoutes() {
  useEffect(() => {
    initScrollAnimations()
  }, [])

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendation"
          element={
            <ProtectedRoute>
              <Layout>
                <Recommendation />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checklist/:visaId"
          element={
            <ProtectedRoute>
              <Layout>
                <Checklist />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Layout>
                <Documents />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

