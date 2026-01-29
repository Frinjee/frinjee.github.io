document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) {
    console.error("Calendar element not found");
    return;
  }

  /* =====================================
         Haptics: safe no-op when supported
     ===================================== */
  function hapticSwipe(pattern = 10) {
    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.vibrate === "function" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        navigator.vibrate(pattern);
      }
    } catch (_){}
  }


  /* =====================================
         Swipe Integration Mobile Utility
     ===================================== */
  function mobileSwipeListener(el, onLeft, onRight) {
    let startX = 0;
    let endX = 0;

    el.addEventListener("touchstart", e => {
      startX = (e.touches && e.touches[0] ? e.touches[0].screenX : 0);
    }, { passive: true });

    el.addEventListener("touchend", e => {
      endX = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].screenX : 0);
      const delta = endX - startX;

      if(Math.abs(delta) > 50) {
        hapticSwipe(10);
        delta < 0 ? onLeft() : onRight();
      }

    }, { passive: true });
  }

  /* =====================================
         Decode Quoted Printables Utility
     ===================================== */
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
          transformed.extendedProps.primaryOrgEmoji = orgData.extendedProps.primaryOrgEmoji;
          transformed.extendedProps.orgEmojis = orgData.extendedProps.orgEmojis;
        }

        return transformed;
      });

      //
      const now = new Date();
      const split = window.AppHandler
                    ? window.AppHandler.splitEvents(events, now)
                    : { calEvents: events, appEvents: []};
      const calEvents = split.calEvents;
      const appEvents = split.appEvents;

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        events: calEvents,
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

        headerToolbar: { left: "toggleMultiMonth", center: "title", right: "prev,next" },
        footerToolbar: { left: "", center: "", right: "" },

        /* Responsive view: auto switch to listWeek on mobile */
        datesSet() {
          if (window.innerWidth < 640 && calendar.view.type !== "listWeek") {
            calendar.changeView("listWeek");
          }
          if (window.innerWidth >= 640 && calendar.view.type === "listWeek") {
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

              const colorVar = window.CalendarOrgs 
                               ? window.CalendarOrgs.getPrimaryOrgColorVar({
                               Title: info.event.title, 
                               Description: info.event.extendedProps.description || ""
                               }) : "var(--color-pigeon_post)";
              
              span.textContent = org;
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
         "Jump-to First" Mobile Utility
         ===================================== */
      const firstUpcoming = calEvents
        .filter(e => e.start && new Date(e.start) > new Date())
        .sort((a,b) => new Date(a.start) - new Date(b.start))[0];

      if(firstUpcoming) {
        setTimeout(() => {
          calendar.gotoDate(firstUpcoming.start);
        }, 0);
      }

      /* =====================================
         Swipe Nav Calendar Functionality
         ===================================== */
      mobileSwipeListener(
        calendarEl,
        () => calendar.next(),
        () => calendar.prev()
      );

      /* =====================================
         Upcoming event Slim Card Integration
         ===================================== */
      const upcomingEvents = calEvents
        .filter(e => e.start && new Date(e.start) > new Date())
        .sort((a, b) => new Date(a.start) - new Date(b.start));

      function initSlide(cardEl, slideEvents, calendar) {
        if (!cardEl || !slideEvents || !slideEvents.length) return;

        let idx = 0;
        let interval =  null;

        const titleEl = cardEl.querySelector(".upcoming-event-title");
        const datetimeEl = cardEl.querySelector(".upcoming-event-date-time");
        const contentEl = cardEl.querySelector(".upcoming-event-content");
        const prevBtn = cardEl.querySelector(".prev");
        const nextBtn = cardEl.querySelector(".next");
           
        const formatOptions = {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          };

        function render(fade = true)  {
          const event = slideEvents[idx];
          const start = new Date(event.start);
          const end = event.end ? new Date(event.end) : null;

          if(fade) cardEl.style.opacity = 0;

          setTimeout(() => {
            const orgEmojiEventObj = {
              Title: event.title,
              Description: event.extendedProps.description  || ""
            };

            const emoji = window.CalendarOrgs
                          ? window.CalendarOrgs.getPrimaryOrgEmoji(orgEmojiEventObj) : "";
            
            if (titleEl) titleEl.textContent = emoji ? `${emoji} ${event.title}` : event.title;

            // for longer ranged app windows
            if (datetimeEl) {
              datetimeEl.textContent = start.toLocaleString([], formatOptions) +
              (end ? " - " + end.toLocaleString([], formatOptions): "");
            }

            // Add org badges to upcoming card if available
            if (window.CalendarOrgs && event.extendedProps.hostingOrg) {
              const badgeContainer = cardEl.querySelector(".upcoming-event-orgs");
              if(badgeContainer) {
                badgeContainer.innerHTML = "";
                event.extendedProps.hostingOrg.forEach(org => {
                  const span = document.createElement("span");
                  span.className = "org-badge";
                  span.textContent = org;

                  // Use Existing ORG_COLOR_MAP if available
                  const colorVar = window.CalendarOrgs 
                                  ? window.CalendarOrgs.getPrimaryOrgColorVar({
                                  Title: event.title, 
                                  Description: event.extendedProps.description || ""
                                  }) : "var(--color-pigeon_post)";
                                  span.style.backgroundColor = colorVar;
                                  badgeContainer.appendChild(span);
                  });
                } 
              }
              // click behavior (normal events -> modal via cal event click), (app items -> open url directly)
              if (contentEl) {
                contentEl.onclick = (e) => {
                  e.preventDefault();

                  const calEvents = calendar.getEventById(event.id);
                  if(calEvents)  {
                    calendar.trigger("eventClick", {
                      event: calEvents,
                      el: calendarEl,
                      jsEvent: e,
                      view: calendar.view
                    });
                    return;
                  }

                  if(event.extendedProps && event.extendedProps.url) {
                    window.open(event.extendedProps.url, "_blank", "noopener");
                  }
                };
              }

              cardEl.style.opacity = 1;
          }, fade ? 180 : 0);
        }

        function startAuto() {
          if(interval) return;
          interval = setInterval(() => {
            idx = (idx + 1) % slideEvents.length;
            render();
          }, 6000);
        }

        function stopAuto() {
          clearInterval(interval);
          interval = null;
        }

        if (prevBtn) prevBtn.onclick = () => { idx = (idx - 1 + slideEvents.length) % slideEvents.length; render(); };
        if (nextBtn) nextBtn.onclick = () => { idx = (idx + 1) % slideEvents.length; render(); };

        cardEl.addEventListener("mouseenter", stopAuto);
        cardEl.addEventListener("mouseleave", startAuto);

        render(false);
        startAuto();
      }

      const upcomingCard = document.querySelector(".upcoming-event-card");
      initSlide(upcomingCard, upcomingEvents, calendar);
      
      const appSlide = appEvents
                      .filter(e => {
                        const s = new Date (e.start);
                        const en = e.end ? new Date(e.end) : null;
                        const now = new Date();
                        return s <= now && (!en || en > now);
                      });
      
      const applicationCard = document.querySelector(".application-card");
      initSlide(applicationCard, appSlide, calendar);
    });
});
