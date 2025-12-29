import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RoleBasedRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect based on role
  if (user.role === "TRAVEL_AGENT") {
    return <Navigate to="/agent/home" />;
  } else {
    return <Navigate to="/home" />;
  }
}

export default RoleBasedRedirect;

