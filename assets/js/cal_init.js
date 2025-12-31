document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) {
    console.error("Calendar element not found");
    return;
  }

  function decodeQuotedPrintable(str) {
    try {
      return str.replace(/=([A-F0-9]{2})/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
    } catch {
      return str;
    }
  }

  // Convert UTC string to America/New_York Date object
  function convertToEST(utcStr) {
    if (!utcStr) return null;
    const date = new Date(utcStr);
    const options = {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    };
    const estStr = date.toLocaleString("en-US", options);
    return new Date(estStr);
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
        start: convertToEST(e.start),
        end: convertToEST(e.end),
        extendedProps: {
          url: e.url || null,
          description: e.description || ""
        }
      }));

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",

        /* Custom multi-month toggle button */
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

        events,
        timeZone: "America/New_York",
        height: "auto",

        /* Responsive view handling */
        datesSet() {
          if (window.innerWidth < 600 && calendar.view.type !== "listWeek") {
            calendar.changeView("listWeek");
          }
          if (window.innerWidth >= 600 && calendar.view.type === "listWeek") {
            calendar.changeView("dayGridMonth");
          }
        },

        /* Update multi-month toggle icon */
        viewDidMount(info) {
          const btn = document.querySelector(".fc-toggleMultiMonth-button");
          if (!btn) return;

          btn.dataset.icon =
            info.view.type === "multiMonthYear"
              ? "calendar_month"
              : "calendar_view_month";
        },

        /* Tooltip for events */
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
            timeZone: "America/New_York"
          };

          let tooltip = info.event.title;

          if (start) {
            tooltip += `\n${start.toLocaleString("en-US", options)}`;
            if (end) tooltip += ` - ${end.toLocaleString("en-US", options)}`;
          }

          if (info.event.extendedProps.url) tooltip += "\nClick to register";

          info.el.setAttribute("title", tooltip);
        },

        /* Modal on click */
        eventClick(info) {
          info.jsEvent.preventDefault();

          const modal = document.getElementById("event-modal");
          const titleEl = document.getElementById("fc-modal-title");
          const datetimeEl = document.getElementById("fc-modal-datetime");
          const descriptionEl = document.getElementById(
            "fc-modal-description"
          );
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
            timeZone: "America/New_York"
          };

          datetimeEl.textContent = start
            ? `${start.toLocaleString("en-US", options)}${
                end ? " - " + end.toLocaleString("en-US", options) : ""
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
