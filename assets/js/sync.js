import fetch from "node-fetch";
import ical from "node-ical";
import fs from fs;

const ICS_URL = "https://involvement.ubalt.edu/ics?type=starredgroups&eid=b5ecb7ad12987be3f0d26d9154c08b9a";

async function sync() {
  const res = await fetch(ICS_URL);
  const icsText = await res.text();

  const data = ical.parseICS(icsText);

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