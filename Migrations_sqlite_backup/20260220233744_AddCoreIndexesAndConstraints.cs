using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCoreIndexesAndConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_Checksum",
                table: "Events",
                column: "Checksum",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_OccurredAt",
                table: "Events",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_Events_SourceId_OccurredAt",
                table: "Events",
                columns: new[] { "SourceId", "OccurredAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Events_Checksum",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_OccurredAt",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_SourceId_OccurredAt",
                table: "Events");
        }
    }
}
