<script setup>

import { ref } from "vue";
import moment from "moment-timezone";

// VARIABLE FOR FRONT-END

const timezone = "Europe/Rome";
const days = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

let week = 0;
let table = ref(); let month = ref(); let events = ref('');
let numdays = getNumDays();

// LOGIN AND SIGNOUT FUNCTION

let isLoggedIn = ref(false);

const checkLoginStatus = () => {
  const token = localStorage.getItem("token");
  isLoggedIn.value = !!token;
};

checkLoginStatus();

async function logout() {

  try {

    await fetch("http://localhost:3000/logout", { method: "POST" });

    localStorage.removeItem("token");
    this.isLoggedIn = false;

    // clear();
    
  } catch (error) {console.error("Logout failed:", error);}
}

async function login() {

  try {

    const loginWindow = window.open("http://localhost:3000/login", "LoginWindow");

    await new Promise((resolve, reject) => {
      const checkWindow = setInterval(() => {
        if (loginWindow.closed) {
          clearInterval(checkWindow);
          resolve();
        }
      }, 1000);
    });
    
    this.isLoggedIn = true;
    this.update();

  } catch (error) {
    console.error("Login failed:", error);
  }
}

// FUNCTION FOR MANAGE WEEKS

function update() {

  numdays = getNumDays();

  month = ref(moment.tz(timezone).add(week, "weeks").format("MMMM YYYY").toUpperCase());

  fetchBusyTimes();
}

function getNumDays() {

  let startOfWeek = moment.tz(timezone).add(week, "weeks").startOf("week");

  let weekDaysNumbers = [];

  for (let i = 0; i < 7; i++) {
    let dayNumber = startOfWeek.clone().add(i, "days").date();
    weekDaysNumbers.push(dayNumber);
  }

  return weekDaysNumbers;
}

// REQUEST BUSY TIMES INFORMATION BY WEEK

async function fetchBusyTimes() {

  await fetch("http://localhost:3000/queryFreeBusy", {
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

function getBusyTimeMatrix(busyTimes) {
  
  const tableMatrix = Array.from({ length: 7 }, () => Array(24).fill(false));

  Object.values(busyTimes).forEach(calendar => {

    calendar.busy.forEach(busyPeriod => {

      const start = new Date(busyPeriod.start);
      const end = new Date(busyPeriod.end);

      let day = start.getDay() - 1; day = day < 0 ? 6 : day;

      for (let hour = start.getHours(); hour < end.getHours(); hour++) {
        tableMatrix[day][hour] = true;
      }
    });
  }); return tableMatrix;
}

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

var freeTimes = [];

function toggleSelection(rowIndex, cellIndex) {
  table.value[rowIndex][cellIndex].isSelected = !table.value[rowIndex][cellIndex].isSelected;

  const index = freeTimes.findIndex(pair => pair[0] === rowIndex && pair[1] === cellIndex);

  if (index === -1) {
    // Se non trovato e la cella è selezionata, aggiungi la coppia a freeTimes
    if (table.value[rowIndex][cellIndex].isSelected) {
      freeTimes.push([rowIndex, cellIndex]);
    }
  } else {
    // Se trovato, rimuovi la coppia da freeTimes
    freeTimes.splice(index, 1);
  }
}

function generateEventHtml() {

  let html = '<div class="ui relaxed divided list">';
  let i = 0;

  while (i < freeTimes.length) {

    let before = freeTimes[i][1]; 

    html += `<div class="item content">
    <div class="header" style="margin-bottom: 0.2em">${days[freeTimes[i][1]]} ${numdays[freeTimes[i][1]]}</div>`;

    while (i < freeTimes.length && freeTimes[i][1] == before) {
      html += `<div class="description">from ${freeTimes[i][0]}:00 to ${freeTimes[i][0] + 1}:00</div>`; i++;
    }
      
    html += `</div>`;
    
  }

  html += '</div>';

  events.value = html;
}

function check(rowIndex, cellIndex) {
  toggleSelection(rowIndex, cellIndex);
  generateEventHtml();
}
</script>

<template>

  <div class="ui two column grid container" style="margin: 1em;">

    <div class="four wide column">

      <!-- USER'S SETTINGS -->
      <div class="ui segment">
        <div class="ui" style="display: flex;">
          <button class="ui icon button"><i class="cog icon"></i></button>
          <button v-if="isLoggedIn" class="ui negative fluid button" @click="logout()">LOGOUT</button>
          <button v-else="isLoggedIn" class="ui positive fluid button" @click="login()">LOGIN</button>
          <button v-if="isLoggedIn" class="ui icon blue button" @click="week=0;events=ref('');update();"><i class="sync alternate icon"></i></button>
          <button v-else="isLoggedIn" class="ui icon gray button"><i class="sync alternate icon"></i></button>
        </div>
      </div>

      <!-- BUSY EVENTS LIST OF CALENDARS -->
      <div v-html="events" class="ui segment"></div>

    </div>

    <div class="twelve wide column">

      <!-- DISPLAY CALENDAR -->
      <div v-if="isLoggedIn" class="ui segment">

        <!-- INFORMATION AND NAVIGATION-->
        <div class="ui" style="display: flex">

          <button class="ui icon button" @click="week--;update();">
            <i class="angle double left icon"></i>
          </button>
          <button class="fluid ui button"><p v-html="month"></p></button>
          <button class="ui icon button" @click="week++;update();">
            <i class="angle double right icon"></i>
          </button>

        </div>

        <!-- WEEKLY GRAPHICS CALENDAR -->
        <table id="table" class="ui celled fixed table">
  <thead>
    <tr class="center aligned">
      <th v-for="(day, index) in days" :key="day">{{ day }}<hr>{{ numdays[index] }}</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(row, rowIndex) in table" :key="`row-${rowIndex}`">
      <td @click="check(rowIndex, cellIndex)" v-for="(cell, cellIndex) in row" :key="`cell-${rowIndex}-${cellIndex}`" :class="{'busy': cell.isBusy, 'selected': cell.isSelected}"></td>
    </tr>
  </tbody>
</table>


      </div>

      <div v-else="isLoggedIn" class="ui segment">
        <div class="ui segment" style="display: flex"> PER FAVORE EFFETTUA IL LOGIN </div>
      </div>

    </div>
  </div>

</template>

<style>
.busy {
  background-color: lightblue;
}
.selected {
  background-color: yellow;
}
</style>

