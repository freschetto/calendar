
import express from 'express';
import { google } from 'googleapis';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import moment from 'moment-timezone';

// SERVER SETTINGS AND DATA

const app = express(); app.use(express.json());
const port = process.env.PORT || 3000;
const corsOptions = {origin: 'http://localhost:5173', optionsSuccessStatus: 200};

app.use(cookieParser());
app.use(cors(corsOptions));

// CREDENTIALS FOR GOOGLE CALENDAR

const GOOGLE_CLIENT_ID = '47183643703-lmcif7h6fba0hlcl3afcr8ea3ajra15b.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

// CREATE AUTHENTICATION FOR GOOGLE

function getOauth2Client() {

    return new Promise((resolve, reject) => {

        resolve(new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,"http://localhost:3000/auth/google/callback"))
         
        .catch(error => { reject(new Error("Failed to create oauth2 client: " + error.message)); });
    });
}

const oauth2Client = await getOauth2Client();

// GET CALENDAR FROM GOOGLE

function getCalendar() {

    return new Promise((resolve, reject) => {

        resolve(google.calendar({version: 'v3', auth: oauth2Client}))

        .catch(error => { reject(new Error("Failed to get calendar: " + error.message)); });
    });
}

// MANAGER FOR GOOGLE AUTHENTICATION

app.get('/login', (req, res) => {res.redirect(oauth2Client.generateAuthUrl({access_type: 'offline', scope: SCOPES}));});

app.get('/auth/google/callback', async (req, res) => {
    
    try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);
    res.send(`
        <html><body>
        <script>
        window.close();
        </script>
        </body></html>
    `);

    } catch {res.status(500).send('Authentication failed');}
});

app.post('/logout', (req, res) => {
    
    oauth2Client.setCredentials({ access_token: null, refresh_token: null, scope: null, token_type: null, expiry_date: null });

    res.send("Logged out successfully");
});  

// MANAGER REQUEST FREE BUSY FROM GOOGLE

app.post('/queryFreeBusy', async (req, res) => {

    const calendar = await getCalendar();

    const { week } = req.body;
    const timezone = 'Europe/Rome';

    const timeMin = moment.tz(timezone).add(week, 'weeks').startOf('isoWeek').toISOString();
    const timeMax = moment.tz(timezone).add(week, 'weeks').endOf('isoWeek').toISOString();

    const calendarsList = await calendar.calendarList.list();
    const calendarItems = calendarsList.data.items.map(calendar => ({ id: calendar.id }));

    const requestBody = {timeMin: timeMin, timeMax: timeMax, items: calendarItems};

    try {

    const response = await calendar.freebusy.query({ resource: requestBody });
    const busyTimes = response.data.calendars || {};
    res.json(busyTimes);

    } catch (err) {console.error(`Error: ${err.message}`);}
});

// RUN AND START MY LOCAL SERVER BACK-END

app.listen(port, () => {console.log(`Server listening at http://localhost:${port}`);});