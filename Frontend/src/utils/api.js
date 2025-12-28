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

  try {
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

  // Handle 204 No Content responses (common for DELETE endpoints)
  if (response.status === 204) {
    return null;
  }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    return null;
  } catch (error) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.error("Network error:", {
        endpoint: `${API_BASE_URL}${endpoint}`,
        method: options.method || "GET",
        error: error.message,
        message: "This might be a CORS issue or the backend server might not be running.",
      });
      throw new Error(
        `Network error: Unable to connect to ${API_BASE_URL}. Please ensure the backend server is running and accessible.`
      );
    }
    // Re-throw other errors as-is
    throw error;
  }
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

  // OAuth login/signup
  loginWithGoogle: async (idToken) => {
    return apiRequest("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
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

  /**
   * Generate a detailed step-by-step checklist for a visa recommendation
   * @param {object} visaOption - The visa recommendation option
   */
  generateChecklist: async (visaOption) => {
    return apiRequest("/recommendations/checklist", {
      method: "POST",
      body: JSON.stringify({
        visa_option: visaOption,
      }),
    });
  },

  /**
   * Fetch a cached checklist (regenerates via ChatGPT if missing or stale)
   * @param {string} visaType - The visa type identifier
   * @param {object} visaOption - Optional visa recommendation option to compute hash
   */
  getChecklistCached: async (visaType, visaOption = null) => {
    const body = {
      visa_type: visaType,
    };
    if (visaOption) {
      body.visa_option = visaOption;
    }
    return apiRequest("/checklist", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

// Checklist Progress API functions
export const checklistProgressAPI = {
  /**
   * Get saved checklist progress for a visa type
   * @param {string} visaType - The visa type identifier
   * @returns {Promise<object|null>} Progress data or null if none exists
   */
  getProgress: async (visaType) => {
    return apiRequest(
      `/checklist/progress?visa_type=${encodeURIComponent(visaType)}`
    );
  },

  /**
   * Get all checklist progress records for the current user
   * @returns {Promise<Array>} List of all checklist progress records
   */
  getAllProgress: async () => {
    return apiRequest("/checklist/progress/all");
  },

  /**
   * Save or update checklist progress for a visa type
   * @param {string} visaType - The visa type identifier
   * @param {object} progressJson - Progress map { "step-1": true, "step-2": false, ... }
   * @returns {Promise<object>} Saved progress data
   */
  saveProgress: async (visaType, progressJson) => {
    return apiRequest("/checklist/progress", {
      method: "PUT",
      body: JSON.stringify({
        visa_type: visaType,
        progress_json: progressJson,
      }),
    });
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
    const params =
      statusFilter !== "all" ? `?status_filter=${statusFilter}` : "";
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
