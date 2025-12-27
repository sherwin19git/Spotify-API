// ========================================
// SPOTIFY WEB API INTEGRATION
// ========================================

// ========================================
// SPOTIFY SDK CALLBACK - Define FIRST before anything else
// ========================================
console.log('Setting up onSpotifyWebPlaybackSDKReady callback at script load time');
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log('✓✓✓ onSpotifyWebPlaybackSDKReady callback FIRED ✓✓✓');
    if (window.spotifyPlayerReadyCallback) {
        window.spotifyPlayerReadyCallback();
    }
};

// ========================================
// STATE MANAGEMENT
// ========================================
let accessToken = null;
let isAuthenticated = false;
let spotifyPlayer = null;
let deviceId = null;
let currentPlayback = null;

// ========================================
// SPOTIFY SDK READY HANDLER
// ========================================
window.spotifyPlayerReadyCallback = function() {
    console.log('spotifyPlayerReadyCallback triggered');
    if (isAuthenticated && accessToken && typeof Spotify !== 'undefined') {
        console.log('Conditions met - initializing player');
        initializeSpotifyPlayer();
    } else {
        console.log('Waiting for auth before initializing. Auth:', isAuthenticated, 'Token:', !!accessToken, 'Spotify:', typeof Spotify);
    }
};

// Poll to check if SDK loaded (fallback)
function checkSpotifySDKLoaded() {
    if (typeof Spotify !== 'undefined' && Spotify.Player) {
        console.log('✓ Spotify SDK available');
        return true;
    }
    console.log('Spotify SDK not available yet');
    return false;
}

// Start checking for SDK and initializing player
let sdkCheckInterval = null;
function startSDKCheck() {
    console.log('startSDKCheck called, authenticated:', isAuthenticated);
    if (sdkCheckInterval) clearInterval(sdkCheckInterval);
    
    // First check if SDK is already loaded
    if (checkSpotifySDKLoaded()) {
        console.log('SDK already available, initializing');
        if (isAuthenticated && accessToken) {
            initializeSpotifyPlayer();
        }
        return;
    }
    
    // If not loaded, poll for it
    console.log('SDK not loaded yet, polling...');
    sdkCheckInterval = setInterval(() => {
        if (checkSpotifySDKLoaded() && isAuthenticated && accessToken) {
            console.log('✓ SDK loaded and authenticated, initializing player');
            clearInterval(sdkCheckInterval);
            initializeSpotifyPlayer();
        }
    }, 500);
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Check if user has token in URL (OAuth redirect)
    handleAuthCallback();
    
    // Check if token is stored in localStorage
    const storedToken = localStorage.getItem('spotifyAccessToken');
    const tokenExpiry = localStorage.getItem('spotifyTokenExpiry');
    
    if (storedToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
        accessToken = storedToken;
        isAuthenticated = true;
        showMainContent();
        initializeSpotifyPlayer();
    }
}

function setupEventListeners() {
    const authBtn = document.getElementById('authBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (authBtn) {
        authBtn.addEventListener('click', initiateSpotifyAuth);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    attachSearchFormListener();
}

function attachSearchFormListener() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        // Remove old listener to avoid duplicates
        searchForm.removeEventListener('submit', handleSearch);
        // Attach new listener
        searchForm.addEventListener('submit', handleSearch);
        console.log('Search form listener attached');
    } else {
        console.log('Search form not found in DOM');
    }
}

// ========================================
// AUTHENTICATION - OAuth 2.0 Flow
// ========================================
function initiateSpotifyAuth() {
    const authBtn = document.getElementById('authBtn');
    authBtn.disabled = true;
    authBtn.textContent = 'Redirecting to Spotify...';

    // Generate PKCE code
    const codeVerifier = generateRandomString(128);
    localStorage.setItem('pkce_code_verifier', codeVerifier);
    
    // Generate code challenge using SHA256
    generateCodeChallenge(codeVerifier).then(codeChallenge => {
        const state = generateRandomString(16);
        localStorage.setItem('oauth_state', state);

        // Generate authorization URL with PKCE S256
        const params = new URLSearchParams({
            client_id: CONFIG.CLIENT_ID,
            response_type: 'code',
            redirect_uri: CONFIG.REDIRECT_URI,
            scope: SCOPES.join(' '),
            state: state,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge
        });

        window.location.href = `${CONFIG.AUTH_URL}?${params}`;
    });
}

/**
 * Generate SHA256 code challenge for PKCE
 */
async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashBase64 = btoa(String.fromCharCode(...hashArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    return hashBase64;
}

/**
 * Handle OAuth callback from Spotify
 * Exchanges authorization code for access token using PKCE
 */
function handleAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const state = params.get('state');

    // Clear URL for security
    window.history.replaceState(null, null, window.location.pathname);

    if (error) {
        showAuthError(`Authentication failed: ${error}`);
        return;
    }

    if (code) {
        // Exchange code for token
        exchangeCodeForToken(code);
    }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code) {
    try {
        const codeVerifier = localStorage.getItem('pkce_code_verifier');
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(CONFIG.CLIENT_ID + ':' + CONFIG.CLIENT_SECRET)
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: CONFIG.REDIRECT_URI,
                code_verifier: codeVerifier
            })
        });

        const data = await response.json();

        if (data.error) {
            showAuthError(`Token exchange failed: ${data.error}`);
            return;
        }

        if (data.access_token) {
            accessToken = data.access_token;
            isAuthenticated = true;
            
            // Store token with expiry
            const expiryTime = new Date().getTime() + ((data.expires_in || 3600) * 1000);
            localStorage.setItem('spotifyAccessToken', data.access_token);
            localStorage.setItem('spotifyTokenExpiry', expiryTime.toString());
            
            // Clear PKCE values
            localStorage.removeItem('pkce_code_verifier');
            localStorage.removeItem('oauth_state');

            showAuthSuccess();
            showMainContent();
            startSDKCheck();
        }
    } catch (error) {
        console.error('Token exchange error:', error);
        showAuthError('Failed to exchange code for token');
    }
}

function handleLogout() {
    accessToken = null;
    isAuthenticated = false;
    spotifyPlayer = null;
    deviceId = null;
    localStorage.removeItem('spotifyAccessToken');
    localStorage.removeItem('spotifyTokenExpiry');
    
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    document.getElementById('playerContainer').style.display = 'none';
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('authStatus').textContent = '';
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('authBtn').disabled = false;
    document.getElementById('authBtn').textContent = 'Connect to Spotify';
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================
/**
 * Handle search form submission
 * Fetches data from Spotify API
 */
async function handleSearch(event) {
    event.preventDefault();

    const searchInput = document.getElementById('searchInput');
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const query = searchInput.value.trim();

    // Input validation
    if (!query) {
        showError('Please enter a search term');
        return;
    }

    if (query.length < 2) {
        showError('Search term must be at least 2 characters');
        return;
    }

    // Disable search button during API call
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';

    // Show loading indicator
    showLoading();
    closeError();

    try {
        const results = await searchSpotify(query, searchType);
        displayResults(results, searchType);
    } catch (error) {
        handleApiError(error);
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
        hideLoading();
    }
}

/**
 * Search Spotify API
 * Endpoint: GET /search
 * 
 * @param {string} query - Search term
 * @param {string} type - Search type (track, artist, album)
 * @returns {Promise<Object>} Search results
 */
async function searchSpotify(query, type) {
    if (!isAuthenticated) {
        throw new Error('Not authenticated. Please connect to Spotify first.');
    }

    const params = new URLSearchParams({
        q: query,
        type: type,
        limit: 20
    });

    const response = await fetch(
        `${CONFIG.API_BASE_URL}/search?${params}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return handleApiResponse(response);
}

/**
 * Get current user profile
 * Endpoint: GET /me
 * (Can be used to display user info)
 */
async function getUserProfile() {
    if (!isAuthenticated) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(
        `${CONFIG.API_BASE_URL}/me`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return handleApiResponse(response);
}

/**
 * Load and display user profile
 */
async function loadUserProfile() {
    try {
        const profile = await getUserProfile();
        displayUserProfile(profile);
        loadUserPlaylists();
    } catch (error) {
        console.error('Error loading profile:', error);
        // Don't show error to user, profile is optional
    }
}

/**
 * Display user profile information in the UI
 * @param {Object} profile - User profile data from Spotify API
 */
function displayUserProfile(profile) {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileImage = document.getElementById('profileImage');
    const profileFollowers = document.getElementById('profileFollowers');
    const profilePlan = document.getElementById('profilePlan');

    if (profileName) {
        profileName.textContent = profile.display_name || 'Spotify User';
    }

    if (profileEmail) {
        profileEmail.textContent = profile.email || '-';
    }

    if (profileImage && profile.images && profile.images.length > 0) {
        profileImage.src = profile.images[0].url;
    }

    if (profileFollowers) {
        profileFollowers.textContent = (profile.followers?.total || 0).toLocaleString();
    }

    if (profilePlan) {
        profilePlan.textContent = profile.product || 'Free';
    }

    console.log('User profile loaded:', profile.display_name);
}

/**
 * Fetch user's playlists
 * Endpoint: GET /me/playlists
 */
async function getUserPlaylists() {
    if (!isAuthenticated) {
        throw new Error('Not authenticated');
    }

    const params = new URLSearchParams({
        limit: 50
    });

    const response = await fetch(
        `${CONFIG.API_BASE_URL}/me/playlists?${params}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return handleApiResponse(response);
}

/**
 * Load and display user playlists
 */
async function loadUserPlaylists() {
    try {
        const data = await getUserPlaylists();
        displayUserPlaylists(data);
    } catch (error) {
        console.error('Error loading playlists:', error);
    }
}

/**
 * Display user playlists in the UI
 * @param {Object} data - Playlists data from Spotify API
 */
function displayUserPlaylists(data) {
    const playlistsContainer = document.getElementById('playlistsContainer');
    const playlistsSection = document.getElementById('playlistsSection');
    const noPlaylists = document.getElementById('noPlaylists');

    if (!data.items || data.items.length === 0) {
        if (noPlaylists) {
            noPlaylists.style.display = 'block';
        }
        if (playlistsSection) {
            playlistsSection.style.display = 'none';
        }
        return;
    }

    if (noPlaylists) {
        noPlaylists.style.display = 'none';
    }

    playlistsContainer.innerHTML = '';

    data.items.forEach(playlist => {
        const playlistCard = createPlaylistCard(playlist);
        playlistsContainer.appendChild(playlistCard);
    });

    if (playlistsSection) {
        playlistsSection.style.display = 'block';
    }

    console.log('Playlists loaded:', data.items.length);
}

/**
 * Create a playlist card element
 * @param {Object} playlist - Playlist data
 */
function createPlaylistCard(playlist) {
    const card = document.createElement('div');
    card.className = 'playlist-card';

    const imageUrl = playlist.images?.[0]?.url || null;
    const imageHTML = imageUrl 
        ? `<img src="${imageUrl}" alt="${playlist.name}" class="playlist-image">`
        : `<div class="no-image">🎵</div>`;

    const owner = playlist.owner?.display_name || 'Unknown';
    const tracks = playlist.tracks?.total || 0;
    const externalLink = playlist.external_urls?.spotify || '#';

    card.innerHTML = `
        ${imageHTML}
        <h3 title="${playlist.name}">${playlist.name}</h3>
        <p class="playlist-owner">${owner}</p>
        <div class="playlist-meta">
            ${tracks} track${tracks !== 1 ? 's' : ''}
        </div>
        <a href="${externalLink}" target="_blank" class="result-link">Open in Spotify</a>
    `;

    return card;
}

/**
 * Get artist details
 * Endpoint: GET /artists/{id}
 * 
 * @param {string} artistId - Spotify artist ID
 */
async function getArtistDetails(artistId) {
    if (!isAuthenticated) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(
        `${CONFIG.API_BASE_URL}/artists/${artistId}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return handleApiResponse(response);
}

/**
 * Get track details
 * Endpoint: GET /tracks/{id}
 * 
 * @param {string} trackId - Spotify track ID
 */
async function getTrackDetails(trackId) {
    if (!isAuthenticated) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(
        `${CONFIG.API_BASE_URL}/tracks/${trackId}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return handleApiResponse(response);
}

// ========================================
// API RESPONSE HANDLING
// ========================================
/**
 * Handle API responses and errors
 * @param {Response} response - Fetch API response
 */
async function handleApiResponse(response) {
    const data = await response.json();

    // Handle different HTTP status codes
    switch (response.status) {
        case 200:
        case 201:
            return data;
        
        case 400:
            throw new Error('Invalid request: ' + (data.error?.message || 'Bad request'));
        
        case 401:
            throw new Error('Unauthorized: Your session expired. Please reconnect.');
        
        case 403:
            throw new Error('Forbidden: You do not have permission to access this resource.');
        
        case 404:
            throw new Error('Not found: The requested resource was not found.');
        
        case 429:
            throw new Error('Rate limited: Too many requests. Please try again later.');
        
        case 500:
            throw new Error('Server error: Spotify API is experiencing issues.');
        
        default:
            throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
}

// ========================================
// DISPLAY RESULTS
// ========================================
/**
 * Display search results in the DOM
 * @param {Object} data - API response data
 * @param {string} type - Search type (track, artist, album)
 */
function displayResults(data, type) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    let items = [];

    // Extract items based on search type
    if (type === 'track' && data.tracks?.items) {
        items = data.tracks.items;
    } else if (type === 'artist' && data.artists?.items) {
        items = data.artists.items;
    } else if (type === 'album' && data.albums?.items) {
        items = data.albums.items;
    }

    // Show "no results" message if empty
    if (items.length === 0) {
        const noResults = document.getElementById('noResults');
        if (noResults) {
            noResults.style.display = 'block';
        }
        return;
    }

    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.style.display = 'none';
    }

    // Create cards for each result
    items.forEach(item => {
        const card = createResultCard(item, type);
        container.appendChild(card);
    });
}

/**
 * Create a result card element
 * @param {Object} item - Item data from API
 * @param {string} type - Item type
 */
function createResultCard(item, type) {
    const card = document.createElement('div');
    card.className = 'result-card';

    // Get image URL (handling different API response formats)
    const imageUrl = item.images?.[0]?.url || null;
    const imageHTML = imageUrl 
        ? `<img src="${imageUrl}" alt="${item.name}" class="result-image">`
        : `<div class="no-image">🎵</div>`;

    // Build card content based on item type
    let additionalInfo = '';
    let externalLink = item.external_urls?.spotify || '#';

    if (type === 'track') {
        const artists = item.artists?.map(a => a.name).join(', ') || 'Unknown';
        const album = item.album?.name || 'Unknown';
        additionalInfo = `
            <p>${artists}</p>
            <div class="result-meta">
                Album: ${album} | Duration: ${formatDuration(item.duration_ms)}
            </div>
        `;
    } else if (type === 'artist') {
        const genres = item.genres?.slice(0, 2).join(', ') || 'No genre info';
        const followers = item.followers?.total.toLocaleString() || '0';
        additionalInfo = `
            <p>${genres}</p>
            <div class="result-meta">
                Followers: ${followers}
            </div>
        `;
    } else if (type === 'album') {
        const artists = item.artists?.map(a => a.name).join(', ') || 'Unknown';
        const releaseDate = item.release_date || 'Unknown';
        additionalInfo = `
            <p>${artists}</p>
            <div class="result-meta">
                Released: ${releaseDate} | Tracks: ${item.total_tracks}
            </div>
        `;
    }

    card.innerHTML = `
        ${imageHTML}
        <h3 title="${item.name}">${item.name}</h3>
        ${additionalInfo}
        <a href="${externalLink}" target="_blank" class="result-link">View on Spotify</a>
        ${type === 'track' ? `<button class="btn btn-play" data-track-uri="${item.uri}">▶ Play</button>` : ''}
    `;

    // Add play button event listener for tracks
    if (type === 'track') {
        const playBtn = card.querySelector('.btn-play');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.preventDefault();
                playTrack(item.uri, item);
            });
        }
    }

    return card;
}

// ========================================
// SPOTIFY WEB PLAYBACK SDK
// ========================================
/**
 * Initialize Spotify Web Playback SDK
 * Must be called after user is authenticated
 */
function initializeSpotifyPlayer() {
    // Check if Spotify SDK is loaded
    if (typeof Spotify === 'undefined' || !Spotify.Player) {
        console.error('Spotify SDK not loaded');
        showError('Spotify Web Playback SDK not loaded. Please refresh the page.');
        return;
    }

    if (!accessToken) {
        console.error('No access token available');
        showError('No access token. Please re-authenticate.');
        return;
    }

    const player = new Spotify.Player({
        name: 'Spotify API Explorer',
        getOAuthToken: cb => { 
            console.log('getOAuthToken callback called, token:', accessToken ? 'available' : 'null');
            if (accessToken) {
                cb(accessToken);
            } else {
                console.error('Token is null in getOAuthToken callback');
                cb(null);
            }
        },
        volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
        console.error('❌ Initialization Error:', message);
        showError('Failed to initialize player: ' + message);
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error('❌ Authentication Error:', message);
        showError('Player authentication failed. Ensure you have Spotify Premium and try re-authenticating.');
        handleLogout();
    });

    player.addListener('account_error', ({ message }) => {
        console.error('❌ Account Error:', message);
        showError('Account error: ' + message);
    });

    player.addListener('playback_error', ({ message }) => {
        console.error('❌ Playback Error:', message);
        showError('Playback error: ' + message);
    });

    // Playback status updates
    player.addListener('player_state_changed', state => {
        console.log('Player state changed:', state);
        if (state) {
            currentPlayback = state;
            updatePlayerUI(state);
        }
    });

    // Connect to the player
    console.log('🔌 Attempting to connect player... Token available:', !!accessToken);
    
    // Set spotifyPlayer immediately - don't wait for promise
    spotifyPlayer = player;
    console.log('✅ spotifyPlayer set immediately');
    setupPlayerControls();
    
    // The ready event will fire when connection is successful
    player.addListener('ready', ({ device_id }) => {
        console.log('✅✅✅ Player READY event fired with device ID:', device_id);
        deviceId = device_id;
        showError('Player connected successfully!', 'success');
    });
    
    player.addListener('not_ready', ({ device_id }) => {
        console.warn('⚠️ Player not ready - connection lost');
    });
    
    // Now try to connect
    console.log('🔌 Calling player.connect()...');
    player.connect().then(success => {
        console.log('🔌 player.connect() promise resolved with:', success);
        if (success) {
            console.log('✅ Connection successful');
            
            // Get device ID from current state
            setTimeout(() => {
                player.getCurrentState().then(state => {
                    if (state && state.device_id) {
                        deviceId = state.device_id;
                        console.log('✅ Device ID from state:', deviceId);
                    } else {
                        console.log('No device ID from player state, fetching from API...');
                        getAvailableDevices();
                    }
                });
            }, 500);
        } else {
            console.error('❌ player.connect() returned false');
            console.log('Attempting to get devices from API as fallback...');
            getAvailableDevices();
        }
    }).catch(error => {
        console.error('❌ player.connect() error:', error);
        console.log('Getting devices from API as fallback...');
        getAvailableDevices();
    });
    
    // IMPORTANT: Also try to get devices from API after a delay
    // Sometimes the player doesn't provide device ID but the API does
    setTimeout(() => {
        if (!deviceId) {
            console.log('⏱️ Timeout - still no deviceId, fetching from API...');
            getAvailableDevices();
        }
    }, 2000);
}

/**
 * Get available devices from Spotify Web API
 */
async function getAvailableDevices() {
    try {
        console.log('📱 Fetching available devices from API...');
        const response = await fetch(`${CONFIG.API_BASE_URL}/me/player/devices`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('📱 API response:', data);
        console.log('📱 Available devices:', data.devices);

        if (data.devices && data.devices.length > 0) {
            console.log('📱 Found', data.devices.length, 'device(s)');
            // Use the first active device, or the first available device
            const activeDevice = data.devices.find(d => d.is_active);
            const targetDevice = activeDevice || data.devices[0];
            deviceId = targetDevice.id;
            console.log('✅ Using device:', targetDevice.name, '(ID:', deviceId + ')');
            showError('✅ Using device: ' + targetDevice.name);
            return targetDevice;
        } else {
            console.warn('⚠️ No devices available on API');
            showError('No active Spotify devices found. Open Spotify on your phone, desktop, or in another browser tab.');
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching devices:', error);
        showError('Could not fetch available devices: ' + error.message);
        return null;
    }
}

/**
 * Play a track using the Web Playback SDK
 * @param {string} trackUri - Spotify track URI (spotify:track:xxxxx)
 * @param {Object} trackData - Track metadata for UI updates
 */
async function playTrack(trackUri, trackData) {
    console.log('playTrack called with URI:', trackUri);
    
    if (!spotifyPlayer) {
        console.error('spotifyPlayer is null');
        showError('Player not initialized. Please refresh the page.');
        return;
    }

    console.log('Current deviceId:', deviceId);
    console.log('Current spotifyPlayer:', spotifyPlayer);

    // If we don't have deviceId yet, try multiple methods to get it
    if (!deviceId && spotifyPlayer) {
        console.log('Getting device ID from player state...');
        const state = await spotifyPlayer.getCurrentState();
        if (state && state.device_id) {
            deviceId = state.device_id;
            console.log('Device ID retrieved from state:', deviceId);
        } else {
            console.log('No device in player state:', state);
        }
    }

    // If still no deviceId, fetch available devices from API
    if (!deviceId) {
        console.log('Attempting to fetch available devices from API...');
        await getAvailableDevices();
    }

    console.log('DeviceId before playback:', deviceId);

    if (!deviceId) {
        showError('No device ID found. Make sure Spotify is open on a device or browser tab and try again.');
        return;
    }

    try {
        console.log('Sending play request to Spotify API with device:', deviceId);
        const response = await fetch(`${CONFIG.API_BASE_URL}/me/player/play`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: deviceId,
                uris: [trackUri]
            })
        });

        console.log('Play response status:', response.status);

        if (response.status === 204 || response.ok) {
            console.log('Track started playing:', trackData.name);
        } else if (response.status === 404) {
            console.error('No active device found (404)');
            showError('No active device found. Make sure Spotify is open on a device.');
        } else if (response.status === 401) {
            console.error('Authentication expired (401)');
            showError('Authentication expired. Please re-authenticate.');
            handleLogout();
        } else {
            try {
                const error = await response.json();
                console.error('API error response:', error);
                showError('Error playing track: ' + (error.error?.message || 'Unknown error'));
            } catch {
                showError('Error playing track. Status: ' + response.status);
            }
        }
    } catch (error) {
        console.error('Play error:', error);
        showError('Failed to play track');
    }
}

/**
 * Setup player control buttons
 */
function setupPlayerControls() {
    const playBtn = document.getElementById('playerPlay');
    const prevBtn = document.getElementById('playerPrev');
    const nextBtn = document.getElementById('playerNext');

    if (playBtn) {
        playBtn.addEventListener('click', togglePlayback);
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', previousTrack);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', nextTrack);
    }
}

/**
 * Toggle playback (play/pause)
 */
function togglePlayback() {
    if (spotifyPlayer) {
        spotifyPlayer.togglePlay();
    }
}

/**
 * Play previous track
 */
function previousTrack() {
    if (spotifyPlayer) {
        spotifyPlayer.previousTrack();
    }
}

/**
 * Play next track
 */
function nextTrack() {
    if (spotifyPlayer) {
        spotifyPlayer.nextTrack();
    }
}

/**
 * Update player UI with current playback state
 * @param {Object} state - Spotify player state
 */
function updatePlayerUI(state) {
    const playerContainer = document.getElementById('playerContainer');
    const trackName = document.getElementById('playerTrackName');
    const artistName = document.getElementById('playerArtistName');
    const artwork = document.getElementById('playerArtwork');
    const playBtn = document.getElementById('playerPlay');

    if (!state.current_track_window.current_track) {
        playerContainer.style.display = 'none';
        return;
    }

    playerContainer.style.display = 'block';

    const track = state.current_track_window.current_track;
    const artists = track.artists.map(a => a.name).join(', ');

    trackName.textContent = track.name;
    artistName.textContent = artists;
    artwork.src = track.album.images[0]?.url || '';
    playBtn.textContent = state.paused ? '▶' : '⏸';

    // Update progress bar
    const duration = track.duration_ms;
    const position = state.position;
    const progress = (position / duration) * 100;
    document.getElementById('playerProgressBar').style.width = progress + '%';

    // Update time display
    document.getElementById('playerCurrentTime').textContent = formatDuration(position);
    document.getElementById('playerDuration').textContent = formatDuration(duration);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
/**
 * Format milliseconds to MM:SS format
 * @param {number} ms - Duration in milliseconds
 */
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Generate random string for OAuth state parameter
 * @param {number} length - String length
 */
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ========================================
// UI STATE MANAGEMENT
// ========================================
function showMainContent() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('profileSection').style.display = 'block';
    attachSearchFormListener();
    showAuthSuccess();
    loadUserProfile();
    startSDKCheck();
}

function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorContainer.classList.add('display-error');
    errorContainer.style.display = 'flex';
}

function closeError() {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.classList.remove('display-error');
    errorContainer.style.display = 'none';
}

function showAuthSuccess() {
    const authStatus = document.getElementById('authStatus');
    authStatus.textContent = '✓ Successfully connected to Spotify!';
    authStatus.className = 'auth-status success';
}

function showAuthError(message) {
    const authBtn = document.getElementById('authBtn');
    authBtn.disabled = false;
    authBtn.textContent = 'Connect to Spotify';

    const authStatus = document.getElementById('authStatus');
    authStatus.textContent = message;
    authStatus.className = 'auth-status error';
}

// ========================================
// ERROR HANDLING
// ========================================
/**
 * Handle API errors with user-friendly messages
 * @param {Error} error - Error object
 */
function handleApiError(error) {
    console.error('API Error:', error);

    let userMessage = 'An error occurred while fetching data.';

    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        userMessage = 'Your session has expired. Please reconnect to Spotify.';
        handleLogout();
    } else if (error.message.includes('Rate limited') || error.message.includes('429')) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('Not authenticated')) {
        userMessage = 'Please connect to Spotify first.';
    } else if (error.message.includes('Forbidden') || error.message.includes('403')) {
        userMessage = 'You do not have permission to access this resource.';
    } else if (error.message.includes('Not found') || error.message.includes('404')) {
        userMessage = 'Resource not found.';
    } else {
        userMessage = error.message || userMessage;
    }

    showError(userMessage);
}

// ========================================
// API DOCUMENTATION
// ========================================
/*
BASE URL: https://api.spotify.com/v1

ENDPOINTS USED IN THIS PROJECT:
1. GET /search - Search for tracks, artists, or albums
   Parameters: q (query), type (track|artist|album), limit
   Returns: Matching items with metadata

2. GET /me - Get current user's profile
   Parameters: None (uses Bearer token)
   Returns: User profile including display_name, email, followers

3. GET /artists/{id} - Get artist details
   Parameters: id (artist ID)
   Returns: Artist info, genres, followers, images

4. GET /tracks/{id} - Get track details
   Parameters: id (track ID)
   Returns: Track info, duration, album, artist details

REQUIRED PARAMETERS:
- Authorization: Bearer token (in header) - REQUIRED for all requests
- Content-Type: application/json (in header)
- q: Search query string (for /search)
- type: Search type - 'track', 'artist', or 'album' (for /search)

AUTHENTICATION METHOD:
- OAuth 2.0 - User grants permission, receives access token
- Token stored in browser localStorage with 1-hour expiry
- Tokens refresh required after expiry

RESPONSE FIELDS USED IN UI:
Track:
  - name, artists[].name, album.name, duration_ms, images[].url, external_urls.spotify
Artist:
  - name, genres, followers.total, images[].url, external_urls.spotify
Album:
  - name, artists[].name, release_date, total_tracks, images[].url, external_urls.spotify
*/
