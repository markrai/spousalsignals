const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();

// Fitbit credentials for User 1
const CLIENT_ID_USER1 = '';
const CLIENT_SECRET_USER1 = '';
const REDIRECT_URI_USER1 = 'https://s/callback/user1';

// Fitbit credentials for User 2
const CLIENT_ID_USER2 = '';
const CLIENT_SECRET_USER2 = '';
const REDIRECT_URI_USER2 = 'https://s/callback/user2';

let tokenStore = {}; // Object to store tokens
let cachedData = {};

// Serve static files like CSS and JS
app.use(express.static(path.join(__dirname)));

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// OAuth login route (used for initial setup)
app.get('/login/:user', (req, res) => {
    const user = req.params.user;
    const clientId = user === 'user1' ? CLIENT_ID_USER1 : CLIENT_ID_USER2;
    const redirectUri = user === 'user1' ? REDIRECT_URI_USER1 : REDIRECT_URI_USER2;

    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=heartrate&expires_in=604800`;
    console.log(`Redirecting user ${user} to Fitbit authorization: ${authUrl}`);
    res.redirect(authUrl);
});

// OAuth callback route
app.get('/callback/:user', async (req, res) => {
    const user = req.params.user;
    const code = req.query.code;
    const clientId = user === 'user1' ? CLIENT_ID_USER1 : CLIENT_ID_USER2;
    const clientSecret = user === 'user1' ? CLIENT_SECRET_USER1 : CLIENT_SECRET_USER2;
    const redirectUri = user === 'user1' ? REDIRECT_URI_USER1 : REDIRECT_URI_USER2;

    console.log(`Received callback for ${user} with code: ${code}`);

    try {
        const response = await axios.post('https://api.fitbit.com/oauth2/token', null, {
            params: {
                client_id: clientId,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code: code,
            },
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Store tokens and expiration time
        tokenStore[user] = {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiry: Date.now() + expires_in * 1000, // expires_in is in seconds
        };

        // Optionally, write to a JSON file or database
        fs.writeFileSync('tokenStore.json', JSON.stringify(tokenStore));

        console.log(`Access token for ${user} stored.`);

        // Fetch and cache HRV data after token is stored
        await fetchAndCacheHRVData(user);

        res.send('Authentication successful! You can now access Fitbit data.');
    } catch (error) {
        console.error(`Error during authentication for ${user}:`, error.response ? error.response.data : error.message);
        res.status(500).send('Error during authentication.');
    }
});

// Function to refresh the access token
async function refreshAccessToken(user) {
    const clientId = user === 'user1' ? CLIENT_ID_USER1 : CLIENT_ID_USER2;
    const clientSecret = user === 'user1' ? CLIENT_SECRET_USER1 : CLIENT_SECRET_USER2;

    if (!tokenStore[user].refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await axios.post('https://api.fitbit.com/oauth2/token', null, {
            params: {
                client_id: clientId,
                grant_type: 'refresh_token',
                refresh_token: tokenStore[user].refreshToken,
            },
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Update stored tokens
        tokenStore[user] = {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiry: Date.now() + expires_in * 1000,
        };

        // Optionally, write to a JSON file or database
        fs.writeFileSync('tokenStore.json', JSON.stringify(tokenStore));

        console.log(`Access token for ${user} refreshed.`);
    } catch (error) {
        console.error(`Error refreshing access token for ${user}:`, error.response ? error.response.data : error.message);
    }
}

async function fetchAndCacheHRVData(user) {
    try {
        let accessToken = tokenStore[user]?.accessToken;

        if (!accessToken) {
            console.error(`No access token found for ${user}`);
            return;
        }

        // Check if the token has expired
        if (Date.now() > tokenStore[user].expiry) {
            console.log(`Access token for ${user} has expired. Refreshing token...`);
            await refreshAccessToken(user);
            accessToken = tokenStore[user]?.accessToken;
        }

        console.log(`Fetching HRV data for ${user} with token: ${accessToken}`);

        const today = new Date().toISOString().split('T')[0];
        const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

        const response = await axios.get(`https://api.fitbit.com/1/user/-/hrv/date/${startDate}/${today}.json`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        cachedData[user] = response.data; // Cache the data
        console.log(`HRV data for ${user} cached successfully. Data:`, JSON.stringify(cachedData[user]));
    } catch (error) {
        console.error(`Error fetching HRV data for ${user}:`, error.response ? error.response.data : error.message);
    }
}

// Endpoint to serve cached HRV data
app.get('/hrv/:user', (req, res) => {
    console.log(`Received request for HRV data of ${req.params.user}`);
    const user = req.params.user;
    if (cachedData[user]) {
        res.json(cachedData[user]);
    } else {
        res.status(404).send('Data not available.');
    }
});

// Schedule periodic data fetching and caching (every hour)
setInterval(() => {
    fetchAndCacheHRVData('user1');
    fetchAndCacheHRVData('user2');
}, 3600 * 1000);

// Start the server
app.listen(8080, () => {
    console.log('Server started on port 8080');
    // Fetch data immediately on startup
    fetchAndCacheHRVData('user1');
    fetchAndCacheHRVData('user2');
});

// Global error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
