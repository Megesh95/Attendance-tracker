using AttendanceTrackerAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace AttendanceTrackerAPI.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (await context.Employees.AnyAsync())
        {
            return;
        }

        context.Employees.Add(new Employee
        {
            Name = "Demo Employee",
            Email = "admin@gmail.com",
            PasswordHash = "PLACEHOLDER",
            Role = "Employee",
            CreatedAt = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();
    }
}
