let scale = 1;
let theme = "light";
let use24Hour = true;
let clock = {
  hours: "19",
  minutes: "28",
  seconds: "17",
  date: "SEPTEMBER 21, 2026",
  weekday: "MONDAY",
  period: "PM",
  colonVisible: true,
};

const COLORS = {
  light: {
    main: "rgb(25,25,25)",
    accent: "rgb(70,145,245)",
    subtle: "rgba(25,25,25,0.68)",
  },
  dark: {
    main: "rgb(247,247,247)",
    accent: "rgb(90,165,255)",
    subtle: "rgba(247,247,247,0.68)",
  },
};

function render() {
  const s = scale;
  const c = COLORS[theme];
  const W = Math.round(310 * s);
  const H = Math.round(235 * s);
  const ids = [
    "background",
    "hours",
    "colon",
    "minutes",
    "seconds",
    "period",
    "accent",
    "date",
    "weekday",
  ];
  ui.beginUpdate();
  ids.forEach(function (id) {
    if (ui.isElementExist(id)) ui.removeElementById(id);
  });

  // This invisible shape is the shared coordinate frame for every label.
  // Its midpoint is used below just like the working CleanTime layout.
  ui.addShape({
    id: "background",
    shapeType: "rectangle",
    x: 0,
    y: 0,
    width: W,
    height: H,
    fillColor: "rgba(0,0,0,0)",
    strokeWidth: 0,
  });
  const centerX = W / 2;
  ui.addText({
    id: "hours",
    x: centerX - 80 * s,
    y: 30 * s,
    width: 105 * s,
    height: 92 * s,
    text: clock.hours,
    fontFace: "Segoe UI Light",
    fontSize: 75 * s,
    fontWeight: "light",
    fontColor: c.main,
    textAlign: "center-center",
  });
  ui.addText({
    id: "colon",
    x: centerX - 23 * s,
    y: 33 * s,
    width: 24 * s,
    height: 82 * s,
    text: ":",
    fontFace: "Segoe UI",
    fontSize: 62 * s,
    fontWeight: "light",
    fontColor: clock.colonVisible ? c.accent : "rgba(0,0,0,0)",
    textAlign: "center-center",
  });
  ui.addText({
    id: "minutes",
    x: centerX + 34 * s,
    y: 30 * s,
    width: 105 * s,
    height: 92 * s,
    text: clock.minutes,
    fontFace: "Segoe UI Light",
    fontSize: 75 * s,
    fontWeight: "light",
    fontColor: c.main,
    textAlign: "center-center",
  });
  ui.addText({
    id: "seconds",
    x: centerX + 95 * s,
    y: 64 * s,
    width: 42 * s,
    height: 25 * s,
    text: clock.seconds,
    fontFace: "Segoe UI",
    fontSize: 20 * s,
    fontWeight: "normal",
    fontColor: c.accent,
    textAlign: "left-center",
  });
  ui.addText({
    id: "period",
    x: centerX + 95 * s,
    y: 42 * s,
    width: 42 * s,
    height: 18 * s,
    text: use24Hour ? "" : clock.period,
    fontFace: "Segoe UI",
    fontSize: 11 * s,
    fontWeight: "semibold",
    fontColor: c.subtle,
    textAlign: "left-center",
  });
  ui.addShape({
    id: "accent",
    shapeType: "rectangle",
    x: 123 * s,
    y: 128 * s,
    width: 56 * s,
    height: Math.max(2, 3 * s),
    fillColor: c.accent,
    strokeWidth: 0,
  });
  ui.addText({
    id: "date",
    x: centerX,
    y: 151 * s,
    width: 250 * s,
    height: 25 * s,
    text: clock.date,
    fontFace: "Segoe UI",
    fontSize: 16 * s,
    fontWeight: "semibold",
    fontColor: c.main,
    letterSpacing: Math.max(1, 3 * s),
    textAlign: "center-center",
  });
  ui.addText({
    id: "weekday",
    x: centerX,
    y: 184 * s,
    width: 250 * s,
    height: 21 * s,
    text: clock.weekday,
    fontFace: "Segoe UI",
    fontSize: 13 * s,
    fontWeight: "normal",
    fontColor: c.subtle,
    letterSpacing: Math.max(1, 4 * s),
    textAlign: "center-center",
  });
  ui.endUpdate();
}

function applyClock(data) {
  if (!data) return;
  const rerender =
    data.scale !== scale ||
    data.theme !== theme ||
    data.use24Hour !== use24Hour;
  if (typeof data.scale === "number") scale = data.scale;
  if (COLORS[data.theme]) theme = data.theme;
  if (typeof data.use24Hour === "boolean") use24Hour = data.use24Hour;
  ["hours", "minutes", "seconds", "date", "weekday", "period"].forEach(
    function (key) {
      if (typeof data[key] === "string") clock[key] = data[key];
    },
  );
  if (typeof data.colonVisible === "boolean")
    clock.colonVisible = data.colonVisible;
  if (rerender) {
    render();
    return;
  }
  const c = COLORS[theme];
  ui.beginUpdate();
  ui.setElementProperties("hours", { text: clock.hours });
  ui.setElementProperties("minutes", { text: clock.minutes });
  ui.setElementProperties("seconds", { text: clock.seconds });
  ui.setElementProperties("period", { text: use24Hour ? "" : clock.period });
  ui.setElementProperties("date", { text: clock.date });
  ui.setElementProperties("weekday", { text: clock.weekday });
  ui.setElementProperties("colon", {
    fontColor: clock.colonVisible ? c.accent : "rgba(0,0,0,0)",
  });
  ui.endUpdate();
}

applyClock(ipcRenderer.invoke("FineTime.getStartupData"));
render();
ipcRenderer.on("FineTime.settings", function (event, settings) {
  applyClock(settings);
});
ipcRenderer.on("FineTime.clock", function (event, data) {
  applyClock(data);
});
ipcRenderer.send("FineTime.ready");
