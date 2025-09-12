// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { DateTime } from 'luxon';
import { ICloudCalendar } from './icloudCalendar.js';
import moment from 'moment'
import chores from '../schemas/chores.js'
import users from '../schemas/users.js'
import IcalExpander from "ical-expander";
import schedule  from 'node-schedule';
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const zone = process.env.ICLOUD_TZ || 'America/New_York';

const cal = new ICloudCalendar({
  appleId: process.env.ICLOUD_APPLE_ID,
  appPassword: process.env.ICLOUD_APP_PASSWORD,
  timezone: zone,
  calendarDisplayName: process.env.ICLOUD_CALENDAR_NAME || undefined
});
let initPromise = null;
async function ensureInit() {
  if (!initPromise) {
    initPromise = cal.init().catch(err => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

const BraydenSchedule = new ICloudCalendar({
  appleId: process.env.ICLOUD_APPLE_ID,
  appPassword: process.env.ICLOUD_APP_PASSWORD,
  timezone: zone,
  calendarDisplayName: "Brayden’s Schedule"
});
let initPromise2 = null;
async function ensureInit2() {
  if (!initPromise2) {
    initPromise2 = BraydenSchedule.init().catch(err => {
      initPromise2 = null;
      throw err;
    });
  }
  return initPromise2;
}


const ToDos = new ICloudCalendar({
  appleId: process.env.ICLOUD_APPLE_ID,
  appPassword: process.env.ICLOUD_APP_PASSWORD,
  timezone: zone,
  calendarDisplayName: "Today ⚠️"
});
let initPromise3 = null;
async function ensureInit3() {
  if (!initPromise2) {
    initPromise3 = ToDos.init().catch(err => {
      initPromise2 = null;
      throw err;
    });
  }
  return initPromise2;
}



function parseMaybeISO(v) {
  if (!v) return null;
  const dt = DateTime.fromISO(String(v));
  if (dt.isValid) return dt;
  const n = Number(v);
  if (!Number.isNaN(n)) {
    const fromMs = DateTime.fromMillis(n);
    if (fromMs.isValid) return fromMs;
  }
  throw new Error(`Invalid date/time: ${v}`);
}
function parseBool(v, def = false) {
  if (v === undefined || v === null) return def;
  const s = String(v).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
}
function pick(o, keys) { const out = {}; for (const k of keys) if (o[k] !== undefined) out[k] = o[k]; return out; }

app.get('/health', (req, res) => res.json({ ok: true, zone, now: DateTime.now().setZone(zone).toISO() }));

app.get('/calendars', async (req, res, next) => {
  try { await ensureInit(); res.json({ calendars: await cal.listCalendars() }); }
  catch (err) { next(err); }
});


app.get('/getchores', async (req, res, next) => {
  let Allchores = await chores.find({})
  console.log(Allchores)
  res.send(Allchores)
});



app.post("/updateChore", function (req, res){
var requested = req.body;
let id = requested["id"];
let set = requested;
  chores.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: set,
    },
    {
      upsert: true,
    },
    {
      new: true,
    } // Return the updated document
  )
    .then((chore) => {
      // console.log("UPDATED")
      // console.log(rabbit)
      res.status(200).end();
    })
    .catch((e) => {
      // console.log(e)
    });


})
app.get('/thirdweeksevents', async (req, res, next) => {
  let currentDate = moment();
  const nextWeek = currentDate.add(14, 'days');
let weekStart = nextWeek.clone().startOf('week');
let weekEnd = nextWeek.clone().endOf('week');
  try {
    await ensureInit();
    const start = parseMaybeISO(weekStart);
    const end   = parseMaybeISO(weekEnd);
    const detailed = parseBool(req.query.detailed, true);
    const overlapMode = (req.query.overlapMode === 'contained') ? 'contained' : 'any';
    const args = { start, end, overlapMode };
    const events = detailed ? await cal.listEventsDetailed(args) : await cal.listEvents(args);
    res.json({ count: events.length, events });
  } catch (err) { next(err); }
});
app.get('/nextweeksevents', async (req, res, next) => {
  let currentDate = moment();
  const nextWeek = currentDate.add(7, 'days');
let weekStart = nextWeek.clone().startOf('week');
let weekEnd = nextWeek.clone().endOf('week');
  try {
    await ensureInit();
    const start = parseMaybeISO(weekStart);
    const end   = parseMaybeISO(weekEnd);
    const detailed = parseBool(req.query.detailed, true);
    const overlapMode = (req.query.overlapMode === 'contained') ? 'contained' : 'any';
    const args = { start, end, overlapMode };
    const events = detailed ? await cal.listEventsDetailed(args) : await cal.listEvents(args);
    res.json({ count: events.length, events });
  } catch (err) { next(err); }
});
app.get('/thisweeksevents', async (req, res, next) => {
  let currentDate = moment();
let weekStart = currentDate.clone().startOf('week');
let weekEnd = currentDate.clone().endOf('week');
  try {
    await ensureInit();
    const start = parseMaybeISO(weekStart);
    const end   = parseMaybeISO(weekEnd);
    const detailed = parseBool(req.query.detailed, true);
    const overlapMode = (req.query.overlapMode === 'contained') ? 'contained' : 'any';
    const args = { start, end, overlapMode };
    const events = detailed ? await cal.listEventsDetailed(args) : await cal.listEvents(args);
    res.json({ count: events.length, events });
  } catch (err) { next(err); }
});
app.get('/Todaysevents', async (req, res, next) => {
  let currentDate = moment();
let weekStart = currentDate.clone().startOf('week');
let weekEnd = currentDate.clone().endOf('week');
  try {
    await ensureInit();
    const start = parseMaybeISO(req.query.start) || DateTime.now().minus({ days: 0 });
    const end   = parseMaybeISO(req.query.end)   || DateTime.now().plus({ days: 0 });
    const detailed = parseBool(req.query.detailed, true);
    const overlapMode = (req.query.overlapMode === 'contained') ? 'contained' : 'any';
    const args = { start, end, overlapMode };
    const events = detailed ? await cal.listEventsDetailed(args) : await cal.listEvents(args);
    res.json({ count: events.length, events });
  } catch (err) { next(err); }
});
app.get('/events', async (req, res, next) => {
  const { start, end } = req.query;
  const rangeStart = new Date(start);
  const rangeEnd = new Date(end);
  try {
    await ensureInit();
    const start = parseMaybeISO(req.query.start) || DateTime.now().minus({ months: 6 });
    const end   = parseMaybeISO(req.query.end)   || DateTime.now().plus({ months: 18 });
    const detailed = parseBool(req.query.detailed, true);
    const overlapMode = (req.query.overlapMode === 'contained') ? 'contained' : 'any';
    const args = { start, end, overlapMode };
    const events = detailed ? await cal.listEventsDetailed(args) : await cal.listEvents(args);
    res.json({ count: events.length, events });
  } 
  catch (err) { next(err); }
});
app.get('/login', async (req, res, next) => {
  const { userName, password } = req.query;


})
app.get('/getUser', async (req, res, next) => {
  users.find().then((items) => {
    res.send(items);
  });



})
app.post("/addChore", function (req, res) {
  let data = req.body
  console.log(data)
  const chore = new chores();

  chore.Title = data.Title;
  chore.Assigned = data.Assigned;
  chore.Frequency = data.Frequency;
  chore.When = data.When;
  chore.NumOfStars = data.NumOfStars;
  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
   chore.save();


res.send(200)


})
app.get('/delChores',async (req,res,next) => {
  const query = {};
const result = await chores.deleteMany(query);
res.send(result)

})
app.get('/addUser', async (req, res, next) => {
  const doc = new users();

  doc.userName = 'Jack';
  doc.password = '12345678';

  //// console.log(doc)
  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  doc.save();
  const doc2 = new users();

  doc2.userName = 'LeeAnn';
  doc2.password = '12345678';

  //// console.log(doc)
  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  doc2.save();
  res.send(doc2)

})
app.get('/todos', async (req, res, next) => {
  const { start, end } = req.query;
  const rangeStart = new Date(start);
  const rangeEnd = new Date(end);
  try {
    await ensureInit3();
    const start = parseMaybeISO(req.query.start) || DateTime.now().minus({ months: 6 });
    const end   = parseMaybeISO(req.query.end)   || DateTime.now().plus({ months: 18 });
    const detailed = parseBool(req.query.detailed, true);
    const overlapMode = (req.query.overlapMode === 'contained') ? 'contained' : 'any';
    const args = { start, end, overlapMode };
    const events = await ToDos.listEventsDetailed(args);
    res.json({ count: events.length, events });
  } 
  catch (err) { next(err); }
});


app.get('/braydensSchedule', async (req, res, next) => {
  const { start, end } = req.query;
  const rangeStart = new Date(start);
  const rangeEnd = new Date(end);
  try {
    await ensureInit2();
    const start = parseMaybeISO(req.query.start) || DateTime.now().minus({ months: 6 });
    const end   = parseMaybeISO(req.query.end)   || DateTime.now().plus({ months: 18 });
    const detailed = parseBool(req.query.detailed, true);
    const overlapMode = (req.query.overlapMode === 'contained') ? 'contained' : 'any';
    const args = { start, end, overlapMode };
    const events = await BraydenSchedule.listEventsDetailed(args);
    res.json({ count: events.length, events });
  } 
  catch (err) { next(err); }
});
app.get('/eventsRecurring', async (req, res, next) => {
  const { start, end } = req.query;
  const rangeStart = new Date(start);
  const rangeEnd = new Date(end);
  try {
    await ensureInit();
    const start = parseMaybeISO(req.query.start) || DateTime.now().minus({ months: 6 });
    const end   = parseMaybeISO(req.query.end)   || DateTime.now().plus({ months: 18 });
    const detailed = parseBool(req.query.detailed, true);
    const overlapMode = (req.query.overlapMode === 'contained') ? 'contained' : 'any';
    const args = { start, end, overlapMode };
    const events = await cal.listEvents(args);
    res.json({ count: events.length, events });
  } 
  catch (err) { next(err); }
});
app.get('/events/:uid', async (req, res, next) => {
  try {
    await ensureInit();
    const uid = req.params.uid;
    const detailed = parseBool(req.query.detailed, false);
    const e = await cal.getEvent({ uid });
    if (!e) return res.status(404).json({ error: 'Not found' });
    if (detailed) {
      const det = (await cal.listEventsDetailed({
        start: DateTime.now().minus({ years: 2 }),
        end: DateTime.now().plus({ years: 2 }),
        overlapMode: 'any'
      })).find(x => x.uid === e.uid);
      return res.json({ event: det || e });
    }
    res.json({ event: e });
  } catch (err) { next(err); }
});
app.post('/events', async (req, res, next) => {
  try {
    await ensureInit();
    const b = req.body || {};
    const created = await cal.createEvent({
      summary: b.summary,
      description: b.description,
      location: b.location,
      start: parseMaybeISO(b.start) || DateTime.now().plus({ hours: 1 }),
      end:   parseMaybeISO(b.end)   || DateTime.now().plus({ hours: 2 }),
      allDay: !!b.allDay,
      attendees: Array.isArray(b.attendees) ? b.attendees : undefined,
      url: b.url
    });
    res.status(201).json({ created });
  } catch (err) { next(err); }
});
app.patch('/events/:uid', async (req, res, next) => {
  try {
    await ensureInit();
    const href = req.query.href;
    const uid = req.params.uid;
    if (!href && !uid) return res.status(400).json({ error: 'Provide :uid path param or ?href=' });
    const b = req.body || {};
    const updates = pick(b, ['summary','description','location','allDay','url','attendees']);
    if (b.start) updates.start = parseMaybeISO(b.start);
    if (b.end)   updates.end   = parseMaybeISO(b.end);
    const updated = await cal.updateEvent(href ? { href } : { uid }, updates);
    res.json({ updated });
  } catch (err) { next(err); }
});
app.delete('/events/:uid', async (req, res, next) => {
  try {
    await ensureInit();
    const href = req.query.href;
    const uid = req.params.uid;
    if (!href && !uid) return res.status(400).json({ error: 'Provide :uid or ?href=' });
    const deleted = await cal.deleteEvent(href ? { href } : { uid });
    res.json({ deleted });
  } catch (err) { next(err); }
});
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const msg = err.message || 'Server error';
  const payload = { error: msg };
  if (err.response) payload.response = err.response;
  console.error('ERROR:', err);
  res.status(status).json(payload);
});



const rule = new schedule.RecurrenceRule();
rule.hour = 19;
rule.minute = 3;

const job = schedule.scheduleJob(rule, function(){
  
  
  
  
  console.log('Today is recognized by Rebecca Black!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express API running on http://localhost:${PORT}`));
