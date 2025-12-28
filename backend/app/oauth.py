"""
OAuth verification utilities for Google authentication.
"""
from typing import Dict
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from fastapi import HTTPException, status
from app.config import Settings


async def verify_google_token(id_token: str, settings: Settings) -> Dict[str, str]:
    """
    Verify Google ID token and extract user information.
    
    Args:
        id_token: Google ID token from frontend
        settings: Application settings
        
    Returns:
        Dictionary with email and name
        
    Raises:
        HTTPException if token is invalid
    """
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables."
        )
    
    try:
        # Verify the token
        idinfo = google_id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            settings.google_client_id
        )
        
        # Verify the issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        # Extract user information
        email = idinfo.get('email')
        if not email:
            raise ValueError('Email not provided in token')
        
        name = idinfo.get('name', email.split('@')[0])
        picture = idinfo.get('picture', '')
        
        return {
            'email': email,
            'name': name,
            'picture': picture
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google token verification failed: {str(e)}"
        )

