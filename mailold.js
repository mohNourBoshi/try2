const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const port = 3000;

const credentials = require('./credentials.json'); // Replace with your credentials file
const redirectUri = 'http://localhost:3000/oauth2callback'; // Replace with your redirect URI

const oAuth2Client = new OAuth2Client(
  credentials.web.client_id,
  credentials.web.client_secret,
  redirectUri
);

// Set the scope for Gmail API
const scope = 'https://www.googleapis.com/auth/gmail.readonly';

// Routes
app.get('/', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scope,
  });

  res.send(`<a href="${authUrl}">Authorize this app to access your Gmail</a>`);
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oAuth2Client.getToken(code);

    // Set the obtained tokens to the OAuth2 client
    oAuth2Client.setCredentials(tokens);

    // Use the OAuth2 client to make requests to the Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // List the user's emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'], // Use labelIds to filter by inbox
      maxResults: 5, // Adjust as needed
    });

    const emails = response.data.messages;

    // Fetch and display the content of each email
    for (const email of emails) {
      const emailDetails = await gmail.users.messages.get({ userId: 'me', id: email.id });
      const subject = emailDetails.data.payload.headers.find(header => header.name === 'Subject').value;
      const sender = emailDetails.data.payload.headers.find(header => header.name === 'From').value;

      console.log(`Subject: ${subject}`);
      console.log(`From: ${sender}`);
      console.log(`Body: ${emailDetails.data.snippet}`);
      console.log('---');
    }

    res.send('Emails listed successfully. Check the server console for details.');
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
