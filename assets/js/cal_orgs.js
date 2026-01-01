// Organization Detection, Handling, and Color Mapping - cal_orgs.js


/* ORG MATCH DEFINITIONS */
const ORG_MATCHERS = [
    {key: "NSLS", match: /nsls|national society of leadership and success|leadership training|induction|snt/i},
    {key: "WoCSA", match: /wocsa|women of color student association/i},
    {key: "ODK", match: /omicron delta kappa|\bodk\b/i},
    {key: "CSEI", match: /center for student engagement and involvement|csei/i},
    {key: "DIS", match: /diversity and international services|\bdis\b/i},
    {key: "BSU", match:/black student union|\bbsu\b/i},
    {key: "TitleIX", match:/title ix|diversity equity and inclusion|\bdei\b/i}
];

/* ---------- ORG → COLOR MAP (CSS VARS) ---------- */

const ORG_COLOR_MAP = {
    NSLS: "var(--color-nsls-regent_st_blue)",
    WoCSA: "var(--color-wocsa-peranopurp)",
    ODK: "var(--color-odk-sinbad)",            
    CSEI: "var(--color-csei-zanah)",
    DIS: "var(--color-dis-sidecar)",
    BSU: "var(--color-bsu-mandys_pink)",
    TitleIX: "var(--color-titleix-wewak)",
    Multi: "var(--color-multi-vanilla_ice)", // Multiple Orgs Detected
    Campus: "var(--color-satin_linen)" // Safety Fallback/Catch
};

/* ---------- ORG → EMOJI MAP ---------- */
const ORG_EMOJI_MAP = {
    BSU: "✊🏿",
    DIS: "🌍",
    TitleIX: "🙌🏽",
    ODK: "🌟",
    NSLS: "👩🏾‍🎓",
    WoCSA: "💜",
    CSEI: "🤝",
    Campus: "📣"
};

/* ---------- ORG DETECTION ---------- */

/**
 * Returns all matching org keys for an event based on its ICS fields.
 * If no matches found, returns ["Campus"].
 */
function getHostOrgFromICS(event) {
    const searchable = `
    ${event.Title || ""}
    ${event.Description || ""}
    ${event.Location || ""}
    `
    .toLocaleUpperCase()
    .replace(/\s+/g, " ")
    .trim();

    const matches = ORG_MATCHERS
        .filter(org => org.match.test(searchable))
        .map(org => org.key);

    return matches.length ? matches : ["Campus"];
    
}

/**
 * Returns first org found as primary host organization.
 */

function getPrimaryOrgFromICS(event) {
    const orgs = getHostOrgFromICS(event);
    return orgs[0];
}

/**
 * Returns CSS Color var for primary host organization.
 */
function getPrimaryOrgColorVar(event) {
    const primaryOrg = getPrimaryOrgFromICS(event);
    return ORG_COLOR_MAP[primaryOrg] || ORG_COLOR_MAP["Campus"];
}

function getPrimaryOrgEmoji(event) {
    const primaryOrg = getPrimaryOrgFromICS(event);
    return ORG_EMOJI_MAP[primaryOrg] || ORG_EMOJI_MAP["Campus"];
}

function getOrgEmojis(event) {
    const orgs = getHostOrgFromICS(event);
    const emojis = orgs.map(org => ORG_EMOJI_MAP[org] || ORG_EMOJI_MAP["Campus"])
                       .filter(emoji => emoji.length >0)
                       .join(" ");
    return emojis;
}   
/* ---------- URL EXTRACTION & HANDLING ---------- */

// Extract RSVP/Registration link
function extractURL(description = "") {
    const urlMatcher = description.match(/https?:\/\/[^\s]+/i);
    return urlMatcher ? urlMatcher[0] : null;
}

// Improve raw ICS event data -> FullCalendar compatible event object
function transformICSEvent(event) {
    return {
        id: event.UID || `${event.Title}-${event.Starts}`,
        title: event.Title || "No Title",
        start: event.Starts,
        end: event.Ends,
        extendedProps: {
            hostingOrg: getHostOrgFromICS(event),
            primaryOrg: getPrimaryOrgFromICS(event),
            primaryOrgColor: getPrimaryOrgColorVar(event),
            description: event.Description || "",
            location: event.Location || "",
            url: extractURL(event.Description)
        }
    };
}

/* ---------- GLOBAL EXPOSURE ---------- */

window.CalendarOrgs = {
    getHostOrgFromICS,
    getPrimaryOrgFromICS,
    getPrimaryOrgColorVar,
    getPrimaryOrgEmoji,
    getOrgEmojis,
    transformICSEvent
};