// src/icloudCalendar.js
import { createDAVClient } from 'tsdav';
import ical, { ICalAttendeeStatus } from 'ical-generator';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import { parseIcsEvent } from './ics-parser.js';

function toICalDate(dt, tz) {
  if (DateTime.isDateTime(dt)) return dt.setZone(tz || 'UTC');
  if (dt instanceof Date) return DateTime.fromJSDate(dt, { zone: tz || 'UTC' });
  return DateTime.fromISO(String(dt), { zone: tz || 'UTC' });
}

function extractUID(ics) {
  const m = ics && ics.match(/^\s*UID:(.+)\s*$/m);
  return m ? m[1].trim() : null;
}

function extractETag(obj) {
  return obj?.etag || obj?.props?.getetag || obj?.getetag || null;
}

function ensureCalendarHasURL(calendar) {
  if (!calendar?.url) {
    throw new Error('Resolved calendar has no url. Check your credentials and calendar selection.');
  }
}

async function listCalendars(client) {
  const calendars = await client.fetchCalendars();
  return calendars.map(c => ({
    displayName: c.displayName || '(no name)',
    url: c.url,
    components: c.components,
    color: c.color
  }));
}

/**
 * Robust lister that copes with iCloud quirks.
 * Tries 1) no filter, 2) time-range, 3) expansion within the range.
 */

/**
 * Robust lister that copes with iCloud quirks, then locally filters by window.
 * overlapMode:
 *   - 'any' (default): include events that overlap the window at all
 *   - 'contained': only events fully contained within the window
 */
async function listEventsRobust(client, calendar, opts = {}) {
  ensureCalendarHasURL(calendar);

  const toUTCISO = (dt) => {
    const z = DateTime.isDateTime(dt)
      ? dt
      : (dt instanceof Date
          ? DateTime.fromJSDate(dt)
          : DateTime.fromISO(String(dt)));
    return z.toUTC().toISO({ suppressMilliseconds: true });
  };

  const startISO = toUTCISO(opts.start || DateTime.now().minus({ months: 6 }));
  const endISO   = toUTCISO(opts.end   || DateTime.now().plus({ months: 18 }));
  const windowStartUTC = DateTime.fromISO(startISO, { zone: 'UTC' });
  const windowEndUTC   = DateTime.fromISO(endISO,   { zone: 'UTC' });
  const overlapMode = opts.overlapMode || 'any';

  const normalize = (arr) => (arr || []).map(obj => {
    const ics  = obj?.data || obj?.props?.['calendar-data'] || obj?.['calendar-data'] || '';
    const href = obj?.url || obj?.href;
    const etag = obj?.etag || obj?.props?.getetag || obj?.getetag || null;
    return { href, etag, ics };
  }).filter(e => e.href);

  const filterByWindow = (items) => {
    return items.filter(it => {
      const details = parseIcsEvent(it.ics, 'UTC'); // parse in UTC for comparisons
      const evStartUTC = details.start.toUTC();
      const evEndUTC   = details.end.toUTC(); // all-day end is exclusive
      if (overlapMode === 'contained') {
        return evStartUTC >= windowStartUTC && evEndUTC <= windowEndUTC;
      }
      // any overlap: [evStart, evEnd) intersects [winStart, winEnd)
      return evEndUTC > windowStartUTC && evStartUTC < windowEndUTC;
    }).map(it => {
      const parsed = parseIcsEvent(it.ics, 'UTC');
      return {
        uid: parsed.uid,
        href: it.href,
        etag: it.etag,
        ics: it.ics
      };
    });
  };

  // Strategy 1: no filter
  let items = await client.fetchCalendarObjects({
    calendar,
    propNames: ['getetag', 'calendar-data']
  });
  let events = filterByWindow(normalize(items));
  if (events.length) return events;

  // Strategy 2: server time-range filter
  items = await client.fetchCalendarObjects({
    calendar,
    propNames: ['getetag', 'calendar-data'],
    filters: [
      { type: 'comp-filter', attrs: { name: 'VCALENDAR' }, children: [
        { type: 'comp-filter', attrs: { name: 'VEVENT' }, children: [
          { type: 'time-range', attrs: { start: startISO, end: endISO } }
        ]}
      ]}
    ]
  });
  events = filterByWindow(normalize(items));
  if (events.length) return events;

  // Strategy 3: time-range + expand recurrences
  items = await client.fetchCalendarObjects({
    calendar,
    propNames: ['getetag', 'calendar-data'],
    filters: [
      { type: 'comp-filter', attrs: { name: 'VCALENDAR' }, children: [
        { type: 'comp-filter', attrs: { name: 'VEVENT' }, children: [
          { type: 'time-range', attrs: { start: startISO, end: endISO } }
        ]}
      ]}
    ],
    expand: { start: startISO, end: endISO }
  });
  events = filterByWindow(normalize(items));
  return events;

  events = normalize(items);
  if (events.length) return events;

  // Strategy 3: time-range + expand recurrences
  items = await client.fetchCalendarObjects({
    calendar,
    propNames: ['getetag', 'calendar-data'],
    filters: [
      {
        type: 'comp-filter',
        attrs: { name: 'VCALENDAR' },
        children: [
          {
            type: 'comp-filter',
            attrs: { name: 'VEVENT' },
            children: [
              { type: 'time-range', attrs: { start: startISO, end: endISO } }
            ]
          }
        ]
      }
    ],
    expand: { start: startISO, end: endISO }
  });
  events = normalize(items);
  return events;
}

export class ICloudCalendar {
  constructor(opts) {
    this.username = opts.appleId;
    this.password = opts.appPassword;
    this.serverUrl = opts.serverUrl || 'https://caldav.icloud.com';
    this.timezone = opts.timezone || 'America/New_York';
    this.calendarDisplayName = opts.calendarDisplayName || null;

    this.client = null;
    this.calendar = null;
  }

  async init() {
    this.client = await createDAVClient({
      serverUrl: this.serverUrl,
      credentials: { username: this.username, password: this.password },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
      fetchOptions: { headers: { accept: undefined } } // iCloud quirk
    });

    const calendars = await this.client.fetchCalendars();
    if (!calendars?.length) {
      throw new Error('No calendars returned from iCloud. Check credentials/app-password.');
    }

    if (this.calendarDisplayName) {
      this.calendar = calendars.find(
        c => (c?.displayName || '').trim() === this.calendarDisplayName.trim()
      ) || null;
      if (!this.calendar) {
        const names = calendars.map(c => c.displayName).join(', ');
        throw new Error(`Calendar "${this.calendarDisplayName}" not found. Available: ${names}`);
      }
    } else {
      this.calendar =
        calendars.find(c => (c.components || []).includes('VEVENT')) ||
        calendars[0];
    }

    ensureCalendarHasURL(this.calendar);
  }

  async listCalendars() {
    if (!this.client) await this.init();
    return listCalendars(this.client);
  }

  async listEvents({ start, end, overlapMode } = {}) {
    if (!this.client || !this.calendar) await this.init();
    return listEventsRobust(this.client, this.calendar, { start, end, overlapMode });
  }

  /** Like listEvents but with rich parsed details */
  async listEventsDetailed({ start, end } = {}) {
    const items = await this.listEvents({ start, end });
    return items.map(it => ({
      href: it.href,
      etag: it.etag,
      ...parseIcsEvent(it.ics, this.timezone),
      ics: it.ics
    }));
  }

  async getEvent({ href, uid, searchStart, searchEnd }) {
    if (!this.client || !this.calendar) await this.init();

    if (href) {
      const obj = await this.client.getCalendarObject({ url: href });
      const ics = obj?.data || obj?.calendarData || '';
      return { uid: extractUID(ics), href, etag: extractETag(obj), ics };
    }

    if (!uid) throw new Error('Provide either href or uid.');

    const start = searchStart || DateTime.now().minus({ years: 1 });
    const end = searchEnd || DateTime.now().plus({ years: 2 });
    const events = await this.listEvents({ start, end });
    const match = events.find(e => e.uid === uid);
    if (!match) throw new Error(`Event with UID ${uid} not found in the search window.`);
    return match;
  }

  async createEvent(data) {
    if (!this.client || !this.calendar) await this.init();

    const uid = uuidv4();
    const cal = ical({ name: this.calendar.displayName || 'iCloud' });
    const start = toICalDate(data.start, this.timezone);
    const end = toICalDate(data.end, this.timezone);

    const ev = cal.createEvent({
      id: uid,
      start: data.allDay ? start.startOf('day') : start,
      end: data.allDay ? end.startOf('day') : end,
      summary: data.summary,
      description: data.description || '',
      location: data.location || '',
      url: data.url || undefined,
      allDay: !!data.allDay,
      timezone: this.timezone,
      stamp: DateTime.now().setZone(this.timezone),
    });

    if (Array.isArray(data.attendees) && data.attendees.length) {
      data.attendees.forEach(a => {
        ev.createAttendee({
          name: a.name || a.email,
          email: a.email,
          rsvp: a.rsvp ?? false,
          role: a.role || 'REQ-PARTICIPANT',
          status: ICalAttendeeStatus.NEEDSACTION,
        });
      });
    }

    const ics = cal.toString();
    const filename = `${uid}.ics`;

    const res = await this.client.createCalendarObject({
      calendar: this.calendar,
      filename,
      iCalString: ics,
      data: ics
    });

    return {
      uid,
      href: res?.href || res?.url || `${this.calendar.url}${filename}`,
      etag: extractETag(res),
    };
  }

  async updateEvent(refs, updates) {
    const existing = await this.getEvent(refs);
    const currentICS = existing.ics || '';

    const cal = ical({ name: this.calendar.displayName || 'iCloud' });

    const pull = (re) => (currentICS.match(re) || [])[1];
    const currentSummary = pull(/^\s*SUMMARY:(.+)\s*$/m) || 'Event';
    const currentLocation = pull(/^\s*LOCATION:(.+)\s*$/m) || '';
    const currentDescription = pull(/^\s*DESCRIPTION:(.+)\s*$/m) || '';
    const dtStartRaw = pull(/^\s*DTSTART(?:;[^:]+)?:([^\r\n]+)\s*$/m);
    const dtEndRaw = pull(/^\s*DTEND(?:;[^:]+)?:([^\r\n]+)\s*$/m);

    const currentAllDay = dtStartRaw ? /^\d{8}$/.test(dtStartRaw) : false;

    const parseRaw = (raw) => {
      if (!raw) return null;
      if (/^\d{8}$/.test(raw)) return DateTime.fromFormat(raw, 'yyyyLLdd', { zone: this.timezone });
      if (/^\d{8}T\d{6}Z$/.test(raw)) return DateTime.fromFormat(raw, "yyyyLLdd'T'HHmmss'Z'", { zone: 'UTC' }).setZone(this.timezone);
      return DateTime.fromISO(raw, { zone: this.timezone });
    };

    const start = updates.start
      ? toICalDate(updates.start, this.timezone)
      : (parseRaw(dtStartRaw) || DateTime.now().setZone(this.timezone));

    const end = updates.end
      ? toICalDate(updates.end, this.timezone)
      : (parseRaw(dtEndRaw) || start.plus({ hours: 1 }));

    const ev = cal.createEvent({
      id: existing.uid,
      start: (updates.allDay ?? currentAllDay) ? start.startOf('day') : start,
      end: (updates.allDay ?? currentAllDay) ? end.startOf('day') : end,
      allDay: updates.allDay ?? currentAllDay,
      summary: updates.summary ?? currentSummary,
      description: updates.description ?? currentDescription,
      location: updates.location ?? currentLocation,
      url: updates.url || undefined,
      timezone: this.timezone,
      stamp: DateTime.now().setZone(this.timezone),
    });

    if (Array.isArray(updates.attendees)) {
      updates.attendees.forEach(a => {
        ev.createAttendee({
          name: a.name || a.email,
          email: a.email,
          rsvp: a.rsvp ?? false,
          role: a.role || 'REQ-PARTICIPANT',
          status: ICalAttendeeStatus.NEEDSACTION,
        });
      });
    }

    const newIcs = cal.toString();
    const putRes = await this.client.updateCalendarObject({
      calendarObject: {
        url: existing.href,
        data: newIcs,
        etag: existing.etag || undefined,
      }
    });

    return { uid: existing.uid, href: existing.href, etag: extractETag(putRes) };
  }

  async deleteEvent(refs) {
    const existing = await this.getEvent(refs);
    await this.client.deleteCalendarObject({
      calendarObject: {
        url: existing.href,
        etag: existing.etag || undefined,
      }
    });
    return { uid: existing.uid, href: existing.href, deleted: true };
  }
}
