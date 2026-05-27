namespace AttendanceTrackerAPI.Models;

public class Attendance
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public Employee Employee { get; set; } = null!;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string AttendanceType { get; set; } = string.Empty;

    // Alias for "PunchTime" requirement.
    public DateTime CheckInTime { get; set; }

    // Attendance punch timestamp (preferred name).
    public DateTime PunchTime { get; set; }

    public bool LocationVerified { get; set; }

    public bool FaceVerified { get; set; }

    // DeepFace distance-based similarity score (lower distance means more similar).
    public double? ConfidenceScore { get; set; }

    // Approved / Rejected (based on DeepFace verification).
    public string? Status { get; set; }

    public string? SelfieImagePath { get; set; }
}
