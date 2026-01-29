(function () {
    const DEFAULT_APP_TITLE_MATCH = /^\s*apply\b/i;

    // Attempt to tighten the feed if other patterns are introduced later 
    const DEFAULT_APP_KEYWORDS = [
        "application",
        "apply to",
        "apply for",
        "apply now"
    ];

    function safeString(v) {
        return (typeof v === "string" ? v: "") || "";
    }

    function isAppEvent(evt, opts) {
        const options = opts || {};
        const titleReg = options.titleReg || DEFAULT_APP_TITLE_MATCH;
        const keywords = options.keywords || DEFAULT_APP_KEYWORDS;

        const title = safeString(evt && evt.title);
        const desc = safeString(evt && evt.extendedProps && evt.extendedProps.description);

        if (titleReg.test(title)) return true;

        const haystack = (title + " " + desc).toLowerCase();
        return keywords.some(k => haystack.includes(k));
    }

    function isForwardActive(evt, now) {
        // For events that have not ended currently
        const end = evt && evt.end ? new Date(evt.end) : null;
        if (!end) return true;
        return end > now;
    }

    function splitEvents(allEvents, now, opts) {
        const current = now || new Date();

        const appEvents = [];
        const calEvents = [];

        allEvents.forEach(evt => {
            if (isAppEvent(evt, opts) && isForwardActive(evt, current)) {
                appEvents.push(evt);
            } else {
                calEvents.push(evt);
            }
        });
        return { calEvents, appEvents };
    }

    window.AppHandler = {
        isAppEvent,
        splitEvents
    };
}) ();