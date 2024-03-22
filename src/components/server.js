
import express from 'express';
import { google } from 'googleapis';
import cors from 'cors';

const app = express(); app.use(express.json());
const port = process.env.PORT || 3000;
const corsOptions = {origin: 'http://localhost:5173', optionsSuccessStatus: 200};

app.use(cors(corsOptions));

// CREDENTIALS FOR GOOGLE CALENDAR

const GOOGLE_CLIENT_ID = '47183643703-lmcif7h6fba0hlcl3afcr8ea3ajra15b.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,"http://localhost:3000/auth/google/callback");

// MANAGER FOR GOOGLE AUTHENTICATION

app.get('/login', (req, res) => {res.redirect(oauth2Client.generateAuthUrl({access_type: 'offline', scope: SCOPES}));});

app.get('/auth/google/callback', async (req, res) => {
    
    try {

    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);
    res.send(`
        <html><body>
        <script>
        window.opener.postMessage('Authentication success', '*');
        window.close();
        </script>
        </body></html>
    `);

    } catch {res.status(500).send('Authentication failed');}
});

app.get('/queryFreeBusy', async (req, res) => {

    const calendar = google.calendar({version: 'v3', auth: oauth2Client});
    
    const timeMin = new Date('2024-03-18T00:00:00Z').toISOString();
    const timeMax = new Date('2024-03-24T24:00:00Z').toISOString();

    const requestBody = {
    timeMin: timeMin,
    timeMax: timeMax,
    items: [{ id: 'primary' }]};

    try {

    const response = await calendar.freebusy.query({ resource: requestBody });
    const busyTimes = response.data.calendars || {};
    res.json(busyTimes);

    } catch (err) {console.error(`Error: ${err.message}`);}
});

// RUN AND START MY LOCAL SERVER BACK-END

app.listen(port, () => {console.log(`Server listening at http://localhost:${port}`);});