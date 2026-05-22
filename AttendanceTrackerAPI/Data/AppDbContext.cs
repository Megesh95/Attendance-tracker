using Microsoft.EntityFrameworkCore;
using AttendanceTrackerAPI.Models;

namespace AttendanceTrackerAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options
        ) : base(options)
        {
        }

        public DbSet<Attendance> Attendances =>
            Set<Attendance>();
    }
}