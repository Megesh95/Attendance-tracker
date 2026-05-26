namespace AttendanceTrackerAPI.Models;

public class Attendance
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public Employee Employee { get; set; } = null!;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string AttendanceType { get; set; } = string.Empty;

    public DateTime CheckInTime { get; set; }

    public bool LocationVerified { get; set; }

    public bool FaceVerified { get; set; }

    public string? SelfieImagePath { get; set; }
}
