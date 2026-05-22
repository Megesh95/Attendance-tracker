using Microsoft.AspNetCore.Mvc;

namespace AttendanceTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        [HttpPost("office")]
        public IActionResult MarkOfficeAttendance(
            AttendanceRequest request
        )
        {
            double officeLat = 13.15227027680566;
            double officeLng = 77.55625239544804;

            double distance = CalculateDistance(
                request.Latitude,
                request.Longitude,
                officeLat,
                officeLng
            );

            if (distance > 500)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Outside Office Range"
                });
            }

            return Ok(new
            {
                success = true,
                message = "Attendance Marked"
            });
        }

        private double CalculateDistance(
            double lat1,
            double lon1,
            double lat2,
            double lon2
        )
        {
            var R = 6371e3;

            var φ1 = lat1 * Math.PI / 180;
            var φ2 = lat2 * Math.PI / 180;

            var Δφ = (lat2 - lat1) * Math.PI / 180;
            var Δλ = (lon2 - lon1) * Math.PI / 180;

            var a =
                Math.Sin(Δφ / 2) *
                Math.Sin(Δφ / 2) +
                Math.Cos(φ1) *
                Math.Cos(φ2) *
                Math.Sin(Δλ / 2) *
                Math.Sin(Δλ / 2);

            var c =
                2 * Math.Atan2(
                    Math.Sqrt(a),
                    Math.Sqrt(1 - a)
                );

            return R * c;
        }
    }

    public class AttendanceRequest
    {
        public double Latitude { get; set; }

        public double Longitude { get; set; }
    }
}