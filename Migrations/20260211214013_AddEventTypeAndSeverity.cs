using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventTypeAndSeverity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EventType",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Severity",
                table: "Events",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EventType",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Severity",
                table: "Events");
        }
    }
}
