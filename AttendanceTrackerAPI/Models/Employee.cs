namespace AttendanceTrackerAPI.Models;

public class Employee
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
