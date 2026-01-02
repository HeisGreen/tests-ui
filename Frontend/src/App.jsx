import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Recommendation from "./pages/Recommendation";
import Checklist from "./pages/Checklist";
import Profile from "./pages/Profile";
import Documents from "./pages/Documents";
import FAQ from "./pages/FAQ";
import GoogleCallback from "./pages/GoogleCallback";
import AgentOnboarding from "./pages/AgentOnboarding";
import Agents from "./pages/Agents";
import Messages from "./pages/Messages";
import TravelAgentHome from "./pages/TravelAgentHome";
import TravelAgentProfile from "./pages/TravelAgentProfile";
import Layout from "./components/Layout";
import TravelAgentLayout from "./components/TravelAgentLayout";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { initScrollAnimations } from "./utils/scrollAnimation";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function RoleBasedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate home based on role
    if (user.role === "TRAVEL_AGENT") {
      return <Navigate to="/agent/home" />;
    } else {
      return <Navigate to="/home" />;
    }
  }

  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Initialize scroll animations after route change
    setTimeout(() => {
      initScrollAnimations();
    }, 100);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  useEffect(() => {
    initScrollAnimations();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/services" element={<Services />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        {/* Default redirect for authenticated users */}
        <Route
          path="/redirect"
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent-onboarding"
          element={
            <ProtectedRoute>
              <AgentOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["USER"]}>
                <Layout>
                  <Home />
                </Layout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendation"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["USER"]}>
                <Layout>
                  <Recommendation />
                </Layout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checklist/:visaId"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["USER"]}>
                <Layout>
                  <Checklist />
                </Layout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["USER"]}>
                <Layout>
                  <Profile />
                </Layout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["USER"]}>
                <Layout>
                  <Documents />
                </Layout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["USER"]}>
                <Layout>
                  <Agents />
                </Layout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["USER"]}>
                <Layout>
                  <Messages />
                </Layout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:conversationId"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["USER"]}>
                <Layout>
                  <Messages />
                </Layout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />

        {/* Travel Agent Routes */}
        <Route
          path="/agent/home"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["TRAVEL_AGENT"]}>
                <TravelAgentLayout>
                  <TravelAgentHome />
                </TravelAgentLayout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/messages"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["TRAVEL_AGENT"]}>
                <TravelAgentLayout>
                  <Messages />
                </TravelAgentLayout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/messages/:conversationId"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["TRAVEL_AGENT"]}>
                <TravelAgentLayout>
                  <Messages />
                </TravelAgentLayout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/profile"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["TRAVEL_AGENT"]}>
                <TravelAgentLayout>
                  <TravelAgentProfile />
                </TravelAgentLayout>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
