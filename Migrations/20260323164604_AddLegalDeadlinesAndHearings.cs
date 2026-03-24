using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLegalDeadlinesAndHearings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Hearings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssignedToUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "TEXT", nullable: true),
                    Duration = table.Column<string>(type: "TEXT", nullable: true),
                    Jurisdiction = table.Column<string>(type: "TEXT", nullable: false),
                    Chamber = table.Column<string>(type: "TEXT", nullable: true),
                    RoleNumber = table.Column<string>(type: "TEXT", nullable: true),
                    CourtAddress = table.Column<string>(type: "TEXT", nullable: true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    OpposingParty = table.Column<string>(type: "TEXT", nullable: true),
                    OpposingLawyer = table.Column<string>(type: "TEXT", nullable: true),
                    JudgeName = table.Column<string>(type: "TEXT", nullable: true),
                    DocumentsToProvide = table.Column<string>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    Outcome = table.Column<string>(type: "TEXT", nullable: true),
                    ReminderJ7Sent = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReminderJ1Sent = table.Column<bool>(type: "INTEGER", nullable: false),
                    AssignedToId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    TenantId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hearings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Hearings_Cases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "Cases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Hearings_Users_AssignedToId",
                        column: x => x.AssignedToId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LegalDeadlines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssignedToUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    Deadline = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    AlertJ30Sent = table.Column<bool>(type: "INTEGER", nullable: false),
                    AlertJ7Sent = table.Column<bool>(type: "INTEGER", nullable: false),
                    AlertJ3Sent = table.Column<bool>(type: "INTEGER", nullable: false),
                    AlertJ1Sent = table.Column<bool>(type: "INTEGER", nullable: false),
                    Jurisdiction = table.Column<string>(type: "TEXT", nullable: true),
                    LegalBasis = table.Column<string>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    AssignedToId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    TenantId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegalDeadlines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LegalDeadlines_Cases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "Cases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LegalDeadlines_Users_AssignedToId",
                        column: x => x.AssignedToId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_AssignedToId",
                table: "Hearings",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_CaseId_Date",
                table: "Hearings",
                columns: new[] { "CaseId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_Status_Date",
                table: "Hearings",
                columns: new[] { "Status", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_LegalDeadlines_AssignedToId",
                table: "LegalDeadlines",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_LegalDeadlines_CaseId_Deadline",
                table: "LegalDeadlines",
                columns: new[] { "CaseId", "Deadline" });

            migrationBuilder.CreateIndex(
                name: "IX_LegalDeadlines_Status_Deadline",
                table: "LegalDeadlines",
                columns: new[] { "Status", "Deadline" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Hearings");

            migrationBuilder.DropTable(
                name: "LegalDeadlines");
        }
    }
}
