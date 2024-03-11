
// CREDENTIALS FOR GOOGLE CALENDAR

const CLIENT_ID = '47183643703-lmcif7h6fba0hlcl3afcr8ea3ajra15b.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAyhht1glnAT4SnRxzlYNw6kgCsYPcsr7E';

// VARIABLES AND CONSTANTS FOR GOOGLE CALENDAR CONNECTION

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let tokenClient;
let gapiInited = false; // Google API client library initialized (?)
let gisInited = false; // Google Identity Services library initialized (?)

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

// INITIALIZE AND LOAD GOOGLE API CLIENT

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

// INITIALIZE AND LOAD GOOGLE IDENTITY SERVICES

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
    maybeEnableButtons();
}

// ENABLE AUTHORIZE BUTTON

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

// HANDLE AUTHORIZATION CLICK BUTTON EVENT

function handleAuthClick() {

    console.log("login");

    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
        throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';
        await queryFreeBusy("2024-03-12T01:00:00Z", "2024-03-12T02:00:00Z");
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

// HANDLE SIGN-OUT CLICK BUTTON EVENT

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerText = '';
        document.getElementById('authorize_button').innerText = 'Authorize';
        document.getElementById('signout_button').style.visibility = 'hidden';
    }
}

// SINGLE QUERY FREE/BUSY REQUEST

async function queryFreeBusy(timeMin, timeMax) {
    let requestBody = {
        timeMin: timeMin,
        timeMax: timeMax.toISOString(),
        items: [{ id: 'primary' }],
    };
    console.log(requestBody);
    try {
        let response = await gapi.client.request({
            path: 'https://www.googleapis.com/calendar/v3/freeBusy',
            method: 'POST',
            body: requestBody
        });

        console.log(response.result);

        const busyTimes = response.result.calendars || {};
        displayBusyTimes(busyTimes);
    } catch (err) {
        document.getElementById('content').innerText = `Error: ${err.message}`;
    }
}

function displayBusyTimes(busyTimes) {
    let output = 'Busy times:\n';
    for (let calendarId in busyTimes) {
        if (busyTimes[calendarId].busy.length > 0) {
            output += `Calendar ${calendarId} is busy at:\n`;
            busyTimes[calendarId].busy.forEach((busyPeriod) => {
                output += `- From ${busyPeriod.start} to ${busyPeriod.end}\n`;
            });
        } else {
            output += `Calendar ${calendarId} is free!\n`;
        }
    }
    document.getElementById('content').innerText = output;
}

// LIST UPCOMING EVENTS

async function listUpcomingEvents() {
    let response;
    try {
        const request = {
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime',
        };
        response = await gapi.client.calendar.events.list(request);
    } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
    }

    const events = response.result.items;
    if (!events || events.length == 0) {
        document.getElementById('content').innerText = 'No events found.';
        return;
    }
    const output = events.reduce(
        (str, event) => `${str}${event.summary} (${event.start.dateTime || event.start.date})\n`,'Events:\n'
    );

    document.getElementById('content').innerText = output;
}