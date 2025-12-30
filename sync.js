import fs from "fs";
import ical from "node-ical";

const ICS_URL =
  "https://involvement.ubalt.edu/ics?group_ids=72934,23888,23844,23864&school=ubalt";

async function sync() {
  const data = await ical.async.fromURL(ICS_URL);

  const events = Object.values(data)
    .filter(e => e.type === "VEVENT" && e.status !== "CANCELLED")
    .map(e => ({
      id: e.uid,
      title: e.summary,
      start: e.start.toISOString(),
      end: e.end ? e.end.toISOString() : null
    }));

  fs.writeFileSync("events.json", JSON.stringify(events, null, 2));
}

sync();
