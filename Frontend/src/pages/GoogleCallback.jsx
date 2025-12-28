import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse hash fragment (Google uses hash for id_token response)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    // Get the ID token from hash or query params
    const idToken = hashParams.get('id_token') || queryParams.get('id_token');
    const state = hashParams.get('state') || queryParams.get('state');
    const error = hashParams.get('error') || queryParams.get('error');

    // Verify state matches what we stored
    const storedState = sessionStorage.getItem('google_oauth_state');
    
    const sendMessageAndClose = (data) => {
      // Send message to parent window
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_CALLBACK',
            ...data
          }, window.location.origin);
        } catch (e) {
          console.error('Failed to send message to parent:', e);
        }
      }
      
      // Close this window after a short delay to ensure message is sent
      // Note: window.close() may be blocked by browser, but that's okay
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          // window.close() may be blocked - that's okay, user can close manually
          console.log('Popup will close automatically or can be closed manually');
        }
      }, 100);
    };
    
    if (error) {
      // Send error to parent window
      sendMessageAndClose({
        error: decodeURIComponent(error)
      });
      return;
    }

    if (idToken && state === storedState) {
      // Send ID token to parent window
      sendMessageAndClose({
        idToken: idToken
      });
    } else {
      // Invalid response
      sendMessageAndClose({
        error: 'Invalid response from Google'
      });
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui'
    }}>
      <p>Completing sign-in...</p>
    </div>
  );
}

export default GoogleCallback;

