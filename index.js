// const express = require('express');
// const { google } = require('googleapis');
// const { OAuth2Client } = require('google-auth-library');

// const app = express();
// const port = 3000;

// const credentials = require('./credentials.json'); // Replace with your credentials file
// const redirectUri = 'http://localhost:3000/oauth2callback'; // Replace with your redirect URI

// const oAuth2Client = new OAuth2Client(
//   credentials.web.client_id,
//   credentials.web.client_secret,
//   redirectUri
// );

// // Set the scope for Gmail API
// const scope = 'https://www.googleapis.com/auth/gmail.readonly';

// // Routes
// app.get('/', (req, res) => {
//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: scope,
//   });

//   res.send(`<a href="${authUrl}">Authorize this app to access your Gmail</a>`);
// });

// app.get('/oauth2callback', async (req, res) => {
//   const code = req.query.code;

//   try {
//     const { tokens } = await oAuth2Client.getToken(code);
//     console.log('Access Token:', tokens.access_token);
//     console.log('Refresh Token:', tokens.refresh_token);

//     // Save tokens to a file (replace with your preferred storage method)
//     const tokensData = JSON.stringify(tokens, null, 2);
//     require('fs').writeFileSync('tokens.json', tokensData);

//     res.send('Authorization successful. Tokens saved to tokens.json.');
//   } catch (error) {
//     console.error('Error getting tokens:', error.message);
//     res.status(500).send('Error getting tokens. Check the server console for details.');
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server listening at http://localhost:${port}`);
// });


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
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    // Save tokens to a file (replace with your preferred storage method)
    const tokensData = JSON.stringify(tokens, null, 2);
    require('fs').writeFileSync('tokens.json', tokensData);

    res.send('Authorization successful. Tokens saved to tokens.json.');
  } catch (error) {
    console.error('Error getting tokens:', error.message);
    res.status(500).send('Error getting tokens. Check the server console for details.');
  }
});

app.get('/read-emails', async (req, res) => {
  try {
    // Load tokens from the saved file (replace with your preferred storage method)
    const tokensData = require('fs').readFileSync('tokens.json', 'utf8');
    const tokens = JSON.parse(tokensData);

    oAuth2Client.setCredentials(tokens);

    // Use the Gmail API to list emails
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 5,
    });

    const emails = response.data.messages;

    // Fetch and display the content of each email
    const emailDetails = [];
    for (const email of emails) {
      const details = await gmail.users.messages.get({ userId: 'me', id: email.id });
      emailDetails.push({
        subject: details.data.payload.headers.find(header => header.name === 'Subject').value,
        sender: details.data.payload.headers.find(header => header.name === 'From').value,
        body: details.data.snippet,
      });
    }

    res.json(emailDetails);
  } catch (error) {
    console.error('Error reading emails:', error.message);
    res.status(500).send('Error reading emails. Check the server console for details.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

