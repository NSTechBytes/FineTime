/*
 * Copyright (c) 2026 nstechbytes
 *
 * Licensed under the Apache License, Version 2.0.
 * You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { app, widgetWindow } from "novadesk";

const BASE_WIDTH = 310;
const BASE_HEIGHT = 235;
const SCALE_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const STORAGE = {
  scale: "FineTime.scale",
  theme: "FineTime.theme",
  use24Hour: "FineTime.use24Hour",
};

let scale = 1;
let theme = "light";
let use24Hour = true;
let clockWindow = null;
let timer = null;

function loadSettings() {
  try {
    const savedScale = app.storage.get(STORAGE.scale, scale);
    const savedTheme = app.storage.get(STORAGE.theme, theme);
    const savedFormat = app.storage.get(STORAGE.use24Hour, use24Hour);
    if (SCALE_OPTIONS.indexOf(savedScale) !== -1) scale = savedScale;
    if (savedTheme === "light" || savedTheme === "dark") theme = savedTheme;
    if (typeof savedFormat === "boolean") use24Hour = savedFormat;
  } catch (error) {
    console.log("FineTime could not load settings:", error);
  }
}

function save(key, value) {
  try {
    app.storage.set(key, value);
  } catch (error) {
    console.log("FineTime could not save a setting:", error);
  }
}

function getClockData() {
  const now = new Date();
  const weekdays = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];
  const hours = now.getHours();
  const shownHours = use24Hour ? hours : hours % 12 || 12;
  return {
    hours: String(shownHours).padStart(2, "0"),
    minutes: String(now.getMinutes()).padStart(2, "0"),
    seconds: String(now.getSeconds()).padStart(2, "0"),
    date:
      months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear(),
    weekday: weekdays[now.getDay()],
    period: hours >= 12 ? "PM" : "AM",
    scale: scale,
    theme: theme,
    use24Hour: use24Hour,
  };
}

function publishClock() {
  ipcMain.send("FineTime.clock", getClockData());
}

function pushSettings() {
  ipcMain.send("FineTime.settings", {
    scale: scale,
    theme: theme,
    use24Hour: use24Hour,
  });
  publishClock();
}

function setScale(value) {
  if (SCALE_OPTIONS.indexOf(value) === -1) return;
  scale = value;
  save(STORAGE.scale, scale);
  clockWindow.setSize(
    Math.round(BASE_WIDTH * scale),
    Math.round(BASE_HEIGHT * scale),
  );
  clockWindow.setContextMenu(buildContextMenu());
  pushSettings();
}

function setTheme(value) {
  if (value !== "light" && value !== "dark") return;
  theme = value;
  save(STORAGE.theme, theme);
  clockWindow.setContextMenu(buildContextMenu());
  pushSettings();
}

function setTimeFormat(value) {
  use24Hour = value === true;
  save(STORAGE.use24Hour, use24Hour);
  clockWindow.setContextMenu(buildContextMenu());
  pushSettings();
}

function scaleLabel(value) {
  return value === 1 ? "1X" : String(value).replace(".0", "") + "X";
}

function buildContextMenu() {
  return [
    {
      text: "Scale",
      items: SCALE_OPTIONS.map(function (value) {
        return {
          text: scaleLabel(value),
          checked: scale === value,
          action: function () {
            setScale(value);
          },
        };
      }),
    },
    {
      text: "Theme",
      items: [
        {
          text: "Light",
          checked: theme === "light",
          action: function () {
            setTheme("light");
          },
        },
        {
          text: "Dark",
          checked: theme === "dark",
          action: function () {
            setTheme("dark");
          },
        },
      ],
    },
    {
      text: "Time Format",
      items: [
        {
          text: "12 Hour",
          checked: !use24Hour,
          action: function () {
            setTimeFormat(false);
          },
        },
        {
          text: "24 Hour",
          checked: use24Hour,
          action: function () {
            setTimeFormat(true);
          },
        },
      ],
    },
  ];
}

loadSettings();
ipcMain.handle("FineTime.getStartupData", function () {
  return getClockData();
});

clockWindow = new widgetWindow({
  id: "FineTime.Window",
  width: Math.round(BASE_WIDTH * scale),
  height: Math.round(BASE_HEIGHT * scale),
  script: "ui/script.ui.js",
  backgroundColor: "rgba(0,0,0,0)",
  draggable: true,
  snapEdges: true,
  keepOnScreen: true,
});
clockWindow.setContextMenu(buildContextMenu());

ipcMain.on("FineTime.ready", function () {
  pushSettings();
});
timer = setInterval(publishClock, 1000);
clockWindow.on("close", function () {
  if (timer) clearInterval(timer);
  timer = null;
});
