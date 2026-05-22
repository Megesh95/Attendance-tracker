# Attendance Tracker API

ASP.NET Core 9 Web API for employee office attendance validation using GPS coordinates.

## Endpoints

- `POST /api/attendance/office` — Body: `{ "latitude": number, "longitude": number }`
  - Within 100 m of office → `{ "success": true, "message": "Attendance Marked" }`
  - Outside range → `400` with `{ "success": false, "message": "Outside Office Range" }`

## Run locally

```bash
dotnet run
```

Listens on `http://0.0.0.0:5162` (see `Properties/launchSettings.json`).

## Mobile app

Pair with [Attendance-tracker](https://github.com/Megesh95/Attendance-tracker) and set the API base URL in the app's `constants/api.ts`.
