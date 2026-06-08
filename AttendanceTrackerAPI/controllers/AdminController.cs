using AttendanceTrackerAPI.Data;
using ClosedXML.Excel;
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

    [HttpGet("export")]
    public async Task<IActionResult> ExportAttendance([FromQuery] string? search, [FromQuery] string? department, [FromQuery] DateTime? date, [FromQuery] int? employeeId)
    {
        var query = _context.Employees.Include(e => e.Attendances).AsQueryable();

        if (employeeId.HasValue)
        {
            query = query.Where(e => e.Id == employeeId.Value);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(e => e.Name.Contains(search));
            }
            if (!string.IsNullOrWhiteSpace(department))
            {
                query = query.Where(e => e.Role == department);
            }
        }

        var employees = await query.ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Attendance Report");

        // Add headers
        worksheet.Cell(1, 1).Value = "Employee ID";
        worksheet.Cell(1, 2).Value = "Name";
        worksheet.Cell(1, 3).Value = "Department";
        worksheet.Cell(1, 4).Value = "Punch Time";
        worksheet.Cell(1, 5).Value = "Attendance Type";
        worksheet.Cell(1, 6).Value = "Status";
        worksheet.Cell(1, 7).Value = "Location Verified";
        worksheet.Cell(1, 8).Value = "Face Verified";

        var headerRow = worksheet.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

        int row = 2;

        foreach (var employee in employees)
        {
            var attendances = employee.Attendances.AsQueryable();

            if (date.HasValue)
            {
                attendances = attendances.Where(a => a.PunchTime.Date == date.Value.Date);
            }

            foreach (var attendance in attendances.OrderByDescending(a => a.PunchTime))
            {
                worksheet.Cell(row, 1).Value = employee.Id;
                worksheet.Cell(row, 2).Value = employee.Name;
                worksheet.Cell(row, 3).Value = employee.Role;
                worksheet.Cell(row, 4).Value = attendance.PunchTime.ToString("yyyy-MM-dd HH:mm:ss");
                worksheet.Cell(row, 5).Value = attendance.AttendanceType;
                worksheet.Cell(row, 6).Value = attendance.Status ?? "N/A";
                worksheet.Cell(row, 7).Value = attendance.LocationVerified ? "Yes" : "No";
                worksheet.Cell(row, 8).Value = attendance.FaceVerified ? "Yes" : "No";
                row++;
            }
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        string fileName = "AttendanceReport";
        if (date.HasValue) fileName += $"_{date.Value:yyyyMMdd}";
        if (employeeId.HasValue) fileName += $"_Emp{employeeId.Value}";
        fileName += ".xlsx";

        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
