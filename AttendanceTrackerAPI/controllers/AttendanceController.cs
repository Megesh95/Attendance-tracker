using AttendanceTrackerAPI.Data;
using AttendanceTrackerAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AttendanceTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private const double OfficeLat = 13.15227027680566;
    private const double OfficeLng = 77.55625239544804;
    private const double OfficeRadiusMeters = 500;

    private readonly AppDbContext _context;

    public AttendanceController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("office")]
    public async Task<IActionResult> MarkOfficeAttendance(
        [FromBody] AttendanceRequest request)
    {
        var distance = CalculateDistance(
            request.Latitude,
            request.Longitude,
            OfficeLat,
            OfficeLng
        );

        if (distance > OfficeRadiusMeters)
        {
            return BadRequest(new
            {
                success = false,
                message = "Outside Office Range"
            });
        }

        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
        {
            return BadRequest(new
            {
                success = false,
                message = "Employee not found"
            });
        }

        var attendance = new Attendance
        {
            EmployeeId = request.EmployeeId,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            AttendanceType = request.AttendanceType,
            CheckInTime = DateTime.Now,
            LocationVerified = true,
            FaceVerified = false
        };

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Attendance Marked"
        });
    }

    private static double CalculateDistance(
        double lat1,
        double lon1,
        double lat2,
        double lon2)
    {
        const double R = 6371e3;

        var φ1 = lat1 * Math.PI / 180;
        var φ2 = lat2 * Math.PI / 180;
        var Δφ = (lat2 - lat1) * Math.PI / 180;
        var Δλ = (lon2 - lon1) * Math.PI / 180;

        var a =
            Math.Sin(Δφ / 2) * Math.Sin(Δφ / 2) +
            Math.Cos(φ1) * Math.Cos(φ2) *
            Math.Sin(Δλ / 2) * Math.Sin(Δλ / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }
}
