# 📅 **OVERVIEW**

## Live-updating of [selected] UBALT Org Events. Automatically syncs official campus events from ICS Feed -> Processes & Handles Event Content --> Display's through an interactive and responsive site

## 🔄 **Automated Event Syncing**

### 🔹 Scheduled Github Actions Workflow runs hourly (can be manually triggered)

### 🔹 Fetches events from official UBALT campus ICS Feed

### 🔹 Events are

    1. Normalized
    2. Diffed against existing datasets
    3. Logged (additions/updates/removals) 

### 🔹 The resulting dataset is written to "events.json", which only commits back to the repository when changes are detected

## 💡 **Event Processing**

### 🔹 Events preserve quoted-printable encoding when provided by the source (ICS Feed)

### 🔹 Hosting Organizations are detected via pattern matching (supports multi-orgs)

### 🔹 Each event has the following attributes

    1. Title
    2. Start/End Time
    3. Description
    4. Registration URL (UBALT BeeInvolved Page)
    5. Hosting Org(s)
    6. Primary Org Color Code
    
## 🎨 **Org Color Codes**

![Org Color Codes](https://github.com/Frinjee/frinjee.github.io/blob/main/assets/imgs/c_codes.png?raw=true)

## 🎯 **Current Functionality**

### 💻 **Desktop**

    1. MonthGrid View by default
    2. Slim, stacked events with intelligent scroll behavior
    3. Hover tooltips for quick details
    4. Click -> Modal View for full event information
    5. "Upcoming Events" auto-scroll card (transitions, hover-pause, direct registration access (via click))

### 📱 **MOBILE**

    1. Automatic switch to ListView for readability
    2. Compact typography and spacing
    3. Responive touch friendly navigation
    4. Parity with desktop visuals and functions

## ‼️ **TO DO** ‼️

### 💻 **Desktop Plans**

    📍 Multi-day agenda overview for the selected week

    📍 Hover preview (full-card modal)

    📍 Change "Upcoming Events" transition -> Scrolling left to right (vs current fade transition)

    📍 Add descriptions for Orgs that are tracked

    📍 Add function allowing adding an event to personal calendar (gcal, ical, outlook, ics file dl)

    📍 Expose event change history (date/time/location updates, etc)

    📍 Search/Filter module (by event/org)

### 📱 **Mobile Plans**

📍 ~~Gestures (Swipe integration)~~ ✔️

📍 ~~"Jump-to" first listed event week (default-onload)~~ ✔️

📍 ~~Ensure theme/function conitinuity~~ ✔️

📍 ~~Bottom-sheet style event modal~~ ✔️

📍 ~~Sticky "Upcoming Events" mini card~~ ✔️

📍 ~~Haptic feedback for gesture interactions~~ ✔️
