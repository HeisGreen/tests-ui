/**
 * Transform form data to backend format
 * Converts comma-separated strings to arrays for List[str] fields
 */
export const transformToBackendFormat = (formData) => {
  const transformed = { ...formData }
  
  // Fields that should be arrays (List[str] in backend)
  const arrayFields = [
    'contact_methods',
    'alternative_countries',
    'degrees',
    'professional_certifications',
    'skills',
    'languages_known',
    'language_tests_taken',
    'prior_visas',
    'international_achievements',
    'awards',
    'media_features',
    'professional_memberships',
  ]
  
  // Convert string fields to arrays
  arrayFields.forEach(field => {
    if (transformed[field] !== null && transformed[field] !== undefined) {
      if (typeof transformed[field] === 'string') {
        // Split by comma and trim, filter out empty strings
        const array = transformed[field]
          .split(',')
          .map(item => item.trim())
          .filter(item => item !== '')
        transformed[field] = array.length > 0 ? array : null
      } else if (Array.isArray(transformed[field])) {
        // Already an array, filter and keep if not empty
        const filtered = transformed[field].filter(item => item !== null && item !== undefined && item !== '')
        transformed[field] = filtered.length > 0 ? filtered : null
      }
    } else if (transformed[field] === '') {
      // Empty string should be null
      transformed[field] = null
    }
  })
  
  // Handle language_scores - should be a dict/object
  if (transformed.language_scores !== null && transformed.language_scores !== undefined) {
    if (typeof transformed.language_scores === 'string') {
      // Try to parse as JSON, or create a simple object
      try {
        transformed.language_scores = JSON.parse(transformed.language_scores)
      } catch (e) {
        // If not valid JSON, try to parse as key-value pairs
        // Format: "IELTS: 7.5, TOEFL: 100"
        const scores = {}
        transformed.language_scores.split(',').forEach(pair => {
          const [key, value] = pair.split(':').map(s => s.trim())
          if (key && value) {
            scores[key] = value
          }
        })
        transformed.language_scores = Object.keys(scores).length > 0 ? scores : null
      }
    }
  }
  
  // Remove any fields that shouldn't be sent (metadata)
  delete transformed.id
  delete transformed.user_id
  delete transformed.created_at
  delete transformed.updated_at
  
  return transformed
}

/**
 * Transform backend data to form format
 * Converts arrays to comma-separated strings for form inputs
 */
export const transformToFormFormat = (backendData) => {
  if (!backendData) return null
  
  const transformed = { ...backendData }
  
  // Fields that should be strings in the form (but arrays in backend)
  const arrayFields = [
    'contact_methods',
    'alternative_countries',
    'degrees',
    'professional_certifications',
    'skills',
    'languages_known',
    'language_tests_taken',
    'prior_visas',
    'international_achievements',
    'awards',
    'media_features',
    'professional_memberships',
  ]
  
  // Convert arrays to comma-separated strings
  arrayFields.forEach(field => {
    if (transformed[field] !== null && transformed[field] !== undefined) {
      if (Array.isArray(transformed[field])) {
        transformed[field] = transformed[field].join(', ')
      }
    }
  })
  
  // Handle language_scores - convert object to string
  if (transformed.language_scores !== null && transformed.language_scores !== undefined) {
    if (typeof transformed.language_scores === 'object' && !Array.isArray(transformed.language_scores)) {
      // Convert object to string format: "IELTS: 7.5, TOEFL: 100"
      const pairs = Object.entries(transformed.language_scores)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
      transformed.language_scores = pairs || null
    }
  }
  
  return transformed
}
