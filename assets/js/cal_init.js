document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) {
    console.error("Calendar element not found");
    return;
  }

  function decodeQuotedPrintable(str) {
    try {
      return str.replace(/=([A-F0-9]{2})/gi, (match, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
    } catch {
      return str;
    }
  }

  fetch("events.json")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      const events = data.map(e => ({
        id: e.id,
        title: typeof e.title === "string" ? e.title : decodeQuotedPrintable(e.title.val || ""),
        start: e.start,
        end: e.end,
        extendedProps: {
          url: e.url || null,
          description: e.description || ""
        }
      }));

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",

        viewButtons: {
          toggleMultiMonth: {
            text: "",
            click: function() {
              const currentView = calendar.view.type;
              calendar.changeView (
                currentView === "dayGridMonth" ? "multiMonthYear" : "dayGridMonth"
              );
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

        setResponsiveView: function () {
          if(window.innerWidth < 600) {
            calendar.changeView("listWeek");
          } else {
            calendar.changeView("dayGridMonth");
          }
        }

        viewDidMount: function (info) {
          const view_btn = document.querySelector(".fc-toggleMultiMonth-button");
          if(!view_btn) return;

          view_btn.dataset.icon =
            info.view.type === "multiMonthYear" ? "calendar_month" : "calendar_view_month";
        },

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
          if (info.event.extendedProps.url) tooltip += "\nClick to register";
          info.el.setAttribute("title", tooltip);
        },

        eventClick: function (info) {
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
            minute: "2-digit"
          };
          datetimeEl.textContent = start
            ? `${start.toLocaleString([], options)}${
                end ? " - " + end.toLocaleString([], options) : ""
              }`
            : "";

          descriptionEl.textContent = info.event.extendedProps.description || "";

          if (info.event.extendedProps.url) {
            registerEl.style.display = "inline-block";
            registerEl.href = info.event.extendedProps.url;
          } else {
            registerEl.style.display = "none";
          }

          modal.style.display = "block";

          closeEl.onclick = () => (modal.style.display = "none");
          window.onclick = (event) => {
            if (event.target == modal) modal.style.display = "none";
          };
        }
      });
      
      setResponsiveView();
      window.addEventListener("resize", setResponsiveView);

      calendar.render();
    })
    .catch(err => console.error("Failed to load events:", err));
});
