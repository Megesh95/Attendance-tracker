# Attendance Tracker API

ASP.NET Core 9 Web API for employee office attendance validation using GPS coordinates.

## Endpoints

- `POST /api/attendance/office` — Body: `{ "employeeId": 1, "latitude": number, "longitude": number, "attendanceType": "Office" }`
  - Persists a row in `Attendances` when GPS validation succeeds
  - Within 100 m of office → `{ "success": true, "message": "Attendance Marked" }`
  - Outside range → `400` with `{ "success": false, "message": "Outside Office Range" }`

## Database (SQL Server)

Connection string in `appsettings.json`:

- Server: `localhost\SQLEXPRESS`
- Database: `AttendanceTrackerDB`
- Windows authentication + `TrustServerCertificate=True`

Create/update the schema:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## Run locally

```bash
dotnet run
```

Listens on `http://0.0.0.0:5162` (see `Properties/launchSettings.json`).

## Mobile app

Pair with [Attendance-tracker](https://github.com/Megesh95/Attendance-tracker) and set the API base URL in the app's `constants/api.ts`.
