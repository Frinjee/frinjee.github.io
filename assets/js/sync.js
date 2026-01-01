import fs from "fs";
import crypto from "crypto";
import ical from "node-ical";

const ICS_URL =
  "https://involvement.ubalt.edu/ics?group_ids=72934,23888,23844,23864&school=ubalt";

const OUTPUT_FILE = "events.json";

/* ---------- helpers ---------- */

function normalizeText(input = "") {
  if (input == null) return "";

  try {
    const str = typeof input === "string" ? input : String(input);
    return str
      .replace(/\r\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim();  
  } catch {
    return "";
  }
}

function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readExistingEvents() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
  } catch {
    return [];
  }
}

function diffEvents(oldEvents, newEvents) {
  const oldMap = new Map(oldEvents.map(e => [e.id, e]));
  const newMap = new Map(newEvents.map(e => [e.id, e]));

  const added = [];
  const removed = [];
  const updated = [];

  for (const [id, newEvent] of newMap) {
    if (!oldMap.has(id)) {
      added.push(newEvent);
      continue;
    }

    const oldEvent = oldMap.get(id);
    const changes = {};

    ["title", "start", "end", "description", "url"].forEach(field => {
      if ((oldEvent[field] || "") !== (newEvent[field] || "")) {
        changes[field] = {
          from: oldEvent[field] || null,
          to: newEvent[field] || null
        };
      }
    });

    if (Object.keys(changes).length) {
      updated.push({
        id,
        title: newEvent.title,
        changes
      });
    }
  }

  for (const [id, oldEvent] of oldMap) {
    if (!newMap.has(id)) {
      removed.push(oldEvent);
    }
  }

  return { added, updated, removed };
}

/* ---------- main sync ---------- */

async function sync() {
  try {
    const data = await ical.async.fromURL(ICS_URL);

    const events = Object.values(data)
      .filter(e => e.type === "VEVENT" && e.status !== "CANCELLED" && e.start)
      .map(e => {
        let descriptionText = "";
        let url = null;

        if (e.description) {
          const parts = e.description.split("---");
          descriptionText = normalizeText(parts[0]);

          if (parts[1]) {
            const match = parts[1].match(/Event Details:\s*(\S+)/i);
            if (match) url = match[1];
          }
        }

        return {
          id: e.uid,
          title: normalizeText(e.summary || "No title"),
          start: e.start.toISOString(),
          end: e.end ? e.end.toISOString() : null,
          description: descriptionText,
          url
        };
      })
      .sort((a, b) => {
        if (a.start !== b.start) return a.start.localeCompare(b.start);
        return a.id.localeCompare(b.id);
      });

    const previousEvents = readExistingEvents();
    const diff = diffEvents(previousEvents, events);

    /* ---------- logging ---------- */

    if (
      diff.added.length ||
      diff.updated.length ||
      diff.removed.length
    ) {
      console.log("Calendar changes detected:");

      diff.added.forEach(e =>
        console.log(`🟢 Added: ${e.title} (${e.start})`)
      );

      diff.updated.forEach(e => {
        console.log(`🔵 Updated: ${e.title}`);
        Object.entries(e.changes).forEach(([field, change]) => {
          console.log(`   - ${field}: "${change.from}" → "${change.to}"`);
        });
      });

      diff.removed.forEach(e =>
        console.log(`🔴 Removed: ${e.title} (${e.start})`)
      );
    } else {
      console.log("No event-level changes detected.");
    }

    const newContent = JSON.stringify(events, null, 2);
    const oldContent = fs.existsSync(OUTPUT_FILE)
      ? fs.readFileSync(OUTPUT_FILE, "utf8")
      : null;

    if (oldContent && hashContent(oldContent) === hashContent(newContent)) {
      console.log("No file changes — events.json not updated.");
      return;
    }

    fs.writeFileSync(OUTPUT_FILE, newContent);
    console.log(`events.json updated (${events.length} events).`);
  } catch (err) {
    console.error("Failed to sync events:", err);
    process.exit(1);
  }
}

sync();
