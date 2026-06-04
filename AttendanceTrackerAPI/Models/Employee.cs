namespace AttendanceTrackerAPI.Models;

public class Employee
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public decimal? OfficeLatitude { get; set; }

    public decimal? OfficeLongitude { get; set; }

    // Employee registered biometric face reference image (nullable until first registration).
    public string? ReferenceImagePath { get; set; }

    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
