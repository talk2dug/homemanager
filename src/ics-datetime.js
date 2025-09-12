// src/ics-datetime.js
import { DateTime, Duration } from 'luxon';

/** Unfold folded ICS lines per RFC 5545 (CRLF + space/tab -> join) */
export function unfoldICS(ics) {
  return ics.replace(/\r?\n[ \t]/g, '');
}

/** Simple ICS text unescape per RFC 5545 */
export function unescapeICSText(s) {
  return String(s)
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** Extract calendar-level timezone like X-WR-TIMEZONE */
export function extractCalendarTZ(unfolded) {
  const m = unfolded.match(/^X-WR-TIMEZONE:(.+)$/m);
  return m ? m[1].trim() : null;
}

/** Return first VEVENT body (prefer master: no RECURRENCE-ID) */
export function extractVEventBody(unfolded) {
  const blocks = [...unfolded.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)].map(m => m[1]);
  if (blocks.length === 0) return null;
  return blocks.find(b => !/^\s*RECURRENCE-ID[:;]/m.test(b)) || blocks[0];
}

/** Parse a property like DTSTART/DTEND/DURATION into { params: {}, value } */
export function parseProp(body, name) {
  const re = new RegExp(`^${name}(;[^:]+)?:([^\\r\\n]+)`, 'm');
  const m = body.match(re);
  if (!m) return null;
  const rawParams = (m[1] || '').slice(1); // strip ';'
  const params = {};
  if (rawParams) {
    for (const p of rawParams.split(';')) {
      const [k, v] = p.split('=');
      if (k) params[k.toUpperCase()] = (v || '').replace(/^"|"$/g, '').trim();
    }
  }
  return { params, value: m[2].trim() };
}

/** Parse all properties with a given name -> array of {params, value} */
export function parseProps(body, name) {
  const re = new RegExp(`^${name}(;[^:]+)?:([^\\r\\n]+)`, 'mg');
  const out = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    const rawParams = (m[1] || '').slice(1);
    const params = {};
    if (rawParams) {
      for (const p of rawParams.split(';')) {
        const [k, v] = p.split('=');
        if (k) params[k.toUpperCase()] = (v || '').replace(/^"|"$/g, '').trim();
      }
    }
    out.push({ params, value: m[2].trim() });
  }
  return out;
}

/** Turn an ICS date/time token into a Luxon DateTime + allDay flag */
export function parseIcsDateToken(token, params, fallbackZone = 'UTC') {
  const tzid = params?.TZID || null;
  const zone = tzid || fallbackZone || 'UTC';

  // All-day (VALUE=DATE or bare YYYYMMDD)
  if ((params && params.VALUE === 'DATE') || /^\d{8}$/.test(token)) {
    const dt = DateTime.fromFormat(token, 'yyyyLLdd', { zone }).startOf('day');
    return { dt, isAllDay: true, tzid: tzid || null };
  }

  // UTC form (YYYYMMDDTHHMMSSZ)
  if (/^\d{8}T\d{6}Z$/.test(token)) {
    const dt = DateTime.fromFormat(token, "yyyyLLdd'T'HHmmss'Z'", { zone: 'UTC' }).setZone(zone);
    return { dt, isAllDay: false, tzid: tzid || 'UTC' };
  }

  // Local wall time (YYYYMMDDTHHMMSS)
  if (/^\d{8}T\d{6}$/.test(token)) {
    const dt = DateTime.fromFormat(token, "yyyyLLdd'T'HHmmss", { zone });
    return { dt, isAllDay: false, tzid: tzid || null };
  }

  // Last resort
  const dt = DateTime.fromISO(token, { zone });
  return { dt, isAllDay: false, tzid: tzid || null };
}

/** Parse DTSTART/DTEND (or DURATION) from an ICS VEVENT string. */
export function parseIcsEventTimes(ics, defaultZone = 'UTC') {
  const unfolded = unfoldICS(ics);
  const body = extractVEventBody(unfolded);
  if (!body) throw new Error('No VEVENT found in ICS.');

  const dtstart = parseProp(body, 'DTSTART');
  if (!dtstart) throw new Error('VEVENT has no DTSTART.');

  const startParsed = parseIcsDateToken(dtstart.value, dtstart.params, defaultZone);

  const dtend = parseProp(body, 'DTEND');
  const duration = parseProp(body, 'DURATION');

  let endParsed = null;

  if (dtend) {
    endParsed = parseIcsDateToken(dtend.value, dtend.params, startParsed.tzid || defaultZone);
  } else if (duration) {
    const dur = Duration.fromISO(duration.value);
    endParsed = { dt: startParsed.dt.plus(dur), isAllDay: startParsed.isAllDay, tzid: startParsed.tzid };
  } else if (startParsed.isAllDay) {
    endParsed = { dt: startParsed.dt.plus({ days: 1 }), isAllDay: true, tzid: startParsed.tzid };
  } else {
    endParsed = { dt: startParsed.dt.plus({ hours: 1 }), isAllDay: false, tzid: startParsed.tzid };
  }

  const endExclusive = endParsed.dt;
  const endInclusive = endParsed.isAllDay ? endExclusive.minus({ days: 1 }).endOf('day') : endExclusive;

  return {
    start: startParsed.dt,
    end: endExclusive,
    endInclusive,
    isAllDay: startParsed.isAllDay,
    startTZID: startParsed.tzid || defaultZone,
    endTZID: endParsed.tzid || startParsed.tzid || defaultZone
  };
}
