using AttendanceTrackerAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace AttendanceTrackerAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();

    public DbSet<Attendance> Attendances => Set<Attendance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.ToTable("Employees");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(256);

            entity.HasIndex(e => e.Email)
                .IsUnique();

            entity.Property(e => e.PasswordHash)
                .IsRequired()
                .HasMaxLength(512);

            entity.Property(e => e.Role)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.ReferenceImagePath)
                .HasMaxLength(255);

            entity.HasMany(e => e.Attendances)
                .WithOne(a => a.Employee)
                .HasForeignKey(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.ToTable("Attendances");

            entity.HasKey(a => a.Id);

            entity.Property(a => a.AttendanceType)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(a => a.CheckInTime)
                .IsRequired();

            entity.Property(a => a.PunchTime)
                .IsRequired();

            entity.Property(a => a.ConfidenceScore);

            entity.Property(a => a.Status)
                .HasMaxLength(50);

            entity.Property(a => a.FaceVerified)
                .IsRequired();

            entity.Property(a => a.LocationVerified)
                .IsRequired();

            entity.Property(a => a.SelfieImagePath)
                .HasMaxLength(500);

            entity.HasIndex(a => a.EmployeeId);
            entity.HasIndex(a => a.CheckInTime);
            entity.HasIndex(a => a.PunchTime);
        });
    }
}
