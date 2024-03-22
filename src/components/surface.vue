
<script setup>

import { ref } from 'vue';

const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const busyTimesData = [4];

let table = ref(); let week = 0;
let events = ref();

async function login() {window.open('http://localhost:3000/login', 'LoginWindow');}

async function fetchBusyTimes() {

    try {

    const response = await fetch('http://localhost:3000/queryFreeBusy');
    if (!response.ok) {throw new Error('Network response was not ok');}
    busyTimesData[week] = await response.json();

    } catch (error) {console.error('Failed to fetch busy times:', error);}
}

function display() {

    fetchBusyTimes();

    // Load file json with the information
    const busyTimes = busyTimesData[week];

    // Display the information on list and calendar
    displayBusyTimes(busyTimes);
}

function displayBusyTimes(busyTimes) {

    events.value = '';

    for (let calendarId in busyTimes) {
        
        if (busyTimes[calendarId].busy.length > 0) {

            displayTable(busyTimes, calendarId);
            
            events.value += `<button class="fluid ui center aligned button">${calendarId.toUpperCase()}</button>`;

            events.value += '<div class="ui relaxed divided list">';

            busyTimes[calendarId].busy.forEach((busyPeriod) => {

                const sDate = new Date(busyPeriod.start);
                const eDate = new Date(busyPeriod.end);

                events.value += `<div class="item content">
                <div class="header">${days[sDate.getDay()]} ${sDate.getDate()}</div>
                <div class="description">From ${busyPeriod.start} To ${busyPeriod.end}</div>
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
                <button class="ui fluid button" @click="login()">LOGIN</button>
                <button class="ui icon button" @click="display()"><i class="sync alternate icon"></i></button>
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
                <button class="ui icon button" @click="week--;queryFreeBusy()"><i class="angle double left icon"></i></button>
                <button class="fluid ui button"><p>MARCH 2024</p></button>
                <button class="ui icon button" @click="week++;queryFreeBusy()"><i class="angle double right icon"></i></button>
            </div>

            <!-- WEEKLY GRAPHICS CALENDAR -->
            <table id="table" class="ui celled fixed table">
                <thead><tr class="center aligned"><th v-for="day in days" :key="day">{{ day }}</th></tr></thead>
                <tbody v-html="table"></tbody>
            </table>

        </div>

    </div>

</div>

</template>
