# Spotify Web API Integration Project

## 📋 Project Overview
This project demonstrates a complete integration with the Spotify Web API using OAuth 2.0 authentication. Users can search for tracks, artists, and albums with a clean, responsive user interface.

---

## 🎯 Features Implemented

### ✅ 1. Authentication (OAuth 2.0)
- **Flow**: Authorization Code Flow with implicit grant
- Users authenticate via Spotify's OAuth 2.0 authorization endpoint
- Access token stored in browser localStorage
- Automatic session management with 1-hour expiry
- Secure token handling with no hardcoded secrets

### ✅ 2. API Endpoints Used

#### **GET /search**
- **Purpose**: Search for tracks, artists, or albums
- **Parameters**: 
  - `q` (query string) - Search term
  - `type` (string) - 'track', 'artist', or 'album'
  - `limit` (number) - Max 50 results
- **Response**: List of matching items with metadata

#### **GET /me**
- **Purpose**: Retrieve current user's profile information
- **Parameters**: None (uses Bearer token)
- **Response**: User profile including name, email, follower count, profile image

#### **GET /artists/{id}**
- **Purpose**: Get detailed information about a specific artist
- **Parameters**: `id` (artist Spotify ID)
- **Response**: Artist details, genres, follower count, images

#### **GET /tracks/{id}**
- **Purpose**: Get detailed information about a specific track
- **Parameters**: `id` (track Spotify ID)
- **Response**: Track details, duration, album info, artist info, preview URL

### ✅ 3. Required Parameters

| Parameter | Type | Location | Required | Example |
|-----------|------|----------|----------|---------|
| q | String | Query | Yes (for search) | "Taylor Swift" |
| type | String | Query | Yes (for search) | "track" |
| limit | Number | Query | No | 20 |
| Authorization | String | Header | Yes | "Bearer ACCESS_TOKEN" |
| Content-Type | String | Header | Yes | "application/json" |

### ✅ 4. Authentication Method

```
OAuth 2.0 Authorization Code Flow

Step 1: User clicks "Connect to Spotify"
Step 2: Redirected to Spotify's authorization endpoint
Step 3: User grants permissions (scopes)
Step 4: Spotify redirects back with access token in URL hash
Step 5: Token extracted and stored in localStorage
Step 6: All API requests include "Authorization: Bearer {token}" header
```

### ✅ 5. Sample JSON Responses

#### Search Response (Track):
```json
{
  "tracks": {
    "items": [
      {
        "id": "11dFghVXANMlKmJXsNCQvb",
        "name": "Anti-Hero",
        "duration_ms": 230573,
        "popularity": 87,
        "artists": [
          {
            "id": "06HL4z0CvFAxyc27GXpf94",
            "name": "Taylor Swift"
          }
        ],
        "album": {
          "id": "1O0FsFxL9d64w1PrD3pLI5",
          "name": "Midnights",
          "images": [
            {
              "height": 640,
              "url": "https://i.scdn.co/image/...",
              "width": 640
            }
          ]
        },
        "external_urls": {
          "spotify": "https://open.spotify.com/track/..."
        }
      }
    ]
  }
}
```

#### Artist Response:
```json
{
  "id": "06HL4z0CvFAxyc27GXpf94",
  "name": "Taylor Swift",
  "genres": ["pop", "singer-songwriter"],
  "followers": {
    "total": 75000000
  },
  "images": [
    {
      "height": 640,
      "url": "https://i.scdn.co/image/...",
      "width": 640
    }
  ],
  "external_urls": {
    "spotify": "https://open.spotify.com/artist/..."
  }
}
```

### ✅ 6. Error Handling

The application handles the following errors:

| Error Type | Status Code | Handling |
|-----------|-------------|----------|
| Bad Request | 400 | Display "Invalid request" message |
| Unauthorized | 401 | Prompt user to reconnect |
| Forbidden | 403 | Display permission error |
| Not Found | 404 | Show "No results found" |
| Rate Limited | 429 | Show "Too many requests" message |
| Server Error | 500 | Display Spotify service issue message |

#### Error Messages Displayed:
- ❌ "Please enter a search term"
- ❌ "Search term must be at least 2 characters"
- ❌ "Invalid request: Bad input parameters"
- ❌ "Your session has expired. Please reconnect to Spotify."
- ❌ "Too many requests. Please wait a moment and try again."
- ❌ "You do not have permission to access this resource."

### ✅ 7. Loading State
- **Loading Spinner**: CSS-based spinner animation
- **Loading Text**: "Loading..." message
- **Button Disabled State**: Search button disabled during API call
- **Duration**: Shows until API response received

---

## 📱 User Interface Features

### ✅ 8. DOM Manipulation
- **Cards**: Responsive grid layout displaying results
- **Images**: Album/artist artwork from Spotify
- **Lists**: Dynamic result lists based on search type
- **Forms**: Search input with radio button filters
- **Buttons**: Interactive buttons with hover effects

### ✅ 9. Input Validation
- ✓ Empty input check
- ✓ Minimum length validation (2 characters)
- ✓ Whitespace trimming
- ✓ Maximum length limit (100 characters)
- ✓ Button disabled during API calls
- ✓ Invalid characters prevented via input type

### ✅ 10. Responsive Design
- **Mobile (< 480px)**: Single-column layout
- **Tablet (480px - 768px)**: Two-column grid
- **Desktop (> 768px)**: Multi-column responsive grid
- **Flexbox & CSS Grid**: Modern layout techniques
- **Viewport Meta Tag**: Mobile optimization

---

## 🔐 API Key Security

⚠️ **IMPORTANT**: The project includes a `config.js` file with placeholders:

```javascript
const CONFIG = {
    CLIENT_ID: 'YOUR_CLIENT_ID_HERE',
    REDIRECT_URI: 'http://localhost:5500'
};
```

### Security Best Practices:
1. ❌ Never commit real API keys to GitHub
2. ✅ Use placeholders in version control
3. ✅ Store actual credentials in environment variables locally
4. ✅ Add `config.js` to `.gitignore` if using real values

### To Use This Project:
1. Get your Client ID from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Replace `YOUR_CLIENT_ID_HERE` with your actual ID
3. Set correct `REDIRECT_URI` in config.js

---

## 📁 File Structure

```
spotify-api-project/
├── index.html          # Main HTML structure
├── style.css          # All styling (no inline CSS)
├── script.js          # All JavaScript logic (no inline JS)
├── config.js          # API configuration & placeholders
├── .gitignore         # Git ignore file
├── README.md          # This file
└── SETUP.md           # Setup instructions
```

---

## 🚀 Setup Instructions

### Prerequisites
- Spotify account (free or premium)
- Modern web browser
- Local server (Live Server recommended)

### Step 1: Get Spotify API Credentials
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in or create an account
3. Create a new application
4. Copy your **Client ID**
5. Set **Redirect URI** to your local server (e.g., `http://localhost:5500`)

### Step 2: Configure the Project
1. Open `config.js`
2. Replace `YOUR_CLIENT_ID_HERE` with your actual Client ID
3. Update `REDIRECT_URI` if using a different port

### Step 3: Run the Project
1. Open the project folder in VS Code
2. Install "Live Server" extension (or use any local server)
3. Right-click on `index.html` → "Open with Live Server"
4. Browser opens to `http://localhost:5500`

### Step 4: Test the Application
1. Click "Connect to Spotify"
2. Authorize the application
3. Search for tracks, artists, or albums
4. View results in real-time

---

## 🧪 API Testing with Postman

### Complete Postman Testing Guide

#### 1. **Authorization Setup**

**Step 1: Create OAuth 2.0 Token in Postman**
- Authorization Type: `OAuth 2.0`
- Token Name: `Spotify Access Token`
- Grant Type: `Implicit`
- Callback URL: `http://localhost:5500`
- Auth URL: `https://accounts.spotify.com/authorize`
- Client ID: Your Spotify Client ID
- Scope: `user-read-private user-read-email`

**Step 2: Get Access Token**
- Click "Get New Access Token"
- Authorize in popup window
- Use token for all requests

#### 2. **Testing Endpoints in Postman**

**Endpoint 1: Search Tracks**
```
GET https://api.spotify.com/v1/search?q=Taylor%20Swift&type=track&limit=5

Headers:
- Authorization: Bearer {ACCESS_TOKEN}
- Content-Type: application/json

Expected Response (200):
{
  "tracks": {
    "items": [...track objects...]
  }
}
```

**Endpoint 2: Get User Profile**
```
GET https://api.spotify.com/v1/me

Headers:
- Authorization: Bearer {ACCESS_TOKEN}
- Content-Type: application/json

Expected Response (200):
{
  "display_name": "Username",
  "external_urls": {...},
  "followers": {...},
  "id": "userid",
  "images": [...],
  "uri": "spotify:user:..."
}
```

**Endpoint 3: Get Artist Details**
```
GET https://api.spotify.com/v1/artists/06HL4z0CvFAxyc27GXpf94

Headers:
- Authorization: Bearer {ACCESS_TOKEN}
- Content-Type: application/json

Expected Response (200):
{
  "id": "06HL4z0CvFAxyc27GXpf94",
  "name": "Taylor Swift",
  "genres": [...],
  "followers": {...},
  "images": [...]
}
```

#### 3. **Error Response Testing**

**Test 401 Unauthorized:**
```
GET https://api.spotify.com/v1/me
Headers: Authorization: Bearer invalid_token

Response (401):
{
  "error": {
    "status": 401,
    "message": "The access token expired"
  }
}
```

**Test 404 Not Found:**
```
GET https://api.spotify.com/v1/artists/invalid_id

Response (404):
{
  "error": {
    "status": 404,
    "message": "The requested object does not exist"
  }
}
```

**Test 429 Rate Limited:**
```
[Make many rapid requests]

Response (429):
{
  "error": {
    "status": 429,
    "message": "API rate limit exceeded"
  }
}
```

---

## 💻 Code Organization

### JavaScript Structure

```javascript
// 1. Configuration (config.js)
- OAuth credentials
- API endpoints

// 2. Initialization (script.js)
- DOM ready listener
- Event listener setup
- Auth token recovery

// 3. Authentication
- initiateSpotifyAuth() - OAuth flow
- handleAuthCallback() - Token extraction
- handleLogout() - Session cleanup

// 4. API Calls (Modular & Reusable)
- searchSpotify(query, type) - Search API
- getUserProfile() - User endpoint
- getArtistDetails(id) - Artist endpoint
- getTrackDetails(id) - Track endpoint

// 5. Response Handling
- handleApiResponse() - Status code handling
- displayResults() - DOM updates
- createResultCard() - Card generation

// 6. Error Handling
- handleApiError() - User-friendly messages
- showError() - Error display
- closeError() - Error dismissal

// 7. Utilities
- formatDuration() - Time formatting
- generateRandomString() - Security
```

---

## 🎨 CSS Organization

```css
/* Global Styles & Variables */
:root { --colors, --spacing, --shadows }

/* Layout Components */
.container, .header, .footer, .main-content

/* Authentication Styles */
.auth-section, .auth-container, .auth-status

/* Search Styles */
.search-section, .search-form, .input-group, .filter-options

/* Results Styles */
.results-container, .result-card, .result-image

/* Loading & Error States */
.loading-indicator, .spinner, .error-container

/* Responsive Breakpoints */
@media (max-width: 768px)
@media (max-width: 480px)
```

---

## 🔄 Data Flow

```
User Input
    ↓
Input Validation
    ↓
Search Button Click
    ↓
Show Loading Spinner
    ↓
fetch() with async/await
    ↓
API Request (with Bearer token)
    ↓
Spotify API Server
    ↓
JSON Response
    ↓
Status Code Check (200, 401, 429, etc)
    ↓
Parse Response Data
    ↓
Create DOM Cards
    ↓
Display Results / Error
    ↓
Hide Loading Spinner
```

---

## 🐛 Error Handling Examples

### 1. **No Results Found**
```javascript
if (items.length === 0) {
    document.getElementById('noResults').style.display = 'block';
}
```

### 2. **Invalid Input**
```javascript
if (!query) {
    showError('Please enter a search term');
}
```

### 3. **Failed API Request**
```javascript
try {
    const results = await searchSpotify(query, type);
} catch (error) {
    handleApiError(error);
}
```

### 4. **Authentication Errors**
```javascript
if (response.status === 401) {
    throw new Error('Unauthorized: Your session expired.');
    handleLogout();
}
```

### 5. **Rate Limiting**
```javascript
if (response.status === 429) {
    throw new Error('Too many requests. Please try again later.');
}
```

---

## 🧪 Testing Checklist

- [ ] Authentication with Spotify works
- [ ] Search for tracks returns results
- [ ] Search for artists returns results
- [ ] Search for albums returns results
- [ ] Empty search shows error
- [ ] Invalid token triggers logout
- [ ] Loading spinner displays during API call
- [ ] Results display as cards with images
- [ ] Responsive design works on mobile
- [ ] Error messages are user-friendly
- [ ] No console errors
- [ ] Images load correctly
- [ ] Links open on Spotify

---

## 📚 Additional Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [OAuth 2.0 Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization/)
- [API Reference](https://developer.spotify.com/documentation/web-api/reference/)
- [Rate Limiting Info](https://developer.spotify.com/documentation/web-api/#rate-limiting)

---

## 📝 Notes for Developers

### Performance Considerations
- Access token stored in localStorage (not secure for sensitive apps)
- Consider moving to sessionStorage or backend tokens for production
- API responses cached in memory for UX improvements

### Security Notes
- ❌ Never expose Client Secret in frontend code
- ✅ All API calls use HTTPS
- ✅ OAuth tokens have time expiry
- ✅ State parameter prevents CSRF attacks

### Future Enhancements
- Add playlist creation functionality
- Implement user library management
- Add audio preview feature
- Create recommendation engine
- Add user profile display
- Implement search history

---

**Created**: December 2025  
**Version**: 1.0.0  
**Status**: Production Ready
