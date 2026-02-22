using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncSchemaForCaseFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedToUserId",
                table: "Cases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ClosedAt",
                table: "Cases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "Cases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "Cases",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Cases",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Cases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Attachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    FileName = table.Column<string>(type: "TEXT", nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", nullable: false),
                    FileSize = table.Column<long>(type: "INTEGER", nullable: false),
                    FilePath = table.Column<string>(type: "TEXT", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Attachments_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseShares",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SharedWithEmail = table.Column<string>(type: "TEXT", nullable: false),
                    SharedWithName = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    SharedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SharedByUserId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseShares", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Subject = table.Column<string>(type: "TEXT", nullable: false),
                    Body = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cases_AssignedToUserId",
                table: "Cases",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Cases_Status",
                table: "Cases",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_EventId",
                table: "Attachments",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseShares_CaseId",
                table: "CaseShares",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseShares_SharedWithEmail",
                table: "CaseShares",
                column: "SharedWithEmail");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Attachments");

            migrationBuilder.DropTable(
                name: "CaseShares");

            migrationBuilder.DropTable(
                name: "EmailTemplates");

            migrationBuilder.DropIndex(
                name: "IX_Cases_AssignedToUserId",
                table: "Cases");

            migrationBuilder.DropIndex(
                name: "IX_Cases_Status",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "AssignedToUserId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Cases");
        }
    }
}
