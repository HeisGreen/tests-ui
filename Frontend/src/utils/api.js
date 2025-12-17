// API configuration
// Set VITE_API_URL in .env file or it defaults to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Helper function to get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// Helper function to set auth token in localStorage
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token)
}

// Helper function to remove auth token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem('authToken')
}

// API request helper with authentication
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'An error occurred')
  }

  return response.json()
}

// Auth API functions
export const authAPI = {
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  login: async (email, password) => {
    // OAuth2PasswordRequestForm expects form data
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const token = getAuthToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers,
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || 'Login failed')
    }

    return response.json()
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me')
  },

  updateCurrentUser: async (userData) => {
    return apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },
}

// Profile API functions
export const profileAPI = {
  getProfile: async () => {
    return apiRequest('/profile')
  },

  createProfile: async (onboardingData) => {
    return apiRequest('/profile', {
      method: 'POST',
      body: JSON.stringify({
        onboarding_data: onboardingData
      }),
    })
  },

  updateProfile: async (onboardingData) => {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify({
        onboarding_data: onboardingData
      }),
    })
  },
}
