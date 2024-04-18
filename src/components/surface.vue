<script setup>

import { ref } from "vue";
import moment from "moment-timezone";

// COSTANTS AND VARIABLES

let isLoggedIn = ref('');
const checkLoginStatus = () => { const token = localStorage.getItem("token"); isLoggedIn.value = !!token; };

const timezone = "Europe/Rome";
const days = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

let week = 0;
let table = ref(''); let month = ref(''); let events = ref('');
let numdays = getNumDays();

var calendars = []

/*--------------------------------------------------------------------------------------------------------------*/

checkLoginStatus();

async function logout() {

  try {

    await fetch("./api/logout", { method: "POST" });

    localStorage.removeItem("token");
    isLoggedIn.value = false;

    week = 0; calendars = [];
    table = ref(''); month = ref(''); events = ref('');
    
  } catch (error) {console.error("Logout failed:", error);}
}

async function login() {

  try {

    const loginWindow = window.open("./api/login", "LoginWindow");

    await new Promise((resolve, reject) => {
      const checkWindow = setInterval(() => {
        if (loginWindow.closed) {
          clearInterval(checkWindow);
          resolve();
        }
      }, 1000);
    });
    
    fetchCalendars();
    isLoggedIn.value = true;
    update();

  } catch (error) {console.error("Login failed:", error);}
}

// REQUEST ALL CALENDAR ID AND INFORMATIONS

async function fetchCalendars() {

  await fetch("./api/calendarsList", { method: "POST" })

    .then(async (response) => {
      calendars = await response.json();
    })

    .catch((err) => {
      console.error("Failed to fetch calendars:", err);
    });
      
  console.log(calendars);
}

// REQUEST ALL INFORMATIONS ABOUT BUSYTIMES BY WEEK

async function fetchBusyTimes() {

  await fetch("/api/queryFreeBusy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ week }),
  })

    .then(async (response) => {
      const busyTimes = await response.json();
      displayTable(busyTimes);
    })

    .catch((err) => {
      console.error("Failed to fetch busy times:", err);
    });
}

// CONVERT BUSYTIMES TO BOOLEAN CALENDAR MATRIX

function getBusyTimeMatrix(busyTimes) {

  const tableMatrix = Array.from({ length: 7 }, () => Array(24).fill(false));

  calendars.forEach(checkbox => {

    if (checkbox.checked && busyTimes[checkbox.id]) {

      busyTimes[checkbox.id].busy.forEach(busyPeriod => {

        const s = new Date(busyPeriod.start);
        const e = new Date(busyPeriod.end);

        let d = start.getDay() - 1; d = d < 0 ? 6 : d;

        for (let i = s.getHours(); i < e.getHours(); i++) 
        { tableMatrix[d][i] = true; }
      });
    }
  }); return tableMatrix;
}

// DISPLAY FROM BOOLEAN MATRIX BUSY TIMES ON A TABLE

function displayTable(busyTimes) {

  const tableMatrix = getBusyTimeMatrix(busyTimes);
  table.value = [];

  for (let row = 0; row < 24; row++) {

    const tableRow = [];
    
    for (let col = 0; col < 7; col++) {
      
      const isBusy = tableMatrix[col][row];
      tableRow.push({ isBusy });
    }

    table.value.push(tableRow);
  }
}

/*--------------------------------------------------------------------------------------------------------------*/


function clear() { events = ref(''); freeTimes = []; }

function update() {

  clear();

  numdays = getNumDays();

  month = ref(moment.tz(timezone).add(week, "weeks").format("MMMM YYYY").toUpperCase());

  fetchBusyTimes();
}

function getNumDays() {

  let startWeek = moment.tz(timezone).add(week, "weeks").startOf("week");

  let numbers = [];

  for (let i = 0; i < 7; i++) { numbers.push(startWeek.clone().add(i, "days").date()); }

  return numbers;
}

/*--------------------------------------------------------------------------------------------------------------*/

var freeTimes = []; let drag = false;

// CONVERT USER'S MOUSE EVENTS TO LIST OF POSITIONS

function toFreeTimes(row, col) {

  table.value[row][col].isSelected = !table.value[row][col].isSelected;

  const index = freeTimes.findIndex(pair => pair[0] === row && pair[1] === col);

  if (index === -1) { freeTimes.push([row, col]); } 

  else { freeTimes.splice(index, 1); }

  console.log(freeTimes)

}

function mousedown(row, col) { toFreeTimes(row, col); drag = true; }

function mouseup() { generateDayEvents(); drag = false; }

/*--------------------------------------------------------------------------------------------------------------*/

// CONVERT LIST OF POSITIONS TO HTML ELEMENTS 

function generateDayEvents() {

  events.value = {};

  freeTimes.forEach(([row, col]) => {

    const da = days[col];

    if (!events.value[da]) { events.value[da] = []; }

    events.value[da].push(row);
  });

  console.log(events.value);
}

// DOWNLOAD LIST OF EVENTS CLICKED BY USER

function download() {

  const htmlContent = events.value;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'events.html';
  document.body.appendChild(downloadLink);
  downloadLink.click();

  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}
</script>

<template>

  <div class="ui two column grid container" style="width: 100vw; height: 100vh; margin: 0; overflow: hidden;">

    <div class="four wide column" style="height: 100vh;">

      <!-- CALENDAR INFORMATION -->
      <div class="ui segment">

        <!-- USER'S SETTINGS -->
        <div class="ui" style="display: flex;">
          <button class="ui icon button" @click="download()"><i class="cog icon"></i></button>
          <button v-if="isLoggedIn" class="ui negative fluid button" @click="logout()">LOGOUT</button>
          <button v-else class="ui positive fluid button" @click="login()">LOGIN</button>
          <button v-if="isLoggedIn && week != 0" class="ui icon blue button" @click="week=0;update();"><i class="sync alternate icon"></i></button>
          <button v-else class="ui icon blue button" disabled><i class="sync alternate icon"></i></button>
        </div>
        
        <!-- LIST OF CALENDARS WHIT CHECKBOX -->
        <div class="ui message" style="height: 40vh;">
          <div class="checkbox-group">
            <div v-for="checkbox in calendars" :key="checkbox.id" class="ui checkbox" style="padding: 0.25em; display: block">
              <input type="checkbox" :id="`checkbox-${checkbox.id}`" v-model="checkbox.checked" @change="update()">
              <label :for="`checkbox-${checkbox.id}`">{{ checkbox.label }}</label>
            </div>
          </div>
        </div>
      </div>

      <!-- BUSY EVENTS LIST OF CALENDARS -->
      <div class="ui segment" style="overflow-y: scroll; height: 45.4vh;">
        <div v-for="(times, day) in events" class="item content">
          <div class="header" style="margin-bottom: 0.5em">{{ day }}</div>
          <ul>
            <li v-for="time in times" class="description" style="margin: 0.25em"> {{ time }}:00 </li>
          </ul>
        </div>
      </div>

    </div> 

    <div class="twelve wide column">

      <!-- DISPLAY CALENDAR -->
      <div v-if="isLoggedIn" class="ui segment">

        <!-- INFORMATION AND NAVIGATION-->
        <div class="ui" style="display: flex">
          
          <button class="ui icon button" @click="week--;update();">
            <i class="angle double left icon"></i>
          </button>
          <button class="fluid ui button">{{  month }}</button>
          <button class="ui icon button" @click="week++;update();">
            <i class="angle double right icon"></i>
          </button>

        </div>

        <!-- WEEKLY GRAPHICS CALENDAR -->
        <table id="table" class="ui fixed table definition compact" style="border: 0;">
          <thead>
            <tr class="center aligned">
              <th style="width: 2em;"></th>
              <th style="font-size: smaller; border: 0.05em solid rgba(34,36,38,.15);" v-for="(day, index) in days" :key="day">{{ day.substring(0,3) }} . {{ numdays[index] }}</th>
              <th style="width: 2em; border-right:0; background-color: white"></th>
            </tr>
          </thead>
          <tbody style="font-weight: 420;">
            <tr v-for="(row, rowIndex) in table" :key="`row-${rowIndex}`">
              <td class="collapsing" style="background-color: white; font-size: 0.5em; font-weight: 100; text-align: center; ">{{ rowIndex }}</td>
              <td 
                  @mousedown="mousedown(rowIndex, cellIndex)"
                  @mouseup="mouseup()"
                  v-for="(cell, cellIndex) in row"
                  :key="`cell-${rowIndex}-${cellIndex}`"
                  :class="{'busy': cell.isBusy, 'selected': cell.isSelected}"
                  style=" border: 0.05em solid rgba(34,36,38,.15);">
              </td>
              <td class="collapsing" style="background-color: white; font-size: 0.5em; text-align: center;">{{ rowIndex }}</td>
            </tr>
          </tbody>
        </table>


      </div>

      <div v-else="isLoggedIn" class="ui segment">
        <div class="ui segment" style="display: flex; height: 93.4vh;"> PER FAVORE EFFETTUA IL LOGIN </div>
      </div>

    </div>
  </div>

</template>

<style>
.busy {
  background-color: rgb(220, 145, 132);
}
.selected {
  background-color: rgb(169, 206, 201);
}
body {
  user-select: none;
}
</style>

