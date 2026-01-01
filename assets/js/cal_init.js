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
      const events = data.map((event) => {
        const transformed = {
          id: event.id,
          title:
            typeof event.title === "string"
              ? event.title
              : decodeQuotedPrintable(event.title?.val || ""),
          start: event.start, // UTC ISO string
          end: event.end,     // UTC ISO string
          extendedProps: {
            url: event.url || null,
            description: event.description || ""
          }
        };

        // Enhance with org info if CalendarOrgs exists
        if (window.CalendarOrgs) {
          const orgData = window.CalendarOrgs.transformICSEvent({
            Title: event.title,
            Description: event.description,
            Location: event.location || "",
            UID: event.id,
            Starts: event.start,
            Ends: event.end
          });
          transformed.extendedProps.hostingOrg = orgData.extendedProps.hostingOrg;
          transformed.extendedProps.primaryOrg = orgData.extendedProps.primaryOrg;
          transformed.extendedProps.primaryOrgColor = orgData.extendedProps.primaryOrgColor;
          transformed.backgroundColor = transformed.extendedProps.primaryOrgColor;
        }

        return transformed;
      });

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        events,
        height: "auto",
        eventDisplay: "block",

        /* Force correct times in calendar boxes */
        eventTimeFormat: { 
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          meridiem: 'short'
        },

        /* Truncate long titles in calendar boxes only */
        eventContent: function(arg) {
          const maxChars = 27; 
          const displayTitle =
            arg.event.title.length > maxChars
              ? arg.event.title.slice(0, maxChars) + "…"
              : arg.event.title;

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

        headerToolbar: { left: "", center: "title", right: "toggleMultiMonth" },
        footerToolbar: { left: "prev", center: "", right: "next" },

        /* Responsive view: auto switch to listWeek on mobile */
        datesSet() {
          if (window.innerWidth < 600 && calendar.view.type !== "listWeek") {
            calendar.changeView("listWeek");
          }
          if (window.innerWidth >= 600 && calendar.view.type === "listWeek") {
            calendar.changeView("dayGridMonth");
          }

          document.querySelectorAll(".fc-daygrid-day").forEach((dayCell) => {
            const eventsContainer = dayCell.querySelector(".fc-daygrid-day-events");
            if (eventsContainer) {
              if (eventsContainer.children.length > 0) {
                eventsContainer.style.maxHeight = "5em";
                eventsContainer.style.overflowY = "auto";
                eventsContainer.style.scrollbarWidth = "thin";
              } else {
                eventsContainer.style.maxHeight = "none";
                eventsContainer.style.overflowY = "visible";
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
            hour12: true
          };

          // Base tooltip: title + time
          let tooltip = info.event.title;
          if (start) {
            tooltip += `\n${start.toLocaleString([], options)} EST`;
            if (end) tooltip += ` - ${end.toLocaleString([], options)} EST`;
          }

          // Add hosting orgs info
          if (info.event.extendedProps.hostingOrg) {
            tooltip += `\nHosted by: ${info.event.extendedProps.hostingOrg.join(", ")}`;
          }

          if (info.event.extendedProps.url) {
            tooltip += "\nClick to register";
          }

          info.el.setAttribute("title", tooltip);

          // Apply primary org color
          if (info.event.extendedProps.primaryOrgColor) {
            info.el.style.backgroundColor = info.event.extendedProps.primaryOrgColor;
            info.el.style.borderColor = info.el.style.backgroundColor;
          }
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
            hour12: true
          };

          datetimeEl.textContent =
            start
              ? `${start.toLocaleString([], options)}${
                  end ? " – " + end.toLocaleString([], options) + " EST" : ""
                }`
              : "";

          descriptionEl.textContent = info.event.extendedProps.description || "";

          const modalOrgsEl = document.getElementById("fc-modal-orgs");
          if (modalOrgsEl && info.event.extendedProps.hostingOrg) {
            modalOrgsEl.innerHTML = "";
            info.event.extendedProps.hostingOrg.forEach(org => {
              const span = document.createElement("span");
              span.className = "org-badge";
              span.textContent = org;

              const colorVar = window.CalendarOrgs ? window.CalendarOrgs.getPrimaryOrgColorVar({Title: info.event.title, Description: 
              info.event.extendedProps.description}) : "var(--color-satin_linen)";

              span.style.backgroundColor = colorVar;
              modalOrgsEl.appendChild(span);
            });
          }

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

      /* =====================================
         Upcoming Events Slim Card Integration
         ===================================== */
      const upcomingEvents = events
        .filter(e => e.start && new Date(e.start) > new Date())
        .sort((a, b) => new Date(a.start) - new Date(b.start));

      let upcomingIndex = 0;
      let upcomingInterval = null;

      const card = document.querySelector(".upcoming-event-card");

      if (card && upcomingEvents.length) {
        const titleEl = card.querySelector(".upcoming-event-title");
        const datetimeEl = card.querySelector(".upcoming-event-date-time");
        const contentEl = card.querySelector(".upcoming-event-content");
        const prevBtn = card.querySelector(".prev");
        const nextBtn = card.querySelector(".next");

        const formatOptions = {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        };

        function renderUpcoming(fade = true) {
          const event = upcomingEvents[upcomingIndex];
          const start = new Date(event.start);
          const end = event.end ? new Date(event.end) : null;

          if (fade) {
            card.style.opacity = 0;
          }

          setTimeout(() => {
            titleEl.textContent = event.title;
            datetimeEl.textContent =
              start.toLocaleString([], formatOptions) +
              (end ? " – " + end.toLocaleString([], formatOptions) : "");

            // Add org badges to upcoming card if available
            if (window.CalendarOrgs && event.extendedProps.hostingOrg) {
              const badgeContainer = card.querySelector(".upcoming-event-orgs");
              if(badgeContainer) {
                badgeContainer.innerHTML = "";
                event.extendedProps.hostingOrg.forEach(org => {
                  const span = document.createElement("span");
                  span.className = "org-badge";
                  span.textContent = org;

                  // Use Existing ORG_COLOR_MAP if available
                  const colorVar = window.CalendarOrgs ? window.CalendarOrgs.getPrimaryOrgColorVar({Title: info.event.title, Description: 
                  info.event.extendedProps.description || ""}) : "var(--color-satin_linen)";
                  span.style.backgroundColor = colorVar;
                  badgeContainer.appendChild(span);
                });
              } 
            }

            contentEl.onclick = (e) => {
              e.preventDefault();
              const calEvent = calendar.getEventById(event.id);
              if (calEvent) {
                calendar.trigger("eventClick", {
                  event: calEvent,
                  el: calendarEl,
                  jsEvent: e,
                  view: calendar.view
                });
              }
            };

            card.style.opacity = 1;
          }, fade ? 180 : 0);
        }

        function startAutoScroll() {
          if (upcomingInterval) return;
          upcomingInterval = setInterval(() => {
            upcomingIndex = (upcomingIndex + 1) % upcomingEvents.length;
            renderUpcoming();
          }, 6000);
        }

        function stopAutoScroll() {
          clearInterval(upcomingInterval);
          upcomingInterval = null;
        }

        prevBtn.onclick = () => {
          upcomingIndex = (upcomingIndex - 1 + upcomingEvents.length) % upcomingEvents.length;
          renderUpcoming();
        };

        nextBtn.onclick = () => {
          upcomingIndex = (upcomingIndex + 1) % upcomingEvents.length;
          renderUpcoming();
        };

        card.addEventListener("mouseenter", stopAutoScroll);
        card.addEventListener("mouseleave", startAutoScroll);

        renderUpcoming(false);
        startAutoScroll();
      }
    })
    .catch((err) => console.error("Failed to load events:", err));
});
