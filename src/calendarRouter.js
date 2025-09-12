router.post('/parse', async (req, res) => {
  try {
    let { ics, url, start, end, tz, maxIterations } = typeof req.body === 'object' ? req.body : {};
    // If body is raw ICS (text/calendar), req.body is a string
    if (!ics && typeof req.body === 'string') ics = req.body;

    // Fetch ICS when URL provided (convert webcal -> https for iCloud public feeds)
    if (!ics && url) {
      const fetchUrl = String(url).replace(/^webcal:/i, 'https:');
      const resp = await fetch(fetchUrl);
      if (!resp.ok) {
        return res.status(502).json({ error: `Failed to fetch ICS (${resp.status} ${resp.statusText})` });
      }
      ics = await resp.text();
    }

    if (!ics || typeof ics !== 'string') {
      return res.status(400).json({ error: 'Provide `ics` text in the body or a `url` to an ICS feed.' });
    }

    const zone = tz || 'UTC';
    const startLuxon = start
      ? DateTime.fromISO(start, { zone: zone })
      : DateTime.now().setZone(zone).minus({ months: 1 }).startOf('day');
    const endLuxon = end
      ? DateTime.fromISO(end, { zone: zone })
      : startLuxon.plus({ months: 6 });

    if (!startLuxon.isValid || !endLuxon.isValid) {
      return res.status(400).json({ error: 'Invalid `start` or `end` ISO date.' });
    }
    if (endLuxon <= startLuxon) {
      return res.status(400).json({ error: '`end` must be after `start`.' });
    }

    const icx = new IcalExpander({
      ics,
      maxIterations: clampInt(maxIterations ?? 2500, 1, 50000),
      ignoreInvalidDates: true, // skip broken instances instead of throwing
    });

    const windowStart = startLuxon.toJSDate();
    const windowEnd = endLuxon.toJSDate();
    const { events, occurrences } = icx.between(windowStart, windowEnd);

    // Non-recurring VEVENTs overlapping the window
    const singles = (events || []).map(ev =>
      serializeEventLike(ev, /*isRecurring*/ false, ev.startDate, ev.endDate, zone)
    );

    // Each expanded recurring instance within the window
    const recurrences = (occurrences || []).map(occ =>
      serializeEventLike(occ.item, /*isRecurring*/ true, occ.startDate, occ.endDate, zone)
    );

    // Merge & sort by start
    const all = [...singles, ...recurrences].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    res.json({
      range: {
        start: startLuxon.toISO(),
        end: endLuxon.toISO(),
        timezone: zone,
      },
      count: all.length,
      events: all,
    });
  } catch (err) {
    console.error('ICS parse error:', err);
    res.status(500).json({ error: 'Failed to parse ICS', details: String(err?.message || err) });
  }
});

// Helpers

function clampInt(n, min, max) {
  n = Number.parseInt(n, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function toISOFromIcalTime(icalTime, zone) {
  // ical.js Time -> JS Date -> ISO
  // For floating/all-day dates, ical.js sets isDate = true.
  const jsDate = icalTime.toJSDate(); // ical.js supplies this
  // Keep output stable (ISO in UTC) while preserving allDay flag separately
  return DateTime.fromJSDate(jsDate, { zone }).toUTC().toISO();
}

function safeComponentValue(e, prop) {
  try {
    if (e[prop] !== undefined) return e[prop]; // ical.js Event property
    if (e.component && typeof e.component.getFirstPropertyValue === 'function') {
      const val = e.component.getFirstPropertyValue(prop);
      return wrapValue(val);
    }
  } catch {}
  return null;
}

function wrapValue(v) {
  if (v == null) return null;
  // Handle structured values (like ORGANIZER, ATTENDEE) gracefully
  if (typeof v === 'string') return v;
  if (v.toString && typeof v.toString === 'function') return v.toString();
  try { return JSON.parse(JSON.stringify(v)); } catch { return String(v); }
}

function getAttendees(e) {
  try {
    if (!e.component || typeof e.component.getAllProperties !== 'function') return [];
    const props = e.component.getAllProperties('attendee') || [];
    return props.map(p => wrapValue(p.getFirstValue?.() ?? p.getValues?.() ?? p.getValue?.()));
  } catch { return []; }
}

/**
 * Normalize an ical.js Event or Exception into a JSON event instance.
 * @param {*} e            ical.js Event or overridden Event (occurrence.item)
 * @param {boolean} isRecurring
 * @param {*} startDate    ical.js Time
 * @param {*} endDate      ical.js Time
 * @param {string} zone    IANA zone string
 */
function serializeEventLike(e, isRecurring, startDate, endDate, zone) {
  // UID (master id). For exceptions, this stays the master UID.
  const uid =
    e.uid ||
    (e.component && typeof e.component.getFirstPropertyValue === 'function'
      ? e.component.getFirstPropertyValue('uid')
      : null);

  // If this specific instance is an override with a RECURRENCE-ID, surface it
  let recurrenceId = null;
  try {
    if (e.component && typeof e.component.getFirstPropertyValue === 'function') {
      const rid = e.component.getFirstPropertyValue('recurrence-id');
      if (rid) recurrenceId = toISOFromIcalTime(rid, zone);
    }
  } catch {}

  const allDay = !!(startDate?.isDate && endDate?.isDate);

  return {
    id: uid || null,
    recurrenceId,                   // present for modified instances (overrides)
    isRecurring: !!isRecurring,     // this specific JSON item is an expanded instance
    allDay,

    summary: safeComponentValue(e, 'summary'),
    description: safeComponentValue(e, 'description'),
    location: safeComponentValue(e, 'location'),
    organizer: safeComponentValue(e, 'organizer'),
    status: safeComponentValue(e, 'status'),
    url: safeComponentValue(e, 'url'),
    categories: safeComponentValue(e, 'categories'),
    attendees: getAttendees(e),

    start: toISOFromIcalTime(startDate, zone), // ISO (UTC)
    end: toISOFromIcalTime(endDate, zone),     // ISO (UTC)

    // Raw hints (useful if you need to round-trip or inspect)
    // transparency: safeComponentValue(e, 'transp'),
    // sequence: safeComponentValue(e, 'sequence'),
  };
}

module.exports = router;