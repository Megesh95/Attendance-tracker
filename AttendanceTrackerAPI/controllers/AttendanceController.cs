using AttendanceTrackerAPI.Data;
using AttendanceTrackerAPI.Models;
using AttendanceTrackerAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AttendanceTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private const double OfficeLat = 13.15227027680566;
    private const double OfficeLng = 77.55625239544804;
    // private const double OfficeLat = 12.78672089977720;
    // private const double OfficeLng = 77.8043905557959;

    private const double OfficeRadiusMeters = 500;

    private readonly AppDbContext _context;
    private readonly IDeepFaceVerifierService _deepFaceVerifier;

    public AttendanceController(AppDbContext context, IDeepFaceVerifierService deepFaceVerifier)
    {
        _context = context;
        _deepFaceVerifier = deepFaceVerifier;
    }

    [HttpPost("office")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> MarkOfficeAttendance(
        [FromForm] AttendanceRequest request,
        [FromForm] IFormFile selfie)
    {
        if (selfie is null || selfie.Length == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Selfie image is required"
            });
        }

        var distance = CalculateDistance(
            request.Latitude,
            request.Longitude,
            OfficeLat,
            OfficeLng);

        if (distance > OfficeRadiusMeters)
        {
            return BadRequest(new
            {
                success = false,
                message = "Outside Office Range"
            });
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId);

        if (employee is null)
        {
            return BadRequest(new
            {
                success = false,
                message = "Employee not found"
            });
        }

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        var employeeDir = Path.Combine(uploadsRoot, "attendance", employee.Id.ToString());
        Directory.CreateDirectory(employeeDir);

        var ext = Path.GetExtension(selfie.FileName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = ".jpg";

        var punchTime = DateTime.Now;
        var fileName = $"selfie_{punchTime:yyyyMMdd_HHmmss}{ext}";
        var selfiePath = Path.Combine(employeeDir, fileName);

        await using (var stream = System.IO.File.Create(selfiePath))
        {
            await selfie.CopyToAsync(stream);
        }

        bool faceVerified = false;
        string attendanceStatus = "Rejected";
        double? confidenceScore = null;

        if (string.IsNullOrEmpty(employee.ReferenceImagePath))
        {
            // First time: Save as reference image
            employee.ReferenceImagePath = selfiePath;
            _context.Employees.Update(employee);
            
            faceVerified = true;
            attendanceStatus = "Approved";
        }
        else
        {
            // Subsequent check-ins: Verify against reference
            try
            {
                var result = await _deepFaceVerifier.VerifyAsync(employee.ReferenceImagePath, selfiePath, HttpContext.RequestAborted);
                confidenceScore = result.ConfidenceScore;

                if (result.Verified && confidenceScore >= 0.75)
                {
                    faceVerified = true;
                    attendanceStatus = "Approved";
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Face verification failed. Attendance not recorded."
                    });
                }
            }
            catch (Exception)
            {
                // DeepFace script failed (e.g., no face detected)
                return BadRequest(new
                {
                    success = false,
                    message = "Face not detected. Please retake the selfie."
                });
            }
        }

        var attendance = new Attendance
        {
            EmployeeId = request.EmployeeId,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            AttendanceType = request.AttendanceType,
            CheckInTime = punchTime,
            PunchTime = punchTime,
            LocationVerified = true,
            FaceVerified = faceVerified,
            ConfidenceScore = confidenceScore,
            Status = attendanceStatus,
            SelfieImagePath = selfiePath
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

    [HttpGet("history/{employeeId}")]
    public async Task<IActionResult> GetHistory(int employeeId)
    {
        var records = await _context.Attendances
            .Where(a => a.EmployeeId == employeeId)
            .OrderByDescending(a => a.PunchTime)
            .Select(a => new
            {
                a.PunchTime,
                a.AttendanceType
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = records
        });
    }
}
