const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
// const { htmlToText } = require('html-to-text');
const cors = require('cors');


const app = express();
app.use(cors());
const port = 3000;

const credentials = require('./credentials.json');
const redirectUri = 'http://localhost:3000/oauth2callback';
const dataFilePath = './client_data.json';

let clients = require(dataFilePath) || {};

// Function to save client data to the file
function saveClientData() {
  require('fs').writeFileSync(dataFilePath, JSON.stringify(clients, null, 2));
}

const generateAuthUrl = (clientId) => {
  const oAuth2Client = new OAuth2Client(
    credentials.web.client_id,
    credentials.web.client_secret,
    redirectUri
  );

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    state: clientId, // Store client ID in the state for later retrieval
  });
};

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Gmail API Client Management</h1>');
});

app.get('/auth/:clientId', (req, res) => {
  const clientId = req.params.clientId;
  const authUrl = generateAuthUrl(clientId);
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  const clientId = req.query.state; // Retrieve client ID from the state

  try {
    const oAuth2Client = new OAuth2Client(
      credentials.web.client_id,
      credentials.web.client_secret,
      redirectUri
    );

    const { tokens } = await oAuth2Client.getToken(code);
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    // Save tokens to the client's data
    clients[clientId] = {
      tokens,
      lastRefreshed: new Date().toISOString(),
    };

    // Save the updated client data to the file
    saveClientData();

    res.send(`Authorization successful for ${clientId}. Tokens saved.`);
  } catch (error) {
    console.error('Error getting tokens:', error.message);
    res.status(500).send('Error getting tokens. Check the server console for details.');
  }
});

app.get('/read/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  const client = clients[clientId];

  if (!client || !client.tokens) {
    res.status(401).send(`Tokens not found for ${clientId}. Please authorize.`);
    return;
  }

  const oAuth2Client = new OAuth2Client(
    credentials.web.client_id,
    credentials.web.client_secret,
    redirectUri
  );
  oAuth2Client.setCredentials(client.tokens);

  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      q:"from :info@visitjordan.gov.jo"
    //   maxResults: 5,
    });

    const emails = response.data.messages;
    const emailDetails = [];

    for (const email of emails) {
      const details = await gmail.users.messages.get({ format: 'full',userId: 'me', id: email.id });
    
    //   let bodyText = '';
    //   if (details.data.payload.body.data) {
    //     // If the body is directly in payload.body.data
    //     bodyText = htmlToText(Buffer.from(details.data.payload.body.data, 'base64').toString('utf-8'), {
    //       wordwrap: 130,
    //     });
    //   } else if (details.data.payload.parts && details.data.payload.parts[0].body.data) {
    //     // If the body is in payload.parts[0].body.data
    //     bodyText = htmlToText(Buffer.from(details.data.payload.parts[0].body.data, 'base64').toString('utf-8'), {
    //       wordwrap: 130,
    //     });
    //   } else if (details.data.payload.parts && details.data.payload.parts[0].parts[0].body.data) {
    //     // If the body is in payload.parts[0].parts[0].body.data
    //     bodyText = htmlToText(Buffer.from(details.data.payload.parts[0].parts[0].body.data, 'base64').toString('utf-8'), {
    //       wordwrap: 130,
    //     });
    //   }
      emailDetails.push({
        subject: details.data.payload.headers.find(header => header.name === 'Subject').value,
        sender: details.data.payload.headers.find(header => header.name === 'From').value,
        body: details.data.snippet,
        // body: bodyText,
      });
    }

    res.json(emailDetails);
  } catch (error) {
    console.error(`Error reading emails for ${clientId}:`, error.message);
    res.status(500).send(`Error reading emails for ${clientId}. Check the server console for details.`);
  }
});
app.get('/readall/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  const client = clients[clientId];

  if (!client || !client.tokens) {
    res.status(401).send(`Tokens not found for ${clientId}. Please authorize.`);
    return;
  }

  const oAuth2Client = new OAuth2Client(
    credentials.web.client_id,
    credentials.web.client_secret,
    redirectUri
  );
  oAuth2Client.setCredentials(client.tokens);

  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
    //   q:"from :info@visitjordan.gov.jo"
    //   maxResults: 5,
    });

    const emails = response.data.messages;
    const emailDetails = [];

    for (const email of emails) {
      const details = await gmail.users.messages.get({ format: 'full',userId: 'me', id: email.id });
    
    //   let bodyText = '';
    //   if (details.data.payload.body.data) {
    //     // If the body is directly in payload.body.data
    //     bodyText = htmlToText(Buffer.from(details.data.payload.body.data, 'base64').toString('utf-8'), {
    //       wordwrap: 130,
    //     });
    //   } else if (details.data.payload.parts && details.data.payload.parts[0].body.data) {
    //     // If the body is in payload.parts[0].body.data
    //     bodyText = htmlToText(Buffer.from(details.data.payload.parts[0].body.data, 'base64').toString('utf-8'), {
    //       wordwrap: 130,
    //     });
    //   } else if (details.data.payload.parts && details.data.payload.parts[0].parts[0].body.data) {
    //     // If the body is in payload.parts[0].parts[0].body.data
    //     bodyText = htmlToText(Buffer.from(details.data.payload.parts[0].parts[0].body.data, 'base64').toString('utf-8'), {
    //       wordwrap: 130,
    //     });
    //   }
      emailDetails.push({
        subject: details.data.payload.headers.find(header => header.name === 'Subject').value,
        sender: details.data.payload.headers.find(header => header.name === 'From').value,
        body: details.data.snippet,
        // body: bodyText,
      });
    }

    res.json(emailDetails);
  } catch (error) {
    console.error(`Error reading emails for ${clientId}:`, error.message);
    res.status(500).send(`Error reading emails for ${clientId}. Check the server console for details.`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
