namespace AttendanceTrackerAPI.Models
{
    public class Attendance
    {
        public int Id { get; set; }

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public string Type { get; set; } = "";

        public DateTime Time { get; set; }
    }
}