// ========================================
// SPOTIFY API CONFIGURATION
// ========================================
// Replace these values with your own from Spotify Developer Dashboard
// https://developer.spotify.com/dashboard

const CONFIG = {
    CLIENT_ID: 'a4e955d8e3cb4ae594e7a065217c50a4',
    CLIENT_SECRET: '6c0bd99e0a1b40f29079b2ac579ac271',
    REDIRECT_URI: 'http://127.0.0.1:5501/spotify-api-project/', // Change to your redirect URI
    AUTH_URL: 'https://accounts.spotify.com/authorize',
    API_BASE_URL: 'https://api.spotify.com/v1'
};

// ========================================
// SCOPES - What permissions we're requesting
// ========================================
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
];
