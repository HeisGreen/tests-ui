// API configuration
// Set VITE_API_URL in .env file or it defaults to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper function to get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Helper function to set auth token in localStorage
export const setAuthToken = (token) => {
  localStorage.setItem("authToken", token);
};

// Helper function to remove auth token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
};

// API request helper with authentication
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));

    // Handle FastAPI validation errors (422) which return detail as array
    let errorMessage = "An error occurred";
    if (error.detail) {
      if (Array.isArray(error.detail)) {
        // Validation error format: [{loc: [...], msg: "...", type: "..."}]
        errorMessage = error.detail.map((e) => e.msg).join(", ");
      } else {
        errorMessage = error.detail;
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

// Auth API functions
export const authAPI = {
  register: async (userData) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  login: async (email, password) => {
    // OAuth2PasswordRequestForm expects form data
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...headers,
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || "Login failed");
    }

    return response.json();
  },

  getCurrentUser: async () => {
    return apiRequest("/auth/me");
  },

  updateCurrentUser: async (userData) => {
    return apiRequest("/auth/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },
};

// Profile API functions
export const profileAPI = {
  getProfile: async () => {
    return apiRequest("/profile");
  },

  createProfile: async (onboardingData) => {
    return apiRequest("/profile", {
      method: "POST",
      body: JSON.stringify({
        onboarding_data: onboardingData,
      }),
    });
  },

  updateProfile: async (onboardingData) => {
    return apiRequest("/profile", {
      method: "PUT",
      body: JSON.stringify({
        onboarding_data: onboardingData,
      }),
    });
  },
};

// Recommendations API functions
export const recommendationsAPI = {
  /**
   * Get recommendations for the current user
   * @param {boolean} useCached - If true, return stored recommendation. If false, call ChatGPT.
   * @param {object} intake - Optional intake data to send
   */
  getRecommendations: async (useCached = true, intake = null) => {
    const body = { use_cached: useCached };
    if (intake) {
      body.intake = intake;
    }
    return apiRequest("/recommendations", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /**
   * Get recommendation history for the current user
   * @param {number} limit - Maximum number of records to return
   */
  getHistory: async (limit = 10) => {
    return apiRequest(`/recommendations/history?limit=${limit}`);
  },

  /**
   * Get a specific recommendation by ID
   * @param {number} id - Recommendation ID
   */
  getById: async (id) => {
    return apiRequest(`/recommendations/${id}`);
  },
};

// Documents API functions
export const documentsAPI = {
  /**
   * Create a new document
   * @param {object} documentData - Document data including name, type, file_url, file_path, size, etc.
   */
  createDocument: async (documentData) => {
    return apiRequest("/documents", {
      method: "POST",
      body: JSON.stringify(documentData),
    });
  },

  /**
   * Get all documents for the current user
   * @param {string} statusFilter - Optional filter by status ('all', 'pending', 'verified', 'rejected')
   */
  getDocuments: async (statusFilter = "all") => {
    const params = statusFilter !== "all" ? `?status_filter=${statusFilter}` : "";
    return apiRequest(`/documents${params}`);
  },

  /**
   * Get a specific document by ID
   * @param {number} id - Document ID
   */
  getDocument: async (id) => {
    return apiRequest(`/documents/${id}`);
  },

  /**
   * Update a document
   * @param {number} id - Document ID
   * @param {object} updates - Document fields to update
   */
  updateDocument: async (id, updates) => {
    return apiRequest(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete a document
   * @param {number} id - Document ID
   */
  deleteDocument: async (id) => {
    return apiRequest(`/documents/${id}`, {
      method: "DELETE",
    });
  },
};
