using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClientOnboardingFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClientOnboardingRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TemplateId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ClientName = table.Column<string>(type: "TEXT", nullable: false),
                    ClientEmail = table.Column<string>(type: "TEXT", nullable: false),
                    AccessToken = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    SelectedNeed = table.Column<string>(type: "TEXT", nullable: true),
                    ParticipantsJson = table.Column<string>(type: "TEXT", nullable: false),
                    ProvidedDocumentsJson = table.Column<string>(type: "TEXT", nullable: false),
                    AnswersJson = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedCaseId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientOnboardingRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientOnboardingTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    NeedOptionsJson = table.Column<string>(type: "TEXT", nullable: false),
                    RequiredDocumentsJson = table.Column<string>(type: "TEXT", nullable: false),
                    ParticipantRolesJson = table.Column<string>(type: "TEXT", nullable: false),
                    ExtraFieldsJson = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientOnboardingTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SatisfactionSurveys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ClientId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssignedLawyerId = table.Column<Guid>(type: "TEXT", nullable: true),
                    SentAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    OverallSatisfaction = table.Column<int>(type: "INTEGER", nullable: true),
                    CommunicationQuality = table.Column<int>(type: "INTEGER", nullable: true),
                    ResponseTime = table.Column<int>(type: "INTEGER", nullable: true),
                    Professionalism = table.Column<int>(type: "INTEGER", nullable: true),
                    ResultQuality = table.Column<int>(type: "INTEGER", nullable: true),
                    PositiveComments = table.Column<string>(type: "TEXT", nullable: true),
                    ImprovementSuggestions = table.Column<string>(type: "TEXT", nullable: true),
                    WouldRecommend = table.Column<bool>(type: "INTEGER", nullable: true),
                    SurveyToken = table.Column<string>(type: "TEXT", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SatisfactionSurveys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    InvitedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<int>(type: "INTEGER", nullable: false),
                    InvitationToken = table.Column<string>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsAccepted = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    InvitedById = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserInvitations_Users_InvitedById",
                        column: x => x.InvitedById,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserTeamMemberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TeamOwnerId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Role = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserTeamMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserTeamMemberships_Users_TeamOwnerId",
                        column: x => x.TeamOwnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserTeamMemberships_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientOnboardingRequests_AccessToken",
                table: "ClientOnboardingRequests",
                column: "AccessToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientOnboardingRequests_OwnerUserId_Status_CreatedAt",
                table: "ClientOnboardingRequests",
                columns: new[] { "OwnerUserId", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientOnboardingTemplates_UserId_IsActive",
                table: "ClientOnboardingTemplates",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_UserInvitations_InvitedById",
                table: "UserInvitations",
                column: "InvitedById");

            migrationBuilder.CreateIndex(
                name: "IX_UserTeamMemberships_TeamOwnerId",
                table: "UserTeamMemberships",
                column: "TeamOwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_UserTeamMemberships_UserId",
                table: "UserTeamMemberships",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientOnboardingRequests");

            migrationBuilder.DropTable(
                name: "ClientOnboardingTemplates");

            migrationBuilder.DropTable(
                name: "SatisfactionSurveys");

            migrationBuilder.DropTable(
                name: "UserInvitations");

            migrationBuilder.DropTable(
                name: "UserTeamMemberships");
        }
    }
}
