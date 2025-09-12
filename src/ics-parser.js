// src/ics-parser.js
import { DateTime } from 'luxon';
import {
  unfoldICS,
  unescapeICSText,
  extractVEventBody,
  parseProp,
  parseProps,
  parseIcsEventTimes
} from './ics-datetime.js';

/** Extract a single-line string prop like SUMMARY/DESCRIPTION/LOCATION/URL/STATUS */
function textProp(body, name) {
  const p = parseProp(body, name);
  return p ? unescapeICSText(p.value) : null;
}

/** Parse ORGANIZER param set + value (MAILTO) */
function parseOrganizer(body) {
  const p = parseProp(body, 'ORGANIZER');
  if (!p) return null;
  const mail = (p.value || '').replace(/^MAILTO:/i, '');
  return {
    name: p.params?.CN ? unescapeICSText(p.params.CN) : null,
    email: mail || null
  };
}

/** Parse ATTENDEE lines -> array of attendee objects */
function parseAttendees(body) {
  const arr = parseProps(body, 'ATTENDEE');
  return arr.map(p => {
    const email = (p.value || '').replace(/^MAILTO:/i, '');
    const params = p.params || {};
    return {
      name: params.CN ? unescapeICSText(params.CN) : null,
      email: email || null,
      role: params.ROLE || null,
      partstat: params.PARTSTAT || null,
      rsvp: params.RSVP ? params.RSVP.toUpperCase() === 'TRUE' : null,
      cutype: params.CUTYPE || null
    };
  });
}

function parseCategories(body) {
  const p = parseProp(body, 'CATEGORIES');
  if (!p) return [];
  return p.value.split(',').map(s => unescapeICSText(s.trim())).filter(Boolean);
}

function parseGeo(body) {
  const p = parseProp(body, 'GEO');
  if (!p) return null;
  const [lat, lon] = p.value.split(';').map(Number);
  if (isFinite(lat) && isFinite(lon)) return { lat, lon };
  return null;
}

function parseNumberProp(body, name) {
  const p = parseProp(body, name);
  return p ? Number(p.value) : null;
}

function parseDateUTC(body, name) {
  const p = parseProp(body, name);
  if (!p) return null;
  const m = p.value.match(/^(\d{8})T(\d{6})Z$/);
  if (m) return DateTime.fromFormat(p.value, "yyyyLLdd'T'HHmmss'Z'", { zone: 'UTC' });
  return DateTime.fromISO(p.value, { zone: 'UTC' });
}

function parseRecurrence(body) {
  const rrule = parseProp(body, 'RRULE')?.value || null;
  const exdates = [];
  const rdates = [];

  for (const p of parseProps(body, 'EXDATE')) {
    const tzid = p.params?.TZID || null;
    for (const t of p.value.split(',')) {
      const tok = t.trim();
      if (!tok) continue;
      if (/^\d{8}$/.test(tok)) {
        exdates.push(DateTime.fromFormat(tok, 'yyyyLLdd', { zone: tzid || 'UTC' }));
      } else if (/^\d{8}T\d{6}Z$/.test(tok)) {
        exdates.push(DateTime.fromFormat(tok, "yyyyLLdd'T'HHmmss'Z'", { zone: 'UTC' }));
      } else if (/^\d{8}T\d{6}$/.test(tok)) {
        exdates.push(DateTime.fromFormat(tok, "yyyyLLdd'T'HHmmss", { zone: tzid || 'UTC' }));
      } else {
        exdates.push(DateTime.fromISO(tok, { zone: tzid || 'UTC' }));
      }
    }
  }

  for (const p of parseProps(body, 'RDATE')) {
    const tzid = p.params?.TZID || null;
    for (const t of p.value.split(',')) {
      const tok = t.trim();
      if (!tok) continue;
      if (/^\d{8}$/.test(tok)) {
        rdates.push(DateTime.fromFormat(tok, 'yyyyLLdd', { zone: tzid || 'UTC' }));
      } else if (/^\d{8}T\d{6}Z$/.test(tok)) {
        rdates.push(DateTime.fromFormat(tok, "yyyyLLdd'T'HHmmss'Z'", { zone: 'UTC' }));
      } else if (/^\d{8}T\d{6}$/.test(tok)) {
        rdates.push(DateTime.fromFormat(tok, "yyyyLLdd'T'HHmmss", { zone: tzid || 'UTC' }));
      } else {
        rdates.push(DateTime.fromISO(tok, { zone: tzid || 'UTC' }));
      }
    }
  }

  const recurId = parseProp(body, 'RECURRENCE-ID')?.value || null;

  return { rrule, exdates, rdates, recurrenceId: recurId };
}

export function parseIcsEvent(ics, defaultZone = 'UTC') {
  const unfolded = unfoldICS(ics);
  const body = extractVEventBody(unfolded);
  if (!body) throw new Error('No VEVENT found.');

  const times = parseIcsEventTimes(ics, defaultZone);
  const uid = parseProp(body, 'UID')?.value || null;

  const alarms = [...body.matchAll(/BEGIN:VALARM([\s\S]*?)END:VALARM/g)].map(m => {
    const blk = m[1];
    return {
      action: parseProp(blk, 'ACTION')?.value || null,
      trigger: parseProp(blk, 'TRIGGER')?.value || null,
      description: parseProp(blk, 'DESCRIPTION')?.value || null
    };
  });

  return {
    uid,
    summary: textProp(body, 'SUMMARY'),
    description: textProp(body, 'DESCRIPTION'),
    location: textProp(body, 'LOCATION'),
    url: textProp(body, 'URL'),
    status: textProp(body, 'STATUS'),
    categories: parseCategories(body),
    organizer: parseOrganizer(body),
    attendees: parseAttendees(body),
    transparency: textProp(body, 'TRANSP'),
    sequence: parseNumberProp(body, 'SEQUENCE'),
    geo: parseGeo(body),
    created: parseDateUTC(body, 'CREATED'),
    lastModified: parseDateUTC(body, 'LAST-MODIFIED'),
    ...parseRecurrence(body),

    start: times.start,
    end: times.end,
    endInclusive: times.endInclusive,
    isAllDay: times.isAllDay,
    startTZID: times.startTZID,
    endTZID: times.endTZID
  };
}
