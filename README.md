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


Project: Attendance Tracker System (internal employee attendance platform)
•
  Engineered a cross-platform employee attendance application using React Native (Expo) and TypeScript, delivering a secure mobile interface 
for attendance management.
•
   Piloted and validated the system in a real-world deployment with 10+ employees, confirming reliable GPS geofencing accuracy and facial 
verification performance under live office conditions.
•
  Architected RESTful APIs with ASP.NET  Core Web API and Entity Framework Core to manage employee authentication, attendance 
records, and administrative operations.
•
  Configured GPS-based geofencing to validate employee presence within designated office premises before allowing attendance check-in.
•
 Programmed an AI-powered facial verification module using Python, DeepFace, TensorFlow, and FaceNet to authenticate employees by 
comparing live selfies against registered reference images.
•
 Designed SQL Server database schemas for employee management, attendance tracking, verification logs, and audit records.
•
      Created an administrative dashboard featuring attendance analytics, employee filtering, historical tracking, and automated Excel report 
generation using ClosedXML.
•
      Collaborated across frontend, backend, database, and AI components to deliver a modular, scalable attendance solution following RESTful 
architecture best practices.

## Office attendance flow

1. Log in on the app
2. **Punch From Office** → map screen with GPS
3. **Register Attendance** → API validates you are within 100 m of the office
