
// CREDENTIALS FOR GOOGLE CALENDAR

const CLIENT_ID = '47183643703-lmcif7h6fba0hlcl3afcr8ea3ajra15b.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAyhht1glnAT4SnRxzlYNw6kgCsYPcsr7E';

// VARIABLES AND CONSTANTS FOR GOOGLE CALENDAR CONNECTION

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let tokenClient;
let gapiInited = false; // Google API client library initialized (?)
let gisInited = false; // Google Identity Services library initialized (?)

// INITIALIZE AND LOAD GOOGLE API CLIENT

export function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
}

// INITIALIZE AND LOAD GOOGLE IDENTITY SERVICES

export function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        callback: '',
        client_id: CLIENT_ID,
        scope: SCOPES
    });
    gisInited = true;
}