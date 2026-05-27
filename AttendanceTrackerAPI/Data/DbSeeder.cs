using AttendanceTrackerAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace AttendanceTrackerAPI.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        var now = DateTime.UtcNow;

        var seedEmployees = new[]
        {
            new Employee
            {
                Name = "Admin",
                Email = "admin@gmail.com",
                PasswordHash = "123456",
                Role = "Admin",
                CreatedAt = now,
            },
            new Employee
            {
                Name = "User One",
                Email = "user1@gmail.com",
                PasswordHash = "123456",
                Role = "Employee",
                CreatedAt = now,
            },
            new Employee
            {
                Name = "User Two",
                Email = "user2@gmail.com",
                PasswordHash = "123456",
                Role = "Employee",
                CreatedAt = now,
            }
        };

        foreach (var seed in seedEmployees)
        {
            var existing = await context.Employees
                .FirstOrDefaultAsync(e =>
                    e.Email.ToLower().Trim() ==
                    seed.Email.ToLower().Trim());

            if (existing is null)
            {
                seed.ReferenceImagePath = null;
                context.Employees.Add(seed);
                continue;
            }

            // Keep existing ReferenceImagePath if already registered.
            existing.Name = seed.Name;
            existing.PasswordHash = seed.PasswordHash;
            existing.Role = seed.Role;
            existing.CreatedAt = existing.CreatedAt == default ? now : existing.CreatedAt;
        }

        await context.SaveChangesAsync();
    }
}
