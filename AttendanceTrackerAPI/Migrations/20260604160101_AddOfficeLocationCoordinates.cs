using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddOfficeLocationCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "OfficeLatitude",
                table: "Employees",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OfficeLongitude",
                table: "Employees",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OfficeLatitude",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OfficeLongitude",
                table: "Employees");
        }
    }
}
