/**
 * Events data layer.
 *
 * Today this reads from a static events.json file. To move to Supabase,
 * Firebase, or an admin-dashboard API later, only loadEvents() below needs
 * to change (e.g. swap the fetch() for a client SDK call) — every UI module
 * consumes the same normalized event shape, so nothing else has to change.
 *
 * events.json fields are plain human-readable strings (so non-technical
 * editors can update them directly):
 *   { id, title, date: "2 August 2026", time: "9:00 AM", venue,
 *     description, posters: string[],
 *     registerLink: "https://..." }                          — single category, OR
 *     registerLinks: [{ label: "Junior Category", url: "..." },
 *                      { label: "Senior Category", url: "..." }]  — multiple categories
 *   Optional: telegramLink — shown as a secondary "join after registering" link.
 *
 * Normalized event shape (what every UI module consumes):
 * {
 *   id, title, dateObj, dateLabel, timeLabel, venue, description,
 *   registerLinks: [{ label, url }], telegramLink, posters: string[]
 * }
 */

const EVENTS_SOURCE = "events.json";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

export async function loadEvents() {
  const res = await fetch(EVENTS_SOURCE);
  if (!res.ok) {
    throw new Error("Failed to load events.json: " + res.status);
  }
  const raw = await res.json();
  return normalizeEvents(raw);
}

function normalizeEvents(rawEvents) {
  const today = startOfToday();

  return rawEvents
    .map(normalizeEvent)
    .filter(event => event.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj);
}

function normalizeEvent(raw) {
  const dateObj = parseEventDateTime(raw.date, raw.time);
  const posters = Array.isArray(raw.posters) && raw.posters.length
    ? raw.posters
    : (raw.image ? [raw.image] : []);

  const registerLinks = Array.isArray(raw.registerLinks) && raw.registerLinks.length
    ? raw.registerLinks
    : [{ label: "Register Now", url: raw.registerLink || "#" }];

  return {
    id: raw.id,
    title: raw.title || "",
    dateObj,
    dateLabel: raw.date || "",
    timeLabel: raw.time || "",
    venue: raw.venue || "",
    description: raw.description || "",
    registerLinks,
    telegramLink: raw.telegramLink || "",
    posters
  };
}

/**
 * Parses "2 August 2026" (+ optional "9:00 AM") into a real Date, used for
 * sorting, the upcoming-events filter and the homepage countdown. Parsed
 * manually (rather than relying on new Date(string)) because "D Month
 * YYYY" is interpreted inconsistently across browser engines.
 *
 * Not anchored to the full string, so a date RANGE like
 * "2 August 2026 - 9 August 2026" also matches — the countdown/sort/filter
 * all key off the first (start) date, while dateLabel still displays the
 * full range text as written in events.json.
 *
 * Falls back to the native parser, then to "far future" so a malformed
 * entry doesn't crash the page or get silently dropped from the list.
 */
function parseEventDateTime(dateStr, timeStr) {
  const match = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec((dateStr || "").trim());

  if (match) {
    const day = parseInt(match[1], 10);
    const monthIndex = MONTHS.indexOf(match[2].toLowerCase());
    const year = parseInt(match[3], 10);

    if (monthIndex !== -1) {
      const { hours, minutes } = parseTime(timeStr);
      return new Date(year, monthIndex, day, hours, minutes);
    }
  }

  const fallback = new Date(dateStr);
  if (!isNaN(fallback)) return fallback;

  console.warn("events.json: could not parse date \"" + dateStr + "\"");
  return new Date(8640000000000000);
}

function parseTime(timeStr) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec((timeStr || "").trim());
  if (!match) return { hours: 0, minutes: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
