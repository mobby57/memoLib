using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "AuditLogs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId_OccurredAt",
                table: "AuditLogs",
                columns: new[] { "UserId", "OccurredAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_UserId_OccurredAt",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "AuditLogs");
        }
    }
}
