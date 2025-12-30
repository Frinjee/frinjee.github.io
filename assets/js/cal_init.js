document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) {
    console.error("Calendar element not found");
    return;
  }

  // Decode QUOTED-PRINTABLE titles if needed
  function decodeQuotedPrintable(str) {
    try {
      // Replace =XX hex codes
      return str.replace(/=([A-F0-9]{2})/gi, function (match, hex) {
        return String.fromCharCode(parseInt(hex, 16));
      });
    } catch {
      return str; // fallback
    }
  }

  // Fetch events.json and normalize
  fetch("events.json")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const events = data.map((e) => ({
        id: e.id,
        title: typeof e.title === "string"
          ? e.title
          : decodeQuotedPrintable(e.title.val || ""),
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
