document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) {
    console.error("Calendar element not found");
    return;
  }

  // Fetch JSON and normalize title
  fetch("events.json")
    .then((res) => res.json())
    .then((data) => {
      // Transform events for FullCalendar
      const events = data.map((e) => ({
        id: e.id,
        title: e.title.val, // <-- FIX HERE
        start: e.start,
        end: e.end
      }));

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        events: events,
        timeZone: "UTC",
        height: "auto"
      });

      calendar.render();
    })
    .catch((err) => console.error("Failed to load events:", err));
});
