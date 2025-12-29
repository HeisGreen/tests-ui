import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, profileAPI, setAuthToken, removeAuthToken, getAuthToken } from '../utils/api'
import { triggerGoogleSignIn } from '../utils/oauth'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!getAuthToken()
  })
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [onboardingData, setOnboardingData] = useState(() => {
    const savedData = localStorage.getItem('onboardingData')
    return savedData ? JSON.parse(savedData) : null
  })
  const [loading, setLoading] = useState(true)

  // Load profile data from backend
  const loadProfileData = async () => {
    try {
      const profile = await profileAPI.getProfile()
      if (profile && profile.onboarding_data) {
        setOnboardingData(profile.onboarding_data)
        localStorage.setItem('onboardingData', JSON.stringify(profile.onboarding_data))
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
      // Profile might not exist yet, which is okay
    }
  }

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken()
      if (token && !user) {
        try {
          const userData = await authAPI.getCurrentUser()
          setUser(userData)
          setIsAuthenticated(true)
          // Load profile data
          await loadProfileData()
        } catch (error) {
          // Token is invalid or backend is unavailable, clear it
          console.warn('Auth check failed (backend may be unavailable):', error.message)
          removeAuthToken()
          setIsAuthenticated(false)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
    if (onboardingData) {
      localStorage.setItem('onboardingData', JSON.stringify(onboardingData))
    }
  }, [user, onboardingData])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      setAuthToken(response.access_token)
      
      // Get user data
      const userData = await authAPI.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
      
      // Load profile data
      await loadProfileData()
      
      return userData // Return user data so caller can check role
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const newUser = await authAPI.register(userData)
      
      // Automatically log in after registration
      const response = await authAPI.login(userData.email, userData.password)
      setAuthToken(response.access_token)
      
      setUser(newUser)
      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setOnboardingData(null)
    setIsAuthenticated(false)
    removeAuthToken()
    localStorage.removeItem('user')
    localStorage.removeItem('onboardingData')
  }

  const updateOnboardingData = async (data) => {
    try {
      // Save to backend
      await profileAPI.updateProfile(data)
      // Update local state
      setOnboardingData(data)
      localStorage.setItem('onboardingData', JSON.stringify(data))
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      // Still update local state even if backend save fails
      setOnboardingData(data)
      localStorage.setItem('onboardingData', JSON.stringify(data))
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const loginWithGoogle = async () => {
    try {
      // Sign in with Google
      const googleUser = await triggerGoogleSignIn()
      
      // Send ID token to backend for verification
      const response = await authAPI.loginWithGoogle(googleUser.idToken)
      setAuthToken(response.access_token)
      
      // Get user data
      const userData = await authAPI.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
      
      // Load profile data
      await loadProfileData()
      
      return userData // Return user data so caller can check role
    } catch (error) {
      console.error('Google login error:', error)
      // Provide more helpful error message
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on port 8000.')
      }
      throw error
    }
  }

  const signUpWithGoogle = async () => {
    // For OAuth providers, sign up and sign in are typically the same flow
    return loginWithGoogle()
  }

  const value = {
    isAuthenticated,
    user,
    onboardingData,
    loading,
    login,
    register,
    logout,
    updateOnboardingData,
    refreshUser,
    loginWithGoogle,
    signUpWithGoogle
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

