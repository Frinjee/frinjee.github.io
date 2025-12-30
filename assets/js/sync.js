import fs from "fs"; 
import ical from "node-ical";

const ICS_URL =
  "https://involvement.ubalt.edu/ics?group_ids=72934,23888,23844,23864&school=ubalt";

async function sync() {
  try {
    const data = await ical.async.fromURL(ICS_URL);

    const events = Object.values(data)
      .filter(e => e.type === "VEVENT" && e.status !== "CANCELLED")
      .map(e => {
        let descriptionText = "";
        let url = null;

        if (e.description) {
          const parts = e.description.split('---');
          descriptionText = parts[0].trim();
          if (parts[1]) {
            const match = parts[1].match(/Event Details:\s*(\S+)/i);
            if (match) url = match[1];
          }
        }

        return {
          id: e.uid,
          title: e.summary || "No title",
          start: e.start.toISOString(),
          end: e.end ? e.end.toISOString() : null,
          description: descriptionText,
          url: url
        };
      });

    fs.writeFileSync("events.json", JSON.stringify(events, null, 2));
    console.log(`Generated events.json with ${events.length} events.`);
  } catch (err) {
    console.error("Failed to sync events:", err);
  }
}

sync();
