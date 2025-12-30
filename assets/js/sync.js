import fs from "fs";
import ical from "node-ical";

const ICS_URL =
  "https://involvement.ubalt.edu/ics?group_ids=72934,23888,23844,23864&school=ubalt";

async function sync() {
  try {
    const data = await ical.async.fromURL(ICS_URL);

    const events = Object.values(data)
      .filter(e => e.type === "VEVENT" && e.status !== "CANCELLED")
      .map(e => ({
        id: e.uid,
        title: e.summary || "No title",
        start: e.start.toISOString(),
        end: e.end ? e.end.toISOString() : null,
        url: e.url || null // <-- Add registration URL if present
      }));

    fs.writeFileSync("events.json", JSON.stringify(events, null, 2));
    console.log(`Generated events.json with ${events.length} events.`);
  } catch (err) {
    console.error("Failed to sync events:", err);
  }
}

sync();
