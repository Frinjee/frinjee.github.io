document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) {
    console.error("Calendar element not found");
    return;
  }

  // Decode QUOTED-PRINTABLE titles
  function decodeQuotedPrintable(str) {
    try {
      return str.replace(/=([A-F0-9]{2})/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
    } catch {
      return str;
    }
  }

  fetch("events.json")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const events = data.map((e) => ({
        id: e.id,
        title:
          typeof e.title === "string"
            ? e.title
            : decodeQuotedPrintable(e.title?.val || ""),
        start: e.start, // UTC ISO string
        end: e.end,     // UTC ISO string
        extendedProps: {
          url: e.url || null,
          description: e.description || ""
        }
      }));

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        timeZone: "America/New_York", // Display all events in EST/EDT
        events,
        height: "auto",

        /* Force correct times in calendar boxes */
        eventTimeFormat: { 
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          meridiem: 'short'
        },

        /* Truncate long titles in calendar boxes only */
        eventContent: function(arg) {
          const maxChars = 27; // length of "International Women's Day"
          const displayTitle =
            arg.event.title.length > maxChars
              ? arg.event.title.slice(0, maxChars) + "…"
              : arg.event.title;

          // Use FullCalendar's built-in timeText (already in the correct timezone)
          const timeText = arg.timeText
            ? `<div class="fc-event-time">${arg.timeText}</div>`
            : "";

          return { html: timeText + `<div class="fc-event-title">${displayTitle}</div>` };
        },

        /* Custom toggle button */
        customButtons: {
          toggleMultiMonth: {
            text: "",
            click() {
              const newView =
                calendar.view.type === "dayGridMonth"
                  ? "multiMonthYear"
                  : "dayGridMonth";
              calendar.changeView(newView);
            }
          }
        },

        headerToolbar: {
          left: "",
          center: "title",
          right: "toggleMultiMonth"
        },

        footerToolbar: {
          left: "prev",
          center: "",
          right: "next"
        },

        /* Responsive view: auto switch to listWeek on mobile */
        datesSet() {
          if (window.innerWidth < 600 && calendar.view.type !== "listWeek") {
            calendar.changeView("listWeek");
          }
          if (window.innerWidth >= 600 && calendar.view.type === "listWeek") {
            calendar.changeView("dayGridMonth");
          }

          // Adjust scrollbars dynamically per day
          document.querySelectorAll('.fc-daygrid-day').forEach((dayCell) => {
            const eventsContainer = dayCell.querySelector('.fc-daygrid-day-events');
            if (eventsContainer) {
              if (eventsContainer.children.length > 0) {
                eventsContainer.style.maxHeight = '5em';
                eventsContainer.style.overflowY = 'auto';
                eventsContainer.style.scrollbarWidth = 'thin';
              } else {
                eventsContainer.style.maxHeight = 'none';
                eventsContainer.style.overflowY = 'visible';
              }
            }
          });
        },

        /* Update toggle icon */
        viewDidMount(info) {
          const btn = document.querySelector(".fc-toggleMultiMonth-button");
          if (!btn) return;

          btn.dataset.icon =
            info.view.type === "multiMonthYear"
              ? "calendar_month"
              : "calendar_view_month";
        },

        /* Tooltip on hover */
        eventDidMount(info) {
          const start = info.event.start;
          const end = info.event.end;
          const options = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "America/New_York"
          };

          let tooltip = info.event.title;
          if (start) {
            tooltip += `\n${start.toLocaleString([], options)} EST`;
            if (end) tooltip += ` - ${end.toLocaleString([], options)} EST`;
          }

          if (info.event.extendedProps.url) {
            tooltip += "\nClick to register";
          }

          info.el.setAttribute("title", tooltip);
        },

        /* Modal on click */
        eventClick(info) {
          info.jsEvent.preventDefault();

          const modal = document.getElementById("event-modal");
          const titleEl = document.getElementById("fc-modal-title");
          const datetimeEl = document.getElementById("fc-modal-datetime");
          const descriptionEl = document.getElementById("fc-modal-description");
          const registerEl = document.getElementById("fc-modal-register");
          const closeEl = document.getElementById("fc-modal-close");

          titleEl.textContent = info.event.title;

          const start = info.event.start;
          const end = info.event.end;
          const options = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "America/New_York"
          };

          datetimeEl.textContent = start
            ? `${start.toLocaleString([], options)}${
                end ? " - " + end.toLocaleString([], options) + " EST" : ""
              }`
            : "";

          descriptionEl.textContent =
            info.event.extendedProps.description || "";

          if (info.event.extendedProps.url) {
            registerEl.style.display = "inline-block";
            registerEl.href = info.event.extendedProps.url;
          } else {
            registerEl.style.display = "none";
          }

          modal.style.display = "block";

          closeEl.onclick = () => (modal.style.display = "none");
          window.onclick = (e) => {
            if (e.target === modal) modal.style.display = "none";
          };
        }
      });

      calendar.render();
    })
    .catch((err) => console.error("Failed to load events:", err));
});
