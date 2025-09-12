# iCloud CalDAV CRUD (Node.js)

A minimal, production-ready Node.js module to **create, read, update, delete, and list** events on an **iCloud Calendar** via **CalDAV** using [`tsdav`]. Now includes an **ICS event details parser**.

## Features
- Auth with **app-specific password**
- Robust **list events** that works with iCloud quirks
- Create / Update / Delete events
- Find events by UID or href
- List available calendars
- Parse ICS to get **summary, description, location, attendees, organizer, RRULE, EXDATE, alarms, etc.**

## Quick Start

1) **Install deps**

```bash
npm i
```

2) **Create `.env`** (copy from `.env.example`) and set:
```
ICLOUD_APPLE_ID=you@example.com
ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx   # app-specific password from appleid.apple.com
ICLOUD_TZ=America/New_York
ICLOUD_CALENDAR_NAME=Home                 # optional: match displayName (e.g., Home/Work)
```

3) **Run demo**

```bash
npm run demo
```

This will:
- Initialize the CalDAV client
- Show all calendars
- Create a demo event
- List events (robust)
- **List events with parsed details**
- Update the event
- Delete the event
