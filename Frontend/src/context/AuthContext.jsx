import React, { createContext, useContext, useState, useEffect } from 'react'

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
    return localStorage.getItem('isAuthenticated') === 'true'
  })
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated)
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
  }, [isAuthenticated, user])

  const login = (email, password) => {
    // Dummy authentication
    const dummyUser = {
      id: 1,
      email,
      name: 'John Doe',
      country: 'United States',
      age: 28,
      occupation: 'Software Engineer'
    }
    setUser(dummyUser)
    setIsAuthenticated(true)
    return true
  }

  const register = (userData) => {
    // Dummy registration
    const newUser = {
      id: Date.now(),
      ...userData
    }
    setUser(newUser)
    setIsAuthenticated(true)
    return true
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
  }

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

