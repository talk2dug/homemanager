// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { DateTime } from 'luxon';
import { ICloudCalendar } from './icloudCalendar.js';
import moment from 'moment'
import chores from '../schemas/chores.js'
import dailychores from '../schemas/dailyChores.js'
import weeklychores from '../schemas/weeklyChores.js'
import payout from '../schemas/PayOut.js'
import users from '../schemas/users.js'
import todos from "../schemas/toDos.js"
import IcalExpander from "ical-expander";
import schedule  from 'node-schedule';
import axios from 'axios'
import fileUpload from 'express-fileupload';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import rabbitsRouter from './rabbits/database.cjs';
import rabbitSocketHandlers from './rabbits/socketHandlers.cjs';
const { registerRabbitSocketHandlers } = rabbitSocketHandlers;
const app = express();
const rabbitsStorageRoot = process.env.RABBITS_STORAGE_ROOT || path.join(process.cwd(), 'storage', 'rabbits');
app.use(cors());
app.use(fileUpload());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/rabbits/uploads', express.static(rabbitsStorageRoot));
app.use('/rabbits', rabbitsRouter);
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
app.get('/getDOneChores', async (req, res, next) => {
  let weekNum = moment().add(4,'day').week()
  //console.log(weekNum)
  let NeedsParrentApproval = []
  let AllDonechores = await weeklychores.find({WeekNumber:weekNum })
  try {
    
  
NeedsParrentApproval.push({parrentID:AllDonechores[0].id})
  AllDonechores[0].Chores.Monday.map((mon)=>{
    if(mon.Completed){
      if(mon.ParrentConfirmed === false){
        NeedsParrentApproval.push(mon)
        //console.log(mon)
      }
    }
  })
    AllDonechores[0].Chores.Tuesday.map((tue)=>{
    if(tue.Completed){
      if(tue.ParrentConfirmed === false){
         NeedsParrentApproval.push(tue)
         //console.log(tue)
      }
    }
  })
  AllDonechores[0].Chores.Wednesday.map((wed)=>{
    if(wed.Completed){
      if(wed.ParrentConfirmed === false){
        wed.ParrentID = AllDonechores[0].id
         NeedsParrentApproval.push(wed)
      }
    }
  })
    AllDonechores[0].Chores.Thursday.map((thu)=>{
    if(thu.Completed){
      if(thu.ParrentConfirmed === false){
        thu.ParrentID = AllDonechores[0].id
         NeedsParrentApproval.push(thu)
      }
    }
  })
    AllDonechores[0].Chores.Friday.map((fri)=>{
    if(fri.Completed){
      if(fri.ParrentConfirmed === false){
        fri.ParrentID = AllDonechores[0].id
         NeedsParrentApproval.push(fri)
      }
    }
  })
  AllDonechores[0].Chores.Saturday.map((sat)=>{
    if(sat.Completed){
      if(sat.ParrentConfirmed === false){
        sat.ParrentID = AllDonechores[0].id
         NeedsParrentApproval.push(sat)
      }
    }
  })
    AllDonechores[0].Chores.Sunday.map((sun)=>{
    if(sun.Completed){
      if(sun.ParrentConfirmed === false){
        sun.ParrentID = AllDonechores[0].id
         NeedsParrentApproval.push(sun)
      }
    }
  })
let sendChores = {parrentID:AllDonechores[0].id , Chores:NeedsParrentApproval}
  ////console.log(NeedsParrentApproval)
 res.send(sendChores)
  } catch (error) {
    let sendChores = {parrentID:0, Chores:[{}]}
     res.send(sendChores)
  }
 
});
app.get('/getStars', async (req, res, next) => {

  let numOfStars = 0
  let completedChoreStars = 0
  let weekNum = moment().add(4,'day').week()


  let AllDonechores = await weeklychores.find({WeekNumber:weekNum })
  try {
    
  
  let Monday = AllDonechores[0].Chores.Monday
  let Tuesday = AllDonechores[0].Chores.Tuesday
  let Wednesday = AllDonechores[0].Chores.Wednesday
  let Thursday = AllDonechores[0].Chores.Thursday
  let Friday = AllDonechores[0].Chores.Friday
  let Saturday = AllDonechores[0].Chores.Saturday
  let Sunday = AllDonechores[0].Chores.Sunday
    
  Monday.map((chore)=>{
    numOfStars = numOfStars + parseInt(chore.NumOfStars)
    if(chore.ParrentConfirmed){
        completedChoreStars = completedChoreStars + parseInt(chore.NumOfStars)
    }

  })
  Tuesday.map((chore)=>{
    numOfStars = numOfStars + parseInt(chore.NumOfStars)
    if(chore.ParrentConfirmed){
        completedChoreStars = completedChoreStars + parseInt(chore.NumOfStars)
    }

  })
  Wednesday.map((chore)=>{
    numOfStars = numOfStars + parseInt(chore.NumOfStars)
    if(chore.ParrentConfirmed){
        completedChoreStars = completedChoreStars + parseInt(chore.NumOfStars)
    }

  })
  Thursday.map((chore)=>{
    numOfStars = numOfStars + parseInt(chore.NumOfStars)
    if(chore.ParrentConfirmed){
        completedChoreStars = completedChoreStars + parseInt(chore.NumOfStars)
    }

  })    
  Friday.map((chore)=>{
    numOfStars = numOfStars + parseInt(chore.NumOfStars)
    if(chore.ParrentConfirmed){
        completedChoreStars = completedChoreStars + parseInt(chore.NumOfStars)
    }

  })  
  Saturday.map((chore)=>{
    numOfStars = numOfStars + parseInt(chore.NumOfStars)
    if(chore.ParrentConfirmed){
        completedChoreStars = completedChoreStars + parseInt(chore.NumOfStars)
    }

  })  
  Sunday.map((chore)=>{

    numOfStars = numOfStars + parseInt(chore.NumOfStars)
    if(chore.ParrentConfirmed){
        completedChoreStars = completedChoreStars + parseInt(chore.NumOfStars)
    }

  })


  let percentage = completedChoreStars/numOfStars
  let remamingStars = numOfStars - completedChoreStars
    let totals = {remamingStars:remamingStars,numOfStars:numOfStars,completedChoreStars:completedChoreStars, percentage:percentage*100}
   res.send(totals)  
  } catch (error) {
    let totals = {remamingStars:0,numOfStars:0,completedChoreStars:0, percentage:0*100}
   res.send(totals) 
  }
    
   
 


})
app.get('/getPayOut', async(req, res) =>{
  let payOut = await payout.find({})
  res.send(payOut)


})
app.get('/delAllPayOut', async(req, res) =>{
  const query = {};
const result = await payout.deleteMany(query);
res.send(result)



})
app.get('/getchores', async (req, res, next) => {
  let Allchores = await chores.find({})
  res.send(Allchores)
});
app.get('/getDailyChores', async (req, res, next) => {
  let Allchores = await dailychores.find({})
  res.send(Allchores)
});
app.post("/setParrentalChoreDone", async function (req, res){
  var requested = req.body;
  let day = requested.day
  let parentId = requested.parentId
  let childId = requested.childId

  switch (day) {
    case "Mon":
      const chore = await weeklychores.findById(parentId);
      if (chore) {
      const chores = chore.Chores; // Replace 'addressId'
      if (chores) {
        const Monday = chores.Monday.id(childId); // Replace 'contactId'
        if (Monday) {
          Monday.ParrentConfirmed = true; // Update the phone number
          await chore.save();
          res.send(200)
        } else {
          res.send(500)
        }
        } else {
        res.send(500)
        }
        } else {
          res.send(500)
        }
     
    
      break;
    case "Tue":
      const Tuechore = await weeklychores.findById(parentId);
      if (Tuechore) {
      const chores = Tuechore.Chores; // Replace 'addressId'
      if (chores) {
        const Tuesday = chores.Tuesday.id(childId); // Replace 'contactId'
        if (Tuesday) {
          Tuesday.ParrentConfirmed = true; // Update the phone number
          await Tuechore.save();
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;    
      case "Wed":
      const Wedchore = await weeklychores.findById(parentId);
      if (Wedchore) {
      const chores = Wedchore.Chores; // Replace 'addressId'
      if (chores) {
        const Wednesday = chores.Wednesday.id(childId); // Replace 'contactId'
        if (Wednesday) {
          Wednesday.ParrentConfirmed = true; // Update the phone number
          await Wedchore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;      
      case "Thu":
      const Thuchore = await weeklychores.findById(parentId);
      if (Thuchore) {
      const chores = Thuchore.Chores; // Replace 'addressId'
      if (chores) {
        const Thursday = chores.Thursday.id(childId); // Replace 'contactId'
        if (Thursday) {
          Thursday.ParrentConfirmed = true; // Update the phone number
          await Thuchore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;
      case "Fri":
      const Frichore = await weeklychores.findById(parentId);
      if (Frichore) {
      const chores = Frichore.Chores; // Replace 'addressId'
      if (chores) {
        const Friday = chores.Friday.id(childId); // Replace 'contactId'
        if (Friday) {
          Friday.ParrentConfirmed = true; // Update the phone number
          await Frichore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;
       case "Sat":
      const Satchore = await weeklychores.findById(parentId);
      if (Satchore) {
      const chores = Satchore.Chores; // Replace 'addressId'
      if (chores) {
        const Saturday = chores.Saturday.id(childId); // Replace 'contactId'
        if (Saturday) {
          Saturday.ParrentConfirmed = true; // Update the phone number
          await Satchore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;
      case "Sun":
      const Sunchore = await weeklychores.findById(parentId);
      if (Sunchore) {
      const chores = Sunchore.Chores; // Replace 'addressId'
      if (chores) {
        const Sunday = chores.Sunday.id(childId); // Replace 'contactId'
        if (Sunday) {
          Sunday.ParrentConfirmed = true; // Update the phone number
          await Sunchore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;
      default:
      break;
  }

})
app.post("/setChoreDone", async function (req, res){
  var requested = req.body;
  let day = requested.day
  let parentId = requested.parentId
  let childId = requested.childId
  console.log(requested)
  switch (day) {
    case "Mon":
      const chore = await weeklychores.findById(parentId);
      if (chore) {
      const chores = chore.Chores; // Replace 'addressId'
      if (chores) {
        const Monday = chores.Monday.id(childId); // Replace 'contactId'
        if (Monday) {
          Monday.Completed = true; // Update the phone number
          Monday.CompletedDate = new Date()
          await chore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
     
    
      break;
    case "Tue":
      const Tuechore = await weeklychores.findById(parentId);
      if (Tuechore) {
      const chores = Tuechore.Chores; // Replace 'addressId'
      if (chores) {
        const Tuesday = chores.Tuesday.id(childId); // Replace 'contactId'
        if (Tuesday) {
          Tuesday.Completed = true; // Update the phone number
          Tuesday.CompletedDate = new Date()
          await Tuechore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;    
      case "Wed":
      const Wedchore = await weeklychores.findById(parentId);
      if (Wedchore) {
      const chores = Wedchore.Chores; // Replace 'addressId'
      if (chores) {
        const Wednesday = chores.Wednesday.id(childId); // Replace 'contactId'
        if (Wednesday) {
          Wednesday.Completed = true; // Update the phone number
          Wednesday.CompletedDate = new Date()
          await Wedchore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;      
      case "Thu":
      const Thuchore = await weeklychores.findById(parentId);
      if (Thuchore) {
      const chores = Thuchore.Chores; // Replace 'addressId'
      if (chores) {
        const Thursday = chores.Thursday.id(childId); // Replace 'contactId'
        if (Thursday) {
          Thursday.Completed = true; // Update the phone number
          Thursday.CompletedDate = new Date()
          await Thuchore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;
      case "Fri":
      const Frichore = await weeklychores.findById(parentId);
      if (Frichore) {
      const chores = Frichore.Chores; // Replace 'addressId'
      if (chores) {
        const Friday = chores.Friday.id(childId); // Replace 'contactId'
        if (Friday) {
          Friday.Completed = true; // Update the phone number
          Friday.CompletedDate = new Date()
          await Frichore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;
       case "Sat":
      const Satchore = await weeklychores.findById(parentId);
      if (Satchore) {
      const chores = Satchore.Chores; // Replace 'addressId'
      if (chores) {
        const Saturday = chores.Saturday.id(childId); // Replace 'contactId'
        if (Saturday) {
          Saturday.Completed = true; // Update the phone number
          Saturday.CompletedDate = new Date()
          await Satchore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;
      case "Sun":
      const Sunchore = await weeklychores.findById(parentId);
      if (Sunchore) {
      const chores = Sunchore.Chores; // Replace 'addressId'
      if (chores) {
        const Sunday = chores.Sunday.id(childId); // Replace 'contactId'
        if (Sunday) {
          Sunday.Completed = true; // Update the phone number
          Sunday.CompletedDate = new Date()
          await Sunchore.save();
          //console.log('Grandchild document updated successfully.');
          res.send(200)
        } else {
          //console.log('Chore not found.');
          res.send(500)
        }
        } else {
        //console.log('Address not found.');
        res.send(500)
        }
        } else {
          //console.log('User not found.');
          res.send(500)
        }
      break;
      default:
      break;
  }
})
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
      res.status(200).end();
    })
    .catch((e) => {
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
app.get('/Tomorrowsevents', async (req, res, next) => {
  let currentDate = moment().add(1,"day");
let weekStart = currentDate.clone().startOf('week');
let weekEnd = currentDate.clone().endOf('week');
  try {
    await ensureInit();
    const start = parseMaybeISO(req.query.start) || DateTime.now().plus({ days: 1 });
    const end   = parseMaybeISO(req.query.end)   || DateTime.now().plus({ days: 1 });
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
app.post("/addToDo", function (req, res) {
  let data = req.body
  const todo = new todos();
  todo.Title= data.Title
  todo.Assigned= data.Assigned
  todo.Priority= data.Priority
  todo.Description= data.Description

  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
   todo.save();


res.send(200)


})
app.get('/gettodos', async (req, res, next) => {
  let AllToDos = await todos.find({})
  res.send(AllToDos)
});
app.post("/updateToDo", function (req, res){
  var requested = req.body;
console.log(requested)

let id = requested["id"];
let set = requested;
  todos.findOneAndUpdate(
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
      res.status(200).end();
    })
    .catch((e) => {
    });


})
app.get("/createWeeklyChores", async (req,res,next) =>{
  let WeeklyItems = await chores.find({})
  console.log(WeeklyItems)
  let possibleWeeklyStars = 0;
  let weeklyChores = {
    Monday:[],
    Tuesday:[],
    Wednesday:[],
    Thursday:[],
    Friday:[],
    Saturday:[],
    Sunday:[]
  }
  function getWeekDay(day){
    switch (day) {
      case "Sun":
        return 0
        break;
      case "Mon":
        return 1
        break;
      case "Tue":
        return 2
        break;
      case "Wed":
        return 3
        break;
      case "Thu":
        return 4
        break;
      case "Fri":
        return 5
        break;          
        case "Sat":
        return 6
        break;    
        
        default:
        break;
    }
  } 

  WeeklyItems.map((item)=>{
    console.log(item)
    if(item.Active){
      let freqSPlit = item.Frequency
      freqSPlit = freqSPlit.split(",") 
      freqSPlit.map((dayOfWeek)=>{
        if(dayOfWeek!==''){
          let currentDay = moment().day()
          let nextweek = moment().add(7,"day")
          let dayNum = getWeekDay(dayOfWeek)
          console.log(dayOfWeek)
          switch (dayOfWeek) {
            case "Mon":
              possibleWeeklyStars = possibleWeeklyStars + parseInt(item.NumOfStars)
              weeklyChores['Monday'].push({
                Title: item.Title,
                TimeOfDay: item.When,
                When: moment(nextweek).subtract(currentDay - dayNum, "day").format("MM/DD/YYYY"),
                DOW: dayOfWeek,
                NumOfStars: item.NumOfStars,
                OriginalChoreID: item.id,
                CompletedDate: item.CompletedDate,
                Completed: item.Completed,
                NotCompleted: item.NotCompleted,
                ParrentConfirmed: item.ParrentConfirmed              })
              break;
            case "Tue":
               possibleWeeklyStars = possibleWeeklyStars + parseInt(item.NumOfStars)
              weeklyChores.Tuesday.push({
                Title: item.Title,
                TimeOfDay: item.When,
                When: moment(nextweek).subtract(currentDay - dayNum, "day").format("MM/DD/YYYY"),
                DOW: dayOfWeek,
                NumOfStars: item.NumOfStars,
                OriginalChoreID: item.id,
                CompletedDate: item.CompletedDate,
                Completed: item.Completed,
                NotCompleted: item.NotCompleted,
                ParrentConfirmed: item.ParrentConfirmed
              })
              break;
            case "Wed":
               possibleWeeklyStars = possibleWeeklyStars + parseInt(item.NumOfStars)
              weeklyChores.Wednesday.push({
                Title: item.Title,
                TimeOfDay: item.When,
                When: moment(nextweek).subtract(currentDay - dayNum, "day").format("MM/DD/YYYY"),
                DOW: dayOfWeek,
                NumOfStars: item.NumOfStars,
                OriginalChoreID: item.id,
                CompletedDate: item.CompletedDate,
                Completed: item.Completed,
                NotCompleted: item.NotCompleted,
                ParrentConfirmed: item.ParrentConfirmed              })
              break;              
            case "Thu":
               possibleWeeklyStars = possibleWeeklyStars + parseInt(item.NumOfStars)
              weeklyChores.Thursday.push({
                Title: item.Title,
                TimeOfDay: item.When,
                When: moment(nextweek).subtract(currentDay - dayNum, "day").format("MM/DD/YYYY"),
                DOW: dayOfWeek,
                NumOfStars: item.NumOfStars,
                OriginalChoreID: item.id,
                CompletedDate: item.CompletedDate,
                Completed: item.Completed,
                NotCompleted: item.NotCompleted,
                ParrentConfirmed: item.ParrentConfirmed              })
              break;              
            case "Fri":
               possibleWeeklyStars = possibleWeeklyStars + parseInt(item.NumOfStars)
              weeklyChores.Friday.push({
                Title: item.Title,
                TimeOfDay: item.When,
                When: moment(nextweek).subtract(currentDay - dayNum, "day").format("MM/DD/YYYY"),
                DOW: dayOfWeek,
                NumOfStars: item.NumOfStars,
                OriginalChoreID: item.id,
                CompletedDate: item.CompletedDate,
                Completed: item.Completed,
                NotCompleted: item.NotCompleted,
                ParrentConfirmed: item.ParrentConfirmed              
              })
              break;              
            case "Sat":
               possibleWeeklyStars = possibleWeeklyStars + parseInt(item.NumOfStars)
              weeklyChores.Saturday.push({
                Title: item.Title,
                When: moment(nextweek).subtract(currentDay - dayNum, "day").format("MM/DD/YYYY"),
                DOW: dayOfWeek,
                NumOfStars: item.NumOfStars,
                OriginalChoreID: item.id,
                CompletedDate: item.CompletedDate,
                Completed: item.Completed,
                NotCompleted: item.NotCompleted,
                ParrentConfirmed: item.ParrentConfirmed              
              })
              break;              
            case "Sun":
               possibleWeeklyStars = possibleWeeklyStars + parseInt(item.NumOfStars)
                weeklyChores.Sunday.push({
                Title: item.Title,
                When: moment(nextweek).subtract(currentDay - dayNum, "day").format("MM/DD/YYYY"),
                DOW: dayOfWeek,
                NumOfStars: item.NumOfStars,
                OriginalChoreID: item.id,
                CompletedDate: item.CompletedDate,
                Completed: item.Completed,
                NotCompleted: item.NotCompleted,
                ParrentConfirmed: item.ParrentConfirmed

              })
              break;              
              default:
              break;
          }
        }
      })
    }
  })


    const weekly = await weeklychores.findOneAndUpdate(
      { WeekNumber: moment().add(5,'day').week() }, // Filter to find the document
      { $set:{Assigned:"Brayden", Chores: {'Monday':weeklyChores.Monday,'Tuesday':weeklyChores.Tuesday,'Wednesday':weeklyChores.Wednesday,'Thursday':weeklyChores.Thursday,'Friday':weeklyChores.Friday,
      'Saturday':weeklyChores.Saturday,'Sunday':weeklyChores.Sunday
      }
     }
      }, 
      { upsert: true, new: true, runValidators: true } // Options: upsert, return new doc, run schema validators
    );


  res.send(weekly);
})
app.get('/weeklyChoreItems',async (req,res,next) => {
  weeklychores.find().then((items) => {
    res.send(items);
  });


})
app.get('/delWeeklyChores',async (req,res,next) => {
  const query = {};
const result = await weeklychores.deleteMany(query);
res.send(result)

})
app.get('/delChores',async (req,res,next) => {
  const query = {};
const result = await chores.deleteMany(query);
res.send(result)

})
app.get('/delDailyChores',async (req,res,next) => {
  const query = {};
const result = await dailychores.deleteMany(query);
res.send(result)

})
app.get('/addUser', async (req, res, next) => {
  const doc = new users();

  doc.userName = 'Jack';
  doc.password = '12345678';


  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  doc.save();
  const doc2 = new users();

  doc2.userName = 'LeeAnn';
  doc2.password = '12345678';


  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  doc2.save();
  res.send(doc2)

})
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
app.get('/createWeeklyPayOut', async (req,res,next)=> {
 const StarsTotals = await fetch('http://127.0.0.1:3001/getStars');
    const StarsPercentages = await StarsTotals.json();
    let weekNumber = moment().add(3,'day').week()
    let AllNotDonechores = await weeklychores.find({WeekNumber:weekNumber })
    let Monday = AllNotDonechores[0].Chores.Monday
    let Tuesday = AllNotDonechores[0].Chores.Tuesday
    let Wednesday = AllNotDonechores[0].Chores.Wednesday
    let Thursday = AllNotDonechores[0].Chores.Thursday
    let Friday = AllNotDonechores[0].Chores.Friday  
    let Saturday = AllNotDonechores[0].Chores.Saturday
    let Sunday = AllNotDonechores[0].Chores.Sunday

    let CHoresNotCompleted = []
    Monday.map((chore)=>{
      if(!chore.ParrentConfirmed){
          CHoresNotCompleted.push(chore)
      }


    })
    Tuesday.map((chore)=>{
    if(!chore.ParrentConfirmed){
          CHoresNotCompleted.push(chore)
      }

    })
    Wednesday.map((chore)=>{
      if(!chore.ParrentConfirmed){
          CHoresNotCompleted.push(chore)
      }


    })
    Thursday.map((chore)=>{
    if(!chore.ParrentConfirmed){
          CHoresNotCompleted.push(chore)
      }


    })    
    Friday.map((chore)=>{
      if(!chore.ParrentConfirmed){
          CHoresNotCompleted.push(chore)
      }
 
    })  
    Saturday.map((chore)=>{
      if(!chore.ParrentConfirmed){
          CHoresNotCompleted.push(chore)
      }


    })  
    Sunday.map((chore)=>{
      if(!chore.ParrentConfirmed){
          CHoresNotCompleted.push(chore)
      }
     

    })
  
payout.findOne({Person:"Brayden"})
.then(doc => {
  let Currency = 0;
  console.log(doc)
  if(StarsPercentages.percentage>89 && StarsPercentages.percentage<99){
    Currency = 5
  }
  else if(StarsPercentages.percentage === 100){
    Currency = 20
  }
  else{
    Currency = 0
  } 
  if(doc === null){
    const payOut = new payout();
    payOut.Person = "Brayden"
    console.log(StarsTotals)
    payOut.CurrentMoney = Currency
    payOut.weekOf = moment().add(1,"day").week()
    payOut.numOfStars = parseInt(StarsPercentages.numOfStars)
    payOut.PercentCompleted = parseInt(StarsPercentages.percentage)
    payOut.ChoresNotDOne = CHoresNotCompleted
    payOut.save()
    console.log(payOut);
  }
  res.send("Done")
  })
  .catch(err => {
    console.error(err);
  });


})
app.get('/clearShoppingList', async (req,res,next)=> {
    const HA_URL = 'http://192.168.0.110:8123'; // Replace with your HA URL
  const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiOWFhYzE5ZjQwYmQ0NDJhYTE5ZDY2YzhjZDQxMThlOCIsImlhdCI6MTc1ODUwMzAyOSwiZXhwIjoyMDczODYzMDI5fQ.EW0UQFZmlhPFQ-zs9l6fFKeUIJMf4cWR25pY4nvUTGw'; // Replace with your token
const item = req.params.item
  async function clearOutCOmpletedItems(itemName) {
    try {
       const response = await fetch(`${HA_URL}/api/services/shopping_list/clear_completed_items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (response.ok) {
    console.log('Completed shopping list items cleared.');
  } else {
    console.error('Error clearing completed items:', await response.text());
  }

      console.log('Cleared Items');
      res.send("Updated")
    } catch (error) {
      console.error('Error marking item complete:', error.response ? error.response.data : error.message);
    }
  }

  clearOutCOmpletedItems();


  })
app.get('/getShoppingListItems', async (req,res,next)=> {



  const HA_URL = 'http://192.168.0.110:8123'; // Replace with your HA URL
  const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiOWFhYzE5ZjQwYmQ0NDJhYTE5ZDY2YzhjZDQxMThlOCIsImlhdCI6MTc1ODUwMzAyOSwiZXhwIjoyMDczODYzMDI5fQ.EW0UQFZmlhPFQ-zs9l6fFKeUIJMf4cWR25pY4nvUTGw'; // Replace with your token

async function getShoppingListItems() {
  try {
    const response = await axios.get(`${HA_URL}/api/shopping_list`, {
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Shopping list items:', response.data);
    res.send(response.data)
  } catch (error) {
    console.error('Error fetching shopping list:', error.response ? error.response.data : error.message);
  }
}

getShoppingListItems();


})
app.get('/updateShoppingItem/:item', async (req, res, next) => {
    const HA_URL = 'http://192.168.0.110:8123'; // Replace with your HA URL
  const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiOWFhYzE5ZjQwYmQ0NDJhYTE5ZDY2YzhjZDQxMThlOCIsImlhdCI6MTc1ODUwMzAyOSwiZXhwIjoyMDczODYzMDI5fQ.EW0UQFZmlhPFQ-zs9l6fFKeUIJMf4cWR25pY4nvUTGw'; // Replace with your token
const item = req.params.item
  async function markItemComplete(itemName) {
    try {
      const response = await axios.post(
        `${HA_URL}/api/services/shopping_list/complete_item`,
        {
          name: itemName,
        },
        {
          headers: {
            Authorization: `Bearer ${HA_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Marked "${itemName}" as complete.`);
      res.send("Updated")
    } catch (error) {
      console.error('Error marking item complete:', error.response ? error.response.data : error.message);
    }
  }

  markItemComplete(item);



})
app.get('/addShoppingItem/:item', async (req, res, next) => {
  const HA_URL = 'http://192.168.0.110:8123'; // Replace with your HA URL
  const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiOWFhYzE5ZjQwYmQ0NDJhYTE5ZDY2YzhjZDQxMThlOCIsImlhdCI6MTc1ODUwMzAyOSwiZXhwIjoyMDczODYzMDI5fQ.EW0UQFZmlhPFQ-zs9l6fFKeUIJMf4cWR25pY4nvUTGw'; // Replace with your token
const item = req.params.item
  async function addItemToShoppingList(itemName) {
    try {
      const response = await axios.post(
        `${HA_URL}/api/services/shopping_list/add_item`,
        {
          name: itemName,
        },
        {
          headers: {
            Authorization: `Bearer ${HA_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Added "${itemName}" to shopping list.`);
      res.send("Updated")
    } catch (error) {
      console.error('Error adding item:', error.response ? error.response.data : error.message);
    }
  }

  addItemToShoppingList(item);
  })
const SUndaysRule = new schedule.RecurrenceRule();
SUndaysRule.second =35;
  let weeklyStars = 0;
  const job2 = schedule.scheduleJob(SUndaysRule, async function(){
});

const PORT = process.env.PORT || 3000;
const server = createServer(app);
const rabbitSocketOriginRaw = process.env.RABBITS_SOCKET_ORIGIN;
const rabbitSocketOrigins = rabbitSocketOriginRaw
  ? rabbitSocketOriginRaw.split(',').map((origin) => origin.trim()).filter(Boolean)
  : '*';
const io = new SocketIOServer(server, {
  cors: {
    origin: rabbitSocketOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
registerRabbitSocketHandlers(io);

server.listen(PORT, () => console.log(`Express API running on http://localhost:${PORT}`));
