document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) {
    console.error("Calendar element not found");
    return;
  }

  // Decode QUOTED-PRINTABLE titles if needed
  function decodeQuotedPrintable(str) {
    try {
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
      // Normalize events: title + optional url + description
      const events = data.map((e) => ({
        id: e.id,
        title:
          typeof e.title === "string"
            ? e.title
            : decodeQuotedPrintable(e.title.val || ""),
        start: e.start,
        end: e.end,
        url: e.url || null,
        description: e.description || ""
      }));

      // Initialize FullCalendar
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        events: events,
        timeZone: "UTC",
        height: "auto",

        // Tooltip for all events
        eventDidMount: function (info) {
          const start = info.event.start;
          const end = info.event.end;
          const options = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          };
          let tooltip = info.event.title;
          if (start) {
            tooltip += `\n${start.toLocaleString([], options)}`;
            if (end) tooltip += ` - ${end.toLocaleString([], options)}`;
          }
          if (info.event.url) {
            tooltip += "\nClick to register";
          }
          info.el.setAttribute("title", tooltip);
        },

        // Event click: show modal with details
        eventClick: function (info) {
          info.jsEvent.preventDefault();

          const modal = document.getElementById("event-modal");
          const titleEl = document.getElementById("fc-modal-title");
          const datetimeEl = document.getElementById("fc-modal-datetime");
          const descriptionEl = document.getElementById("fc-modal-description");
          const registerEl = document.getElementById("fc-modal-register");
          const closeEl = document.getElementById("fc-modal-close");

          // Set modal content
          titleEl.textContent = info.event.title;

          const start = info.event.start;
          const end = info.event.end;
          const options = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          };
          datetimeEl.textContent = start
            ? `${start.toLocaleString([], options)}${
                end ? " - " + end.toLocaleString([], options) : ""
              }`
            : "";

          // Show description if available
          descriptionEl.textContent = info.event.extendedProps.description || "";

          // Show or hide register button
          if (info.event.url) {
            registerEl.style.display = "inline-block";
            registerEl.href = info.event.url;
          } else {
            registerEl.style.display = "none";
          }

          // Show modal
          modal.style.display = "block";

          // Close modal when clicking X
          closeEl.onclick = function () {
            modal.style.display = "none";
          };

          // Close modal when clicking outside content
          window.onclick = function (event) {
            if (event.target == modal) {
              modal.style.display = "none";
            }
          };
        }
      });

      calendar.render();
    })
    .catch((err) => console.error("Failed to load events:", err));
});
