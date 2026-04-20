# BloomTransit 🚌

**Real-time transit tracking app for Bloomington, IN** — built with React Native (Expo) and Express.js.

> **📢 Important Note:** This is the **open-source starter version** of BloomTransit. The full production codebase — including our proprietary trip-planning algorithm, push notification engine, and live deployment credentials — is maintained in a **private repository**. We're sharing this starter so that anyone interested in building a transit app can use it as a foundation. See [What's Included](#whats-included) and [What You'll Need to Build](#what-youll-need-to-build) below.

---

## 🎯 What This Project Does

BloomTransit is a mobile app designed to make riding Bloomington Transit easier. The full production app includes:

- **Live Bus Tracking** — Real-time bus positions on Google Maps, updating every 10 seconds
- **Route Visualization** — Color-coded route polylines overlaid on a dark-mode map
- **Trip Planner** — Origin-to-destination bus trip planning with direct and one-transfer options
- **Schedule Viewer** — Today's departures grouped by route with "next bus" indicators
- **Nearest Bus Finder** — GPS-based nearest bus and stop lookup
- **Walking Time Estimates** — Walking time to nearby stops via haversine distance
- **Push Notifications** — Bus proximity alerts, time-to-leave countdowns, service alert notifications
- **Saved Commutes** — Pin frequent trips for quick access with live ETA updates

---

## 📦 What's Included

This public repo gives you the **complete app structure and UI** — everything you need to understand the architecture and build your own transit app on top of it.

### ✅ Fully Included
| Component | Description |
|-----------|-------------|
| **All UI Screens** | Map, Trip Planner, Routes/Schedule, Saved Commutes — complete with dark-mode styling, animations, and polished layout |
| **MVVM Architecture** | Clean Model-ViewModel-View separation using React Context + custom hooks |
| **Tab Navigation** | Bottom-tab navigator with 4 screens |
| **Component Library** | Bus markers, stop markers, detail sheets, alert banners, proximity cards |
| **Server Skeleton** | Express.js backend with route definitions, API endpoint structure, and Dockerfile |
| **Package Configs** | All dependency lists (`package.json`), Expo config (`app.json`), `.gitignore` |
| **API Endpoint Definitions** | All REST endpoints documented and routed |

### 🔒 Removed / Placeholder
| Component | What You'll See | Why |
|-----------|----------------|-----|
| **Trip Planning Algorithm** | Function signatures + JSDoc descriptions | Proprietary multi-leg route matching logic |
| **GTFS Feed Parsing** | Module structure with empty implementations | Data pipeline is agency-specific |
| **GTFS-RT Protobuf Decoding** | Function signatures only | Realtime vehicle/alert processing |
| **Push Notification Engine** | Skeleton with `console.log` stubs | Channel setup, permission flow, trigger logic |
| **Proximity Tracking** | Hook structure without distance computation | Haversine-based alerting system |
| **Google Maps API Key** | `YOUR_GOOGLE_MAPS_API_KEY` placeholder | Credential security |
| **Backend Server URL** | `http://localhost:8080` placeholder | Deployment security |
| **GTFS Feed URLs** | `YOUR_GTFS_FEED_BASE_URL` placeholder | Data source security |

---

## 🏗️ Architecture

```
┌─────────────────────────┐       JSON/REST       ┌──────────────────────────┐
│   Android App           │  ◄──────────────────  │  Backend Server          │
│   (React Native / Expo) │    every 10 sec       │  (Express.js)            │
│                         │                       │                          │
│  MODEL                  │                       │  • Downloads GTFS feeds  │
│  └─ services/api.js     │                       │  • Decodes protobuf      │
│  └─ utils/geo.js        │                       │  • Serves clean JSON     │
│  └─ utils/constants.js  │                       │                          │
│                         │                       └──────────────────────────┘
│  VIEWMODEL (hooks)      │
│  └─ useVehicles         │
│  └─ useBusProximity     │
│  └─ useTimeToLeave      │
│  └─ useAlerts           │
│                         │
│  VIEW (screens)         │
│  └─ MapScreen           │
│  └─ TripScreen          │
│  └─ ScheduleScreen      │
│  └─ FavoritesScreen     │
└─────────────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 54) |
| Map | react-native-maps (Google Maps) |
| Notifications | expo-notifications |
| Backend | Node.js + Express |
| GTFS Data | GTFS Static (CSV) + GTFS-Realtime (Protobuf) |
| Deployment | Google Cloud Run (Docker) |

---

## 🚀 Using This as a Starter

If you'd like to build your own transit app using this as a starting point, here's what to do:

### 1. Get Your Data Source
Find your local transit agency's GTFS feed. Most US agencies publish one — check [transitfeeds.com](https://transitfeeds.com) or [mobility-data.org](https://database.mobilitydata.org/).

Update `server/config.js` with your feed URLs:
```js
GTFS_ZIP_URL: 'https://your-agency.com/gtfs.zip',
VEHICLE_POSITIONS_URL: 'https://your-agency.com/vehicle_positions.pb',
TRIP_UPDATES_URL: 'https://your-agency.com/trip_updates.pb',
ALERTS_URL: 'https://your-agency.com/alerts.pb',
```

### 2. Get API Keys
- **Google Maps API Key** — [Google Cloud Console](https://console.cloud.google.com/) → Enable Maps SDK for Android + Places API
- Update `app/app.json` with your Maps key
- Update `app/src/services/placesService.js` with your Places key

### 3. Implement the Core Logic
The function signatures and JSDoc comments tell you *what* each function should do. You'll need to implement:

- **`server/services/gtfsStaticService.js`** — Parse the GTFS zip (routes.txt, stops.txt, trips.txt, stop_times.txt, shapes.txt, calendar.txt)
- **`server/services/realtimeService.js`** — Decode GTFS-RT protobuf feeds using `gtfs-realtime-bindings`
- **`app/src/services/tripService.js`** — Trip planning algorithm (find connecting routes between origin/destination stops)
- **`app/src/services/notificationService.js`** — Expo push notification setup with Android channels

### 4. Run Locally
```bash
# Backend
cd server && npm install && node index.js

# Frontend
cd app && npm install
# Update API_URL in src/models/utils/constants.js to http://localhost:8080
npx expo start --android
```

### 5. Build APK
```bash
cd app
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# APK at: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📡 API Endpoints

The server exposes these REST endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/routes` | All bus routes |
| `GET /api/stops?routeId=X` | Stops (filterable by route) |
| `GET /api/shapes/:routeId` | Route polyline coordinates |
| `GET /api/schedule/:routeId` | Today's schedule for a route |
| `GET /api/vehicles` | Live bus positions |
| `GET /api/arrivals/:stopId` | Predicted arrivals at a stop |
| `GET /api/alerts` | Active service alerts |
| `GET /api/nearest?lat=X&lng=Y` | Nearest bus + nearest stop |

---

## 📂 Project Structure

```
bloomington-transit-public/
├── server/                  # Express.js backend
│   ├── config.js            # Feed URLs + polling intervals
│   ├── index.js             # Server entry point
│   ├── Dockerfile           # Cloud Run deployment
│   ├── services/
│   │   ├── gtfsStaticService.js    # GTFS data parsing (stub)
│   │   └── realtimeService.js      # GTFS-RT polling (stub)
│   └── routes/
│       ├── staticApi.js     # Routes, stops, shapes, schedule endpoints
│       ├── realtimeApi.js   # Vehicles, arrivals, alerts endpoints
│       └── nearestApi.js    # Nearest bus/stop endpoint (stub)
│
├── app/                     # React Native (Expo) frontend
│   ├── App.js               # App entry point
│   ├── app.json             # Expo configuration
│   └── src/
│       ├── context/         # React Context (TransitProvider)
│       ├── models/          # API client, geo utils, constants
│       ├── services/        # Trip planner, notifications, places (stubs)
│       ├── viewmodels/      # Custom hooks (business logic)
│       └── views/
│           ├── screens/     # MapScreen, TripScreen, ScheduleScreen, FavoritesScreen
│           ├── components/  # BusMarker, StopMarker, DetailSheets, AlertsBanner
│           └── navigation/  # TabNavigator
│
└── README.md
```

---

## 👥 Team

Built by **Team Remontada** at the Luddy School of Informatics, Computing, and Engineering — Indiana University Bloomington.

---

## 📄 License

This starter code is shared for educational and reference purposes. The full production application with proprietary algorithms and credentials remains private. Feel free to use this structure as a starting point for your own transit app project.
