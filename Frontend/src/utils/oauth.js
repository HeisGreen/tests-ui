/**
 * OAuth utilities for Google authentication
 * Uses a simple popup-based OAuth2 flow to avoid FedCM/One Tap issues
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Trigger Google sign-in using popup window
 * This approach avoids FedCM/One Tap CORS issues by using a standard OAuth2 popup flow
 */
export async function triggerGoogleSignIn() {
  if (!GOOGLE_CLIENT_ID) {
    console.error('❌ Google Client ID is missing!');
    console.error('Please add VITE_GOOGLE_CLIENT_ID to your Frontend/.env file');
    console.error('Example: VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com');
    throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
  }
  
  // Debug: Log the Client ID (first and last few characters only for security)
  if (GOOGLE_CLIENT_ID.length > 20) {
    const maskedId = GOOGLE_CLIENT_ID.substring(0, 10) + '...' + GOOGLE_CLIENT_ID.substring(GOOGLE_CLIENT_ID.length - 10);
    console.log('✅ Google Client ID loaded:', maskedId);
  } else {
    console.warn('⚠️ Google Client ID seems too short. Please verify it\'s correct.');
  }

  return new Promise((resolve, reject) => {
    // Generate a random state for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store state in sessionStorage to verify callback
    sessionStorage.setItem('google_oauth_state', state);
    sessionStorage.setItem('google_oauth_nonce', nonce);
    
    // Build OAuth2 authorization URL
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=id_token&` +
      `scope=openid email profile&` +
      `state=${encodeURIComponent(state)}&` +
      `nonce=${encodeURIComponent(nonce)}&` +
      `prompt=select_account`;
    
    // Open popup window
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      authUrl,
      'google-signin',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
    
    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }
    
    // Track if we've received a response to avoid duplicate handling
    let resolved = false;
    
    // Note: We don't check popup.closed because Google's COOP headers block it
    // Instead, we rely on postMessage for success and timeout for cancellation
    // The callback page will close itself automatically after sending the message
    
    // Listen for message from popup (postMessage works despite COOP)
    const messageHandler = (event) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data && event.data.type === 'GOOGLE_OAUTH_CALLBACK' && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        window.removeEventListener('message', messageHandler);
        sessionStorage.removeItem('google_oauth_state');
        sessionStorage.removeItem('google_oauth_nonce');
        
        // Don't try to close popup - callback page closes itself
        // COOP policy blocks popup.close() anyway
        
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else if (event.data.idToken) {
          resolve({
            idToken: event.data.idToken,
            provider: 'google'
          });
        }
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Timeout after 5 minutes - handles case where user closes popup without completing
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('message', messageHandler);
        // Don't try to close popup - COOP blocks it and callback page handles it
        sessionStorage.removeItem('google_oauth_state');
        sessionStorage.removeItem('google_oauth_nonce');
        reject(new Error('Google sign-in timed out or was cancelled. Please try again.'));
      }
    }, 300000);
  });
}

