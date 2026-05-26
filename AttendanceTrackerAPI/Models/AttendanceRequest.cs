namespace AttendanceTrackerAPI.Models;

public class AttendanceRequest
{
    public int EmployeeId { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string AttendanceType { get; set; } = "Office";
}
