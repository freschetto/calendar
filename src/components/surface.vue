<script setup>

import { ref } from "vue";
import moment from "moment-timezone";

// VARIABLE FOR FRONT-END

const timezone = "Europe/Rome";
const days = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

let week = 0;
let table = ref(); let events = ref(); let month = ref();
let numdays = getNumDays();

// LOGIN AND SIGNOUT FUNCTION

let isLoggedIn = ref(false);

const checkLoginStatus = () => {
  const token = localStorage.getItem("token");
  isLoggedIn.value = !!token;
};

checkLoginStatus();

async function login() {
  window.open("http://localhost:3000/login", "LoginWindow");
  this.isLoggedIn = true;
}

async function logout() {
  await fetch("http://localhost:3000/logout", { method: "POST" });
  this.isLoggedIn = false;
  localStorage.removeItem("token");
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

  table.value = "";

  for (let row = 0; row < 24; row++) {

    table.value += "<tr>";

    for (let col = 0; col < 7; col++) {

      const style = tableMatrix[col][row] ? ' style="background-color: lightblue;"' : "";
      table.value += `<td${style}></td>`;

    }

    table.value += "</tr>";
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
          <button class="ui fluid button" @click="isLoggedIn ? logout() : login()">
            {{ isLoggedIn ? 'LOGOUT' : 'LOGIN' }}
          </button>
          <button class="ui icon button" @click="week=0;update();"><i class="sync alternate icon"></i></button>
        </div>
      </div>

      <!-- BUSY EVENTS LIST OF CALENDARS -->
      <div v-html="events" class="ui segment"></div>

    </div>

    <div class="twelve wide column">

      <!-- DISPLAY CALENDAR -->
      <div class="ui segment">

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
          <thead><tr class="center aligned">
            <th v-for="(day, index) in days" :key="day">{{ day }}<hr />{{ numdays[index] }}</th>
          </tr></thead>
          <tbody v-html="table"></tbody>
        </table>

      </div>

    </div>
  </div>

</template>
