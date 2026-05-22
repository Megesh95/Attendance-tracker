# Attendance Tracker

Employee attendance system with a React Native mobile app and ASP.NET Core API.

## Project structure

| Folder | Description |
|--------|-------------|
| [`attendance-tracker/`](attendance-tracker/) | Expo / React Native mobile app |
| [`AttendanceTrackerAPI/`](AttendanceTrackerAPI/) | ASP.NET Core 9 Web API |

## Quick start

### Backend

```bash
cd AttendanceTrackerAPI
dotnet run
```

API: `http://0.0.0.0:5162` — Office punch: `POST /api/attendance/office`

### Mobile app

```bash
cd attendance-tracker
npm install
npx expo start
```

Set your PC LAN IP in `attendance-tracker/constants/api.ts`.

## Office attendance flow

1. Log in on the app
2. **Punch From Office** → map screen with GPS
3. **Register Attendance** → API validates you are within 100 m of the office
