
<script setup>

import { ref } from 'vue';
import moment, { relativeTimeRounding } from 'moment-timezone';

// VARIABLE FOR FRONT-END

const timezone = 'Europe/Rome';
const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

let table = ref(); let events = ref(); 
let week = 0; let month = ref(moment.tz(timezone).add(week, 'weeks').format('MMMM YYYY').toUpperCase());
let numberDays = loadNumDays();

// LOGIN FUNCTION

async function login() {window.open('http://localhost:3000/login', 'LoginWindow');}

// FUNCTION FOR MANAGE WEEKS

function reload() {
    week = 0; month = ref(moment.tz(timezone).add(week, 'weeks').format('MMMM YYYY').toUpperCase());
    fetchBusyTimes(); 
    numberDays = loadNumDays();
}

function nextWeek() {
    week++; month = ref(moment.tz(timezone).add(week, 'weeks').format('MMMM YYYY').toUpperCase());
    fetchBusyTimes(); 
    numberDays = loadNumDays();
}

function prevoiusWeek() {
    week--; month = ref(moment.tz(timezone).add(week, 'weeks').format('MMMM YYYY').toUpperCase());
    fetchBusyTimes();
    numberDays = loadNumDays();
}

function loadNumDays() {

    let startOfWeek = moment.tz(timezone).add(week, 'weeks').startOf('week');
    
    let weekDaysNumbers = [];
    
    for (let i = 0; i < 7; i++) {let dayNumber = startOfWeek.clone().add(i, 'days').date(); weekDaysNumbers.push(dayNumber);}

    return weekDaysNumbers;
}

// REQUEST BUSY TIMES INFORMATION BY WEEK

async function fetchBusyTimes() {

    try {

    const response = await fetch('http://localhost:3000/queryFreeBusy', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ week })
    });

    if (!response.ok) {throw new Error('Network response was not ok');}

    const busyTimes = await response.json();
    displayBusyTimes(busyTimes);

    } catch (error) {console.error('Failed to fetch busy times:', error);}
}

// DISPLAY INFORMATIONS ON A LIST OF EVENTS AND CALENDAR

function displayBusyTimes(busyTimes) {

    events.value = '';

    for (let calendarId in busyTimes) {

        displayTable(busyTimes, calendarId);
        
        if (busyTimes[calendarId].busy.length > 0) {
            
            events.value += `<button class="fluid ui center aligned button">${calendarId.toUpperCase()}</button>`;

            events.value += '<div class="ui relaxed divided list">';

            busyTimes[calendarId].busy.forEach((busyPeriod) => {

                const sDate = moment(busyPeriod.start);
                const eDate = moment(busyPeriod.end);

                const startDateFormatted = sDate.format("dddd, MMMM Do YYYY, h:mm:ss a");
                const endDateFormatted = eDate.format("dddd, MMMM Do YYYY, h:mm:ss a");

                events.value += `<div class="item content">
                <div class="header" style="margin-bottom: 0.2em">${sDate.format("dddd").toUpperCase()} ${sDate.format("D")}</div>
                <div class="description">from ${sDate.format("HH:mm")} to ${eDate.format("HH:mm")}</div>
                </div>`;
            });

            events.value += '</div>';

        } else {events.value += `Calendar ${calendarId} is free!\n`;}
    }
}

function displayTable(busyTimes, nameCalendar) {

    table.value = '';

    for (let row = 0; row < 24; row++) {

        table.value += '<tr>';

        for (let col = 0; col < 7; col++) {

            let style = '';

            busyTimes[nameCalendar].busy.forEach((busyPeriod) => {

                const sDate = new Date(busyPeriod.start);
                const eDate = new Date(busyPeriod.end);

                if (sDate.getHours() <= row && eDate.getHours() > row && eDate.getDay() - 1 === col) 
                {style = ' style="background-color: lightblue;"';}

            });

            table.value += `<td${style}></td>`;
        }

        table.value += '</tr>';
    }
}

</script>

<template>

<div class="ui two column grid container" style="margin: 1em;">

    <div class="four wide column">

        <!-- USER'S SETTINGS -->
        <div class="ui segment">

            <div class="ui" style="display: flex;">
                <button class="ui icon button"><i class="cog icon"></i></button>
                <button class="ui fluid button" @click="login();fetchBusyTimes()">LOGIN</button>
                <button class="ui icon button" @click="reload()"><i class="sync alternate icon"></i></button>
            </div>
            
        </div>

        <!-- BUSY EVENTS LIST OF CALENDARS -->
        <div v-html="events" class="ui segment">
            
        </div>

    </div>

    <div class="twelve wide column">

        <!-- DISPLAY CALENDAR -->
        <div class="ui segment">

            <!-- INFORMATION AND NAVIGATION-->
            <div class="ui" style="display: flex;">
                <button class="ui icon button" @click="prevoiusWeek()"><i class="angle double left icon"></i></button>
                <button class="fluid ui button"><p v-html="month"></p></button>
                <button class="ui icon button" @click="nextWeek()"><i class="angle double right icon"></i></button>
            </div>

            <!-- WEEKLY GRAPHICS CALENDAR -->
            <table id="table" class="ui celled fixed table">
                <thead><tr class="center aligned"><th v-for="(day, index) in days" :key="day">{{ day }} <hr> {{ numberDays[index] }}</th></tr></thead>
                <tbody v-html="table"></tbody>
            </table>

        </div>

    </div>

</div>

</template>
