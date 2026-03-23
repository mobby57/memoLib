using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Answers_QuestionnaireResponses_QuestionnaireResponseId",
                table: "Answers");

            migrationBuilder.DropIndex(
                name: "IX_UserEmailConfigs_UserId",
                table: "UserEmailConfigs");

            migrationBuilder.DropIndex(
                name: "IX_Answers_QuestionnaireResponseId",
                table: "Answers");

            migrationBuilder.DropColumn(
                name: "QuestionnaireResponseId",
                table: "Answers");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "WorkspaceDocuments",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "WorkspaceDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "WorkspaceDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "WorkspaceDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "WorkspaceDocuments",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "WorkspaceDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "WorkspaceDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Webhooks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Webhooks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Webhooks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "UserInvitations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "UserInvitations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "UserInvitations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "TimeEntries",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "TimeEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "TimeEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "TimeEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "TimeEntries",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "TimeEntries",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "TimeEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "TimeEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Tenants",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Tenants",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Tenants",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "SharedWorkspaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "SharedWorkspaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "SharedWorkspaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "SharedWorkspaces",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "SharedWorkspaces",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "SharedWorkspaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "SharedWorkspaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "SatisfactionSurveys",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "SatisfactionSurveys",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "SatisfactionSurveys",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "SatisfactionSurveys",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "SatisfactionSurveys",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "SatisfactionSurveys",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "SatisfactionSurveys",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "SatisfactionSurveys",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "RoleNotifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "RoleNotifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "RoleNotifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "RoleNotifications",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "RoleNotifications",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "RoleNotifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "RoleNotifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Reports",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Reports",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "Reports",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Questionnaires",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Questionnaires",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Questionnaires",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "PhoneCalls",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "PhoneCalls",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "PhoneCalls",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "PhoneCalls",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HandledById",
                table: "PhoneCalls",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PhoneCalls",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "PhoneCalls",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PhoneCalls",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "PhoneCalls",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "PendingActions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "PendingActions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "PendingActions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PendingActions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "PendingActions",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PendingActions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "PendingActions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Notifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Notifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "Notifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Notifications",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "Notifications",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Notifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Notifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Invoices",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Invoices",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "Invoices",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Invoices",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "Invoices",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Invoices",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Invoices",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Integrations",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Integrations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Integrations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Integrations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "ExternalShares",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "ExternalShares",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "ExternalShares",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ExternalShares",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "SharedById",
                table: "ExternalShares",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "ExternalShares",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "ExternalShares",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "ExternalShares",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Events",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "EmailTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "EmailTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "EmailTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "EmailTemplates",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "EmailTemplates",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "EmailTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "EmailTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "DynamicForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "DynamicForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "DynamicForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "DynamicForms",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "DynamicForms",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "DynamicForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "DocumentSignatures",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "DocumentSignatures",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "DocumentSignatures",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "DocumentSignatures",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "DocumentSignatures",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "DocumentSignatures",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "DocumentSignatures",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "CustomForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "CustomForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "CustomForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CustomForms",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "CustomForms",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "CustomForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "CustomForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Clients",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Clients",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "Clients",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Clients",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "Clients",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Clients",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Clients",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "ClientOnboardingTemplates",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "TEXT");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "ClientOnboardingTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "ClientOnboardingTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "ClientOnboardingRequests",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "ClientOnboardingRequests",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "ClientOnboardingRequests",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "ClientIntakeSubmissions",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "ClientIntakeSubmissions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedById",
                table: "ClientIntakeSubmissions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "ClientIntakeSubmissions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "ClientIntakeSubmissions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "ClientIntakeForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "ClientIntakeForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "ClientIntakeForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ClientIntakeForms",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "ClientIntakeForms",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "ClientIntakeForms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedToId",
                table: "CaseTasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CompletedById",
                table: "CaseTasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "CaseTasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "CaseTasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "CaseTasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CaseTasks",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "CaseTasks",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "CaseTasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "CaseTasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SharedById",
                table: "CaseShares",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Cases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Cases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "Cases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Cases",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "Cases",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Cases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "CaseNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "CaseNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "CaseNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CaseNotes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "CaseNotes",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "CaseNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CaseDocuments",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UploadedById",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "CaseComments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "CaseComments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "CaseComments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "CaseComments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "CaseComments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "CalendarEvents",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "CalendarEvents",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "CalendarEvents",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CalendarEvents",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "CalendarEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "CalendarEvents",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "CalendarEvents",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Automations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Automations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "Automations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Automations",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "Automations",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Automations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Automations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EntityId",
                table: "AuditLogs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EntityType",
                table: "AuditLogs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "AuditLogs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Attachments",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Attachments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Attachments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "Attachments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Attachments",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Attachments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Attachments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "AdvancedTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "AdvancedTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "AdvancedTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "AdvancedTemplates",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "AdvancedTemplates",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "AdvancedTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EmailVerificationTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Token = table.Column<string>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ConfirmedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailVerificationTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailVerificationTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Webhooks_UserId",
                table: "Webhooks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WebhookLogs_WebhookId",
                table: "WebhookLogs",
                column: "WebhookId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId",
                table: "Users",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_UserEmailConfigs_UserId",
                table: "UserEmailConfigs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserAutomationSettings_UserId",
                table: "UserAutomationSettings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeamMessages_CaseId",
                table: "TeamMessages",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamMessages_FromUserId",
                table: "TeamMessages",
                column: "FromUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskDependencies_DependsOnTaskId",
                table: "TaskDependencies",
                column: "DependsOnTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskDependencies_TaskId",
                table: "TaskDependencies",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskChecklistItems_TaskId",
                table: "TaskChecklistItems",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_Sources_UserId",
                table: "Sources",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SatisfactionSurveys_AssignedLawyerId",
                table: "SatisfactionSurveys",
                column: "AssignedLawyerId");

            migrationBuilder.CreateIndex(
                name: "IX_SatisfactionSurveys_CaseId",
                table: "SatisfactionSurveys",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_SatisfactionSurveys_ClientId",
                table: "SatisfactionSurveys",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleNotifications_CaseId",
                table: "RoleNotifications",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionnaireResponses_QuestionnaireId",
                table: "QuestionnaireResponses",
                column: "QuestionnaireId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionnaireResponses_UserId",
                table: "QuestionnaireResponses",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PhoneCalls_ClientId",
                table: "PhoneCalls",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_PhoneCalls_HandledById",
                table: "PhoneCalls",
                column: "HandledById");

            migrationBuilder.CreateIndex(
                name: "IX_PendingActions_EventId",
                table: "PendingActions",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingActions_UserId",
                table: "PendingActions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId",
                table: "PasswordResetTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_EventId",
                table: "Notifications",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceItems_InvoiceId",
                table: "InvoiceItems",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceItems_TimeEntryId",
                table: "InvoiceItems",
                column: "TimeEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_FormSubmissions_CaseId",
                table: "FormSubmissions",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalShares_CaseId",
                table: "ExternalShares",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalShares_SharedById",
                table: "ExternalShares",
                column: "SharedById");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_UserId",
                table: "EmailTemplates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DynamicForms_UserId",
                table: "DynamicForms",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSignatures_CaseId",
                table: "DocumentSignatures",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSignatures_UserId",
                table: "DocumentSignatures",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientOnboardingRequests_CreatedCaseId",
                table: "ClientOnboardingRequests",
                column: "CreatedCaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientOnboardingRequests_TemplateId",
                table: "ClientOnboardingRequests",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientIntakeSubmissions_CaseId",
                table: "ClientIntakeSubmissions",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientIntakeSubmissions_ReviewedById",
                table: "ClientIntakeSubmissions",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_CaseTasks_AssignedToId",
                table: "CaseTasks",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseTasks_CompletedById",
                table: "CaseTasks",
                column: "CompletedById");

            migrationBuilder.CreateIndex(
                name: "IX_CaseShares_SharedById",
                table: "CaseShares",
                column: "SharedById");

            migrationBuilder.CreateIndex(
                name: "IX_CaseEvents_EventId",
                table: "CaseEvents",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseDocuments_ParentDocumentId",
                table: "CaseDocuments",
                column: "ParentDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseDocuments_UploadedById",
                table: "CaseDocuments",
                column: "UploadedById");

            migrationBuilder.CreateIndex(
                name: "IX_CaseComments_CaseId",
                table: "CaseComments",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseComments_ParentCommentId",
                table: "CaseComments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseComments_UserId",
                table: "CaseComments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseCollaborators_AddedByUserId",
                table: "CaseCollaborators",
                column: "AddedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseCollaborators_CaseId",
                table: "CaseCollaborators",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseCollaborators_UserId",
                table: "CaseCollaborators",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseActivities_CaseId",
                table: "CaseActivities",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseActivities_UserId",
                table: "CaseActivities",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Answers_QuestionId",
                table: "Answers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_AdvancedTemplates_UserId",
                table: "AdvancedTemplates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationTokens_Token",
                table: "EmailVerificationTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationTokens_UserId",
                table: "EmailVerificationTokens",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AdvancedTemplates_Users_UserId",
                table: "AdvancedTemplates",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Answers_QuestionnaireResponses_ResponseId",
                table: "Answers",
                column: "ResponseId",
                principalTable: "QuestionnaireResponses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Answers_Questions_QuestionId",
                table: "Answers",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_Users_UserId",
                table: "AuditLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Automations_Users_UserId",
                table: "Automations",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseActivities_Cases_CaseId",
                table: "CaseActivities",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseActivities_Users_UserId",
                table: "CaseActivities",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseCollaborators_Cases_CaseId",
                table: "CaseCollaborators",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseCollaborators_Users_AddedByUserId",
                table: "CaseCollaborators",
                column: "AddedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseCollaborators_Users_UserId",
                table: "CaseCollaborators",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseComments_CaseComments_ParentCommentId",
                table: "CaseComments",
                column: "ParentCommentId",
                principalTable: "CaseComments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CaseComments_Cases_CaseId",
                table: "CaseComments",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseComments_Users_UserId",
                table: "CaseComments",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseDocuments_CaseDocuments_ParentDocumentId",
                table: "CaseDocuments",
                column: "ParentDocumentId",
                principalTable: "CaseDocuments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CaseDocuments_Cases_CaseId",
                table: "CaseDocuments",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseDocuments_Users_UploadedById",
                table: "CaseDocuments",
                column: "UploadedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CaseEvents_Events_EventId",
                table: "CaseEvents",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Cases_Users_AssignedToUserId",
                table: "Cases",
                column: "AssignedToUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Cases_Users_UserId",
                table: "Cases",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseShares_Cases_CaseId",
                table: "CaseShares",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseShares_Users_SharedById",
                table: "CaseShares",
                column: "SharedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CaseTasks_Cases_CaseId",
                table: "CaseTasks",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseTasks_Users_AssignedToId",
                table: "CaseTasks",
                column: "AssignedToId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CaseTasks_Users_CompletedById",
                table: "CaseTasks",
                column: "CompletedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ClientIntakeForms_Users_UserId",
                table: "ClientIntakeForms",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientIntakeSubmissions_Cases_CaseId",
                table: "ClientIntakeSubmissions",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ClientIntakeSubmissions_ClientIntakeForms_FormId",
                table: "ClientIntakeSubmissions",
                column: "FormId",
                principalTable: "ClientIntakeForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientIntakeSubmissions_Users_ReviewedById",
                table: "ClientIntakeSubmissions",
                column: "ReviewedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ClientOnboardingRequests_Cases_CreatedCaseId",
                table: "ClientOnboardingRequests",
                column: "CreatedCaseId",
                principalTable: "Cases",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ClientOnboardingRequests_ClientOnboardingTemplates_TemplateId",
                table: "ClientOnboardingRequests",
                column: "TemplateId",
                principalTable: "ClientOnboardingTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientOnboardingRequests_Users_OwnerUserId",
                table: "ClientOnboardingRequests",
                column: "OwnerUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientOnboardingTemplates_Users_UserId",
                table: "ClientOnboardingTemplates",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Clients_Users_UserId",
                table: "Clients",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomForms_Users_UserId",
                table: "CustomForms",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentSignatures_Cases_CaseId",
                table: "DocumentSignatures",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentSignatures_Users_UserId",
                table: "DocumentSignatures",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DynamicForms_Users_UserId",
                table: "DynamicForms",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_EmailTemplates_Users_UserId",
                table: "EmailTemplates",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ExternalShares_Cases_CaseId",
                table: "ExternalShares",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ExternalShares_Users_SharedById",
                table: "ExternalShares",
                column: "SharedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FormSubmissions_Cases_CaseId",
                table: "FormSubmissions",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FormSubmissions_CustomForms_FormId",
                table: "FormSubmissions",
                column: "FormId",
                principalTable: "CustomForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Integrations_Users_UserId",
                table: "Integrations",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceItems_Invoices_InvoiceId",
                table: "InvoiceItems",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceItems_TimeEntries_TimeEntryId",
                table: "InvoiceItems",
                column: "TimeEntryId",
                principalTable: "TimeEntries",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Events_EventId",
                table: "Notifications",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Users_UserId",
                table: "Notifications",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PasswordResetTokens_Users_UserId",
                table: "PasswordResetTokens",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PendingActions_Events_EventId",
                table: "PendingActions",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PendingActions_Users_UserId",
                table: "PendingActions",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PhoneCalls_Cases_CaseId",
                table: "PhoneCalls",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PhoneCalls_Clients_ClientId",
                table: "PhoneCalls",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PhoneCalls_Users_HandledById",
                table: "PhoneCalls",
                column: "HandledById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionnaireResponses_Cases_CaseId",
                table: "QuestionnaireResponses",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionnaireResponses_Questionnaires_QuestionnaireId",
                table: "QuestionnaireResponses",
                column: "QuestionnaireId",
                principalTable: "Questionnaires",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionnaireResponses_Users_UserId",
                table: "QuestionnaireResponses",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RefreshTokens_Users_UserId",
                table: "RefreshTokens",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Users_UserId",
                table: "Reports",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RoleNotifications_Cases_CaseId",
                table: "RoleNotifications",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RoleNotifications_Users_UserId",
                table: "RoleNotifications",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SatisfactionSurveys_Cases_CaseId",
                table: "SatisfactionSurveys",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SatisfactionSurveys_Clients_ClientId",
                table: "SatisfactionSurveys",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SatisfactionSurveys_Users_AssignedLawyerId",
                table: "SatisfactionSurveys",
                column: "AssignedLawyerId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SecretVaults_Users_UserId",
                table: "SecretVaults",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SharedWorkspaces_Cases_CaseId",
                table: "SharedWorkspaces",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Sources_Users_UserId",
                table: "Sources",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskChecklistItems_CaseTasks_TaskId",
                table: "TaskChecklistItems",
                column: "TaskId",
                principalTable: "CaseTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskDependencies_CaseTasks_DependsOnTaskId",
                table: "TaskDependencies",
                column: "DependsOnTaskId",
                principalTable: "CaseTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskDependencies_CaseTasks_TaskId",
                table: "TaskDependencies",
                column: "TaskId",
                principalTable: "CaseTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TeamMessages_Cases_CaseId",
                table: "TeamMessages",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TeamMessages_Users_FromUserId",
                table: "TeamMessages",
                column: "FromUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TeamMessages_Users_ToUserId",
                table: "TeamMessages",
                column: "ToUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserAutomationSettings_Users_UserId",
                table: "UserAutomationSettings",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Tenants_TenantId",
                table: "Users",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WebhookLogs_Webhooks_WebhookId",
                table: "WebhookLogs",
                column: "WebhookId",
                principalTable: "Webhooks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Webhooks_Users_UserId",
                table: "Webhooks",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkspaceActivities_SharedWorkspaces_WorkspaceId",
                table: "WorkspaceActivities",
                column: "WorkspaceId",
                principalTable: "SharedWorkspaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkspaceDocuments_SharedWorkspaces_WorkspaceId",
                table: "WorkspaceDocuments",
                column: "WorkspaceId",
                principalTable: "SharedWorkspaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AdvancedTemplates_Users_UserId",
                table: "AdvancedTemplates");

            migrationBuilder.DropForeignKey(
                name: "FK_Answers_QuestionnaireResponses_ResponseId",
                table: "Answers");

            migrationBuilder.DropForeignKey(
                name: "FK_Answers_Questions_QuestionId",
                table: "Answers");

            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Users_UserId",
                table: "AuditLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_Automations_Users_UserId",
                table: "Automations");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseActivities_Cases_CaseId",
                table: "CaseActivities");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseActivities_Users_UserId",
                table: "CaseActivities");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseCollaborators_Cases_CaseId",
                table: "CaseCollaborators");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseCollaborators_Users_AddedByUserId",
                table: "CaseCollaborators");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseCollaborators_Users_UserId",
                table: "CaseCollaborators");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseComments_CaseComments_ParentCommentId",
                table: "CaseComments");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseComments_Cases_CaseId",
                table: "CaseComments");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseComments_Users_UserId",
                table: "CaseComments");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseDocuments_CaseDocuments_ParentDocumentId",
                table: "CaseDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseDocuments_Cases_CaseId",
                table: "CaseDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseDocuments_Users_UploadedById",
                table: "CaseDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseEvents_Events_EventId",
                table: "CaseEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_Cases_Users_AssignedToUserId",
                table: "Cases");

            migrationBuilder.DropForeignKey(
                name: "FK_Cases_Users_UserId",
                table: "Cases");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseShares_Cases_CaseId",
                table: "CaseShares");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseShares_Users_SharedById",
                table: "CaseShares");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseTasks_Cases_CaseId",
                table: "CaseTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseTasks_Users_AssignedToId",
                table: "CaseTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseTasks_Users_CompletedById",
                table: "CaseTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientIntakeForms_Users_UserId",
                table: "ClientIntakeForms");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientIntakeSubmissions_Cases_CaseId",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientIntakeSubmissions_ClientIntakeForms_FormId",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientIntakeSubmissions_Users_ReviewedById",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientOnboardingRequests_Cases_CreatedCaseId",
                table: "ClientOnboardingRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientOnboardingRequests_ClientOnboardingTemplates_TemplateId",
                table: "ClientOnboardingRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientOnboardingRequests_Users_OwnerUserId",
                table: "ClientOnboardingRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientOnboardingTemplates_Users_UserId",
                table: "ClientOnboardingTemplates");

            migrationBuilder.DropForeignKey(
                name: "FK_Clients_Users_UserId",
                table: "Clients");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomForms_Users_UserId",
                table: "CustomForms");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentSignatures_Cases_CaseId",
                table: "DocumentSignatures");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentSignatures_Users_UserId",
                table: "DocumentSignatures");

            migrationBuilder.DropForeignKey(
                name: "FK_DynamicForms_Users_UserId",
                table: "DynamicForms");

            migrationBuilder.DropForeignKey(
                name: "FK_EmailTemplates_Users_UserId",
                table: "EmailTemplates");

            migrationBuilder.DropForeignKey(
                name: "FK_ExternalShares_Cases_CaseId",
                table: "ExternalShares");

            migrationBuilder.DropForeignKey(
                name: "FK_ExternalShares_Users_SharedById",
                table: "ExternalShares");

            migrationBuilder.DropForeignKey(
                name: "FK_FormSubmissions_Cases_CaseId",
                table: "FormSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_FormSubmissions_CustomForms_FormId",
                table: "FormSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_Integrations_Users_UserId",
                table: "Integrations");

            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceItems_Invoices_InvoiceId",
                table: "InvoiceItems");

            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceItems_TimeEntries_TimeEntryId",
                table: "InvoiceItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Events_EventId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Users_UserId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_PasswordResetTokens_Users_UserId",
                table: "PasswordResetTokens");

            migrationBuilder.DropForeignKey(
                name: "FK_PendingActions_Events_EventId",
                table: "PendingActions");

            migrationBuilder.DropForeignKey(
                name: "FK_PendingActions_Users_UserId",
                table: "PendingActions");

            migrationBuilder.DropForeignKey(
                name: "FK_PhoneCalls_Cases_CaseId",
                table: "PhoneCalls");

            migrationBuilder.DropForeignKey(
                name: "FK_PhoneCalls_Clients_ClientId",
                table: "PhoneCalls");

            migrationBuilder.DropForeignKey(
                name: "FK_PhoneCalls_Users_HandledById",
                table: "PhoneCalls");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionnaireResponses_Cases_CaseId",
                table: "QuestionnaireResponses");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionnaireResponses_Questionnaires_QuestionnaireId",
                table: "QuestionnaireResponses");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionnaireResponses_Users_UserId",
                table: "QuestionnaireResponses");

            migrationBuilder.DropForeignKey(
                name: "FK_RefreshTokens_Users_UserId",
                table: "RefreshTokens");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Users_UserId",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_RoleNotifications_Cases_CaseId",
                table: "RoleNotifications");

            migrationBuilder.DropForeignKey(
                name: "FK_RoleNotifications_Users_UserId",
                table: "RoleNotifications");

            migrationBuilder.DropForeignKey(
                name: "FK_SatisfactionSurveys_Cases_CaseId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropForeignKey(
                name: "FK_SatisfactionSurveys_Clients_ClientId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropForeignKey(
                name: "FK_SatisfactionSurveys_Users_AssignedLawyerId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropForeignKey(
                name: "FK_SecretVaults_Users_UserId",
                table: "SecretVaults");

            migrationBuilder.DropForeignKey(
                name: "FK_SharedWorkspaces_Cases_CaseId",
                table: "SharedWorkspaces");

            migrationBuilder.DropForeignKey(
                name: "FK_Sources_Users_UserId",
                table: "Sources");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskChecklistItems_CaseTasks_TaskId",
                table: "TaskChecklistItems");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskDependencies_CaseTasks_DependsOnTaskId",
                table: "TaskDependencies");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskDependencies_CaseTasks_TaskId",
                table: "TaskDependencies");

            migrationBuilder.DropForeignKey(
                name: "FK_TeamMessages_Cases_CaseId",
                table: "TeamMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_TeamMessages_Users_FromUserId",
                table: "TeamMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_TeamMessages_Users_ToUserId",
                table: "TeamMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_UserAutomationSettings_Users_UserId",
                table: "UserAutomationSettings");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Tenants_TenantId",
                table: "Users");

            migrationBuilder.DropForeignKey(
                name: "FK_WebhookLogs_Webhooks_WebhookId",
                table: "WebhookLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_Webhooks_Users_UserId",
                table: "Webhooks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkspaceActivities_SharedWorkspaces_WorkspaceId",
                table: "WorkspaceActivities");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkspaceDocuments_SharedWorkspaces_WorkspaceId",
                table: "WorkspaceDocuments");

            migrationBuilder.DropTable(
                name: "EmailVerificationTokens");

            migrationBuilder.DropIndex(
                name: "IX_Webhooks_UserId",
                table: "Webhooks");

            migrationBuilder.DropIndex(
                name: "IX_WebhookLogs_WebhookId",
                table: "WebhookLogs");

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_UserEmailConfigs_UserId",
                table: "UserEmailConfigs");

            migrationBuilder.DropIndex(
                name: "IX_UserAutomationSettings_UserId",
                table: "UserAutomationSettings");

            migrationBuilder.DropIndex(
                name: "IX_TeamMessages_CaseId",
                table: "TeamMessages");

            migrationBuilder.DropIndex(
                name: "IX_TeamMessages_FromUserId",
                table: "TeamMessages");

            migrationBuilder.DropIndex(
                name: "IX_TaskDependencies_DependsOnTaskId",
                table: "TaskDependencies");

            migrationBuilder.DropIndex(
                name: "IX_TaskDependencies_TaskId",
                table: "TaskDependencies");

            migrationBuilder.DropIndex(
                name: "IX_TaskChecklistItems_TaskId",
                table: "TaskChecklistItems");

            migrationBuilder.DropIndex(
                name: "IX_Sources_UserId",
                table: "Sources");

            migrationBuilder.DropIndex(
                name: "IX_SatisfactionSurveys_AssignedLawyerId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropIndex(
                name: "IX_SatisfactionSurveys_CaseId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropIndex(
                name: "IX_SatisfactionSurveys_ClientId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropIndex(
                name: "IX_RoleNotifications_CaseId",
                table: "RoleNotifications");

            migrationBuilder.DropIndex(
                name: "IX_QuestionnaireResponses_QuestionnaireId",
                table: "QuestionnaireResponses");

            migrationBuilder.DropIndex(
                name: "IX_QuestionnaireResponses_UserId",
                table: "QuestionnaireResponses");

            migrationBuilder.DropIndex(
                name: "IX_PhoneCalls_ClientId",
                table: "PhoneCalls");

            migrationBuilder.DropIndex(
                name: "IX_PhoneCalls_HandledById",
                table: "PhoneCalls");

            migrationBuilder.DropIndex(
                name: "IX_PendingActions_EventId",
                table: "PendingActions");

            migrationBuilder.DropIndex(
                name: "IX_PendingActions_UserId",
                table: "PendingActions");

            migrationBuilder.DropIndex(
                name: "IX_PasswordResetTokens_UserId",
                table: "PasswordResetTokens");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_EventId",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_InvoiceItems_InvoiceId",
                table: "InvoiceItems");

            migrationBuilder.DropIndex(
                name: "IX_InvoiceItems_TimeEntryId",
                table: "InvoiceItems");

            migrationBuilder.DropIndex(
                name: "IX_FormSubmissions_CaseId",
                table: "FormSubmissions");

            migrationBuilder.DropIndex(
                name: "IX_ExternalShares_CaseId",
                table: "ExternalShares");

            migrationBuilder.DropIndex(
                name: "IX_ExternalShares_SharedById",
                table: "ExternalShares");

            migrationBuilder.DropIndex(
                name: "IX_EmailTemplates_UserId",
                table: "EmailTemplates");

            migrationBuilder.DropIndex(
                name: "IX_DynamicForms_UserId",
                table: "DynamicForms");

            migrationBuilder.DropIndex(
                name: "IX_DocumentSignatures_CaseId",
                table: "DocumentSignatures");

            migrationBuilder.DropIndex(
                name: "IX_DocumentSignatures_UserId",
                table: "DocumentSignatures");

            migrationBuilder.DropIndex(
                name: "IX_ClientOnboardingRequests_CreatedCaseId",
                table: "ClientOnboardingRequests");

            migrationBuilder.DropIndex(
                name: "IX_ClientOnboardingRequests_TemplateId",
                table: "ClientOnboardingRequests");

            migrationBuilder.DropIndex(
                name: "IX_ClientIntakeSubmissions_CaseId",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropIndex(
                name: "IX_ClientIntakeSubmissions_ReviewedById",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropIndex(
                name: "IX_CaseTasks_AssignedToId",
                table: "CaseTasks");

            migrationBuilder.DropIndex(
                name: "IX_CaseTasks_CompletedById",
                table: "CaseTasks");

            migrationBuilder.DropIndex(
                name: "IX_CaseShares_SharedById",
                table: "CaseShares");

            migrationBuilder.DropIndex(
                name: "IX_CaseEvents_EventId",
                table: "CaseEvents");

            migrationBuilder.DropIndex(
                name: "IX_CaseDocuments_ParentDocumentId",
                table: "CaseDocuments");

            migrationBuilder.DropIndex(
                name: "IX_CaseDocuments_UploadedById",
                table: "CaseDocuments");

            migrationBuilder.DropIndex(
                name: "IX_CaseComments_CaseId",
                table: "CaseComments");

            migrationBuilder.DropIndex(
                name: "IX_CaseComments_ParentCommentId",
                table: "CaseComments");

            migrationBuilder.DropIndex(
                name: "IX_CaseComments_UserId",
                table: "CaseComments");

            migrationBuilder.DropIndex(
                name: "IX_CaseCollaborators_AddedByUserId",
                table: "CaseCollaborators");

            migrationBuilder.DropIndex(
                name: "IX_CaseCollaborators_CaseId",
                table: "CaseCollaborators");

            migrationBuilder.DropIndex(
                name: "IX_CaseCollaborators_UserId",
                table: "CaseCollaborators");

            migrationBuilder.DropIndex(
                name: "IX_CaseActivities_CaseId",
                table: "CaseActivities");

            migrationBuilder.DropIndex(
                name: "IX_CaseActivities_UserId",
                table: "CaseActivities");

            migrationBuilder.DropIndex(
                name: "IX_Answers_QuestionId",
                table: "Answers");

            migrationBuilder.DropIndex(
                name: "IX_AdvancedTemplates_UserId",
                table: "AdvancedTemplates");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "WorkspaceDocuments");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "WorkspaceDocuments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "WorkspaceDocuments");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "WorkspaceDocuments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "WorkspaceDocuments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "WorkspaceDocuments");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "WorkspaceDocuments");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Webhooks");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Webhooks");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Webhooks");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "UserInvitations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "UserInvitations");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "UserInvitations");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "SharedWorkspaces");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "SharedWorkspaces");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "SharedWorkspaces");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "SharedWorkspaces");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "SharedWorkspaces");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "SharedWorkspaces");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "SharedWorkspaces");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "SatisfactionSurveys");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "SatisfactionSurveys");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "SatisfactionSurveys");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "SatisfactionSurveys");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "SatisfactionSurveys");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "RoleNotifications");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "RoleNotifications");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "RoleNotifications");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "RoleNotifications");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "RoleNotifications");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "RoleNotifications");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "RoleNotifications");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Questionnaires");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Questionnaires");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Questionnaires");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "PhoneCalls");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "PhoneCalls");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "PhoneCalls");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "PhoneCalls");

            migrationBuilder.DropColumn(
                name: "HandledById",
                table: "PhoneCalls");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PhoneCalls");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "PhoneCalls");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PhoneCalls");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "PhoneCalls");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "PendingActions");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "PendingActions");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "PendingActions");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PendingActions");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "PendingActions");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PendingActions");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "PendingActions");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Integrations");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Integrations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Integrations");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Integrations");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ExternalShares");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "ExternalShares");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "ExternalShares");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ExternalShares");

            migrationBuilder.DropColumn(
                name: "SharedById",
                table: "ExternalShares");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "ExternalShares");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ExternalShares");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "ExternalShares");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "EmailTemplates");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "EmailTemplates");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "EmailTemplates");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "EmailTemplates");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "EmailTemplates");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "EmailTemplates");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "EmailTemplates");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "DynamicForms");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "DynamicForms");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "DynamicForms");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "DynamicForms");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "DynamicForms");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "DynamicForms");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "DocumentSignatures");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "DocumentSignatures");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "DocumentSignatures");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "DocumentSignatures");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "DocumentSignatures");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "DocumentSignatures");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "DocumentSignatures");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "CustomForms");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "CustomForms");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "CustomForms");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CustomForms");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "CustomForms");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "CustomForms");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "CustomForms");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ClientOnboardingTemplates");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "ClientOnboardingTemplates");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ClientOnboardingRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ClientOnboardingRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "ClientOnboardingRequests");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropColumn(
                name: "ReviewedById",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "ClientIntakeSubmissions");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ClientIntakeForms");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "ClientIntakeForms");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "ClientIntakeForms");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ClientIntakeForms");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "ClientIntakeForms");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "ClientIntakeForms");

            migrationBuilder.DropColumn(
                name: "AssignedToId",
                table: "CaseTasks");

            migrationBuilder.DropColumn(
                name: "CompletedById",
                table: "CaseTasks");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "CaseTasks");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "CaseTasks");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "CaseTasks");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CaseTasks");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "CaseTasks");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "CaseTasks");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "CaseTasks");

            migrationBuilder.DropColumn(
                name: "SharedById",
                table: "CaseShares");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "CaseNotes");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "CaseNotes");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "CaseNotes");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CaseNotes");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "CaseNotes");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "CaseNotes");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "UploadedById",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "CaseComments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "CaseComments");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "CaseComments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "CaseComments");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "CaseComments");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Automations");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Automations");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "Automations");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Automations");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Automations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Automations");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Automations");

            migrationBuilder.DropColumn(
                name: "EntityId",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "EntityType",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "AdvancedTemplates");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "AdvancedTemplates");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "AdvancedTemplates");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "AdvancedTemplates");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "AdvancedTemplates");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "AdvancedTemplates");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "ClientOnboardingTemplates",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "QuestionnaireResponseId",
                table: "Answers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserEmailConfigs_UserId",
                table: "UserEmailConfigs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Answers_QuestionnaireResponseId",
                table: "Answers",
                column: "QuestionnaireResponseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Answers_QuestionnaireResponses_QuestionnaireResponseId",
                table: "Answers",
                column: "QuestionnaireResponseId",
                principalTable: "QuestionnaireResponses",
                principalColumn: "Id");
        }
    }
}
