// src/demo.js
import 'dotenv/config';
import { DateTime } from 'luxon';
import { ICloudCalendar } from './icloudCalendar.js';

async function run() {
  const cal = new ICloudCalendar({
    appleId: process.env.ICLOUD_APPLE_ID,
    appPassword: process.env.ICLOUD_APP_PASSWORD,
    timezone: process.env.ICLOUD_TZ || 'America/New_York',
    calendarDisplayName: process.env.ICLOUD_CALENDAR_NAME || undefined
  });

  console.log('Initializing...');
  await cal.init();

  console.log('\nAvailable calendars:');
  console.table(await cal.listCalendars());

  console.log('\nCreating a test event...');

  const start = DateTime.now().plus({ hours: 2 }).startOf('minute');
  const end = start.plus({ hours: 1 });
  const created = await cal.createEvent({
    summary: 'CalDAV Demo Event',
    description: 'Created via tsdav demo script',
    location: 'Online',
    start,
    end
  });
  console.log('Created:', created);

  console.log('\nListing events (wide window)...');
  const events = await cal.listEvents({
    start: DateTime.now().minus({ months: 1 }),
    end: DateTime.now().plus({ months: 3 })
  });
  console.log('Found events:', events.length);
  console.log(events.map(e => ({ uid: e.uid, href: e.href })).slice(0, 10));

  console.log('\nListing events with details...');
  const detailed = await cal.listEventsDetailed({
    start: DateTime.now().minus({ months: 1 }),
    end: DateTime.now().plus({ months: 3 })
  });
detailed.map(item => {
console.log(item.summary)


})
  
  const sample = detailed[0];
  console.log('Detailed sample:', sample ? {
    uid: sample.uid,
    summary: sample.summary,
    start: sample.start?.toISO(),
    end: sample.end?.toISO(),
    tz: sample.startTZID,
    attendees: sample.attendees?.slice(0, 2) || []
  } : '(no events)');

  console.log('\nUpdating the test event...');
  const updated = await cal.updateEvent({ uid: created.uid }, { location: 'VR Lab' });
  console.log('Updated:', updated);

  console.log('\nDeleting the test event...');
  const deleted = await cal.deleteEvent({ uid: created.uid });
  console.log('Deleted:', deleted);
}

run().catch(err => {
  console.error('Demo error:', err?.response || err);
  process.exit(1);
});
