const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const credentials = JSON.parse(fs.readFileSync('./credentials.json'));

// Function to create an OAuth2 client with given credentials and redirect URI
function createOAuth2Client(clientId, clientSecret, redirectUri) {
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

const clientOAuth2Client = createOAuth2Client(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

// Generate the URL for user consent
app.get('/authorize', (req, res) => {
  const authUrl = clientOAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });

  res.redirect(authUrl);
});

// Callback endpoint to handle the authorization code and exchange it for tokens
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await clientOAuth2Client.getToken(code);

    // Save tokens to a file (you may want to store them securely)
    fs.writeFileSync('path/to/token.json', JSON.stringify(tokens));

    res.send('Authorization successful! Tokens have been saved.');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.message);
    res.status(500).send('Error during authorization.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
