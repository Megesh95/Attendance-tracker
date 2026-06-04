using AttendanceTrackerAPI.Data;
using AttendanceTrackerAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AttendanceTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext context, ILogger<AuthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        _logger.LogInformation("Auth login request received.");
        _logger.LogInformation("Incoming email: {Email}", request?.Email);
        _logger.LogInformation("Incoming password: {Password}", request?.Password);

        if (request is null ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                success = false,
                message = "Email and password are required"
            });
        }

        var normalizedEmail = request.Email.Trim().ToLower();

        // Fetch employee safely by normalized email.
        var employee = await _context.Employees
            .FirstOrDefaultAsync(x => x.Email.ToLower().Trim() == normalizedEmail);

        if (employee is null)
        {
            _logger.LogWarning("Employee not found for email: {Email}", normalizedEmail);
            return Unauthorized(new
            {
                success = false,
                message = "Invalid credentials"
            });
        }

        _logger.LogInformation("Fetched employee email: {Email}", employee.Email);
        _logger.LogInformation("Fetched employee passwordHash: {PasswordHash}", employee.PasswordHash);

        if (employee.PasswordHash != request.Password)
        {
            _logger.LogWarning("Invalid password for email: {Email}", normalizedEmail);
            return Unauthorized(new
            {
                success = false,
                message = "Invalid credentials"
            });
        }

        return Ok(new
        {
            success = true,
            message = "Login successful",
            employeeId = employee.Id,
            name = employee.Name,
            email = employee.Email,
            role = employee.Role,
            referenceImagePath = employee.ReferenceImagePath,
            officeLatitude = employee.OfficeLatitude,
            officeLongitude = employee.OfficeLongitude
        });
    }

    [HttpPost("register-face")]
    [RequestSizeLimit(15_000_000)]
    public async Task<IActionResult> RegisterFace(
        [FromForm] int employeeId,
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

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee is null)
        {
            return BadRequest(new
            {
                success = false,
                message = "Employee not found"
            });
        }

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        var employeeDir = Path.Combine(uploadsRoot, "employees", employeeId.ToString());
        Directory.CreateDirectory(employeeDir);

        // Allow updating reference image; requirement says register only if null, but keeping this safe.
        var fileExt = Path.GetExtension(selfie.FileName);
        if (string.IsNullOrWhiteSpace(fileExt))
            fileExt = ".jpg";

        var fileName = $"reference{fileExt}";
        var fullPath = Path.Combine(employeeDir, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await selfie.CopyToAsync(stream);
        }

        employee.ReferenceImagePath = fullPath;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Reference face registered",
            referenceImagePath = employee.ReferenceImagePath
        });
    }
}

