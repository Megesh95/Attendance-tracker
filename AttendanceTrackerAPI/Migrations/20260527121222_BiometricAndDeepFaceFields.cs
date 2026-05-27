using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class BiometricAndDeepFaceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The column may already exist (e.g. from a previous partial attempt).
            migrationBuilder.Sql(@"
IF COL_LENGTH('Employees', 'ReferenceImagePath') IS NULL
BEGIN
    ALTER TABLE [Employees] ADD [ReferenceImagePath] nvarchar(255) NULL;
END
");

            migrationBuilder.AddColumn<double>(
                name: "ConfidenceScore",
                table: "Attendances",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PunchTime",
                table: "Attendances",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Attendances",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_PunchTime",
                table: "Attendances",
                column: "PunchTime");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Attendances_PunchTime",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "ReferenceImagePath",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ConfidenceScore",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "PunchTime",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Attendances");
        }
    }
}
