using AttendanceTrackerAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AttendanceTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard-data")]
    public async Task<IActionResult> GetDashboardData()
    {
        var employees = await _context.Employees
            .Include(e => e.Attendances)
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.Email,
                e.Role,
                e.CreatedAt,
                Attendances = e.Attendances.Select(a => new
                {
                    a.Id,
                    a.PunchTime,
                    a.AttendanceType,
                    a.Status,
                    a.LocationVerified,
                    a.FaceVerified,
                    a.Latitude,
                    a.Longitude,
                    a.ConfidenceScore
                }).OrderByDescending(a => a.PunchTime).ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = employees
        });
    }
}
