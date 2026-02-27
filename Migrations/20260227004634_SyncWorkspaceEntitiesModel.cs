using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncWorkspaceEntitiesModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvent_Cases_CaseId",
                table: "CalendarEvent");

            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvent_Users_UserId",
                table: "CalendarEvent");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntry_Cases_CaseId",
                table: "TimeEntry");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntry_Users_UserId",
                table: "TimeEntry");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TimeEntry",
                table: "TimeEntry");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CalendarEvent",
                table: "CalendarEvent");

            migrationBuilder.RenameTable(
                name: "TimeEntry",
                newName: "TimeEntries");

            migrationBuilder.RenameTable(
                name: "CalendarEvent",
                newName: "CalendarEvents");

            migrationBuilder.RenameIndex(
                name: "IX_TimeEntry_UserId",
                table: "TimeEntries",
                newName: "IX_TimeEntries_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_TimeEntry_CaseId_UserId_StartTime",
                table: "TimeEntries",
                newName: "IX_TimeEntries_CaseId_UserId_StartTime");

            migrationBuilder.RenameIndex(
                name: "IX_CalendarEvent_UserId_StartTime",
                table: "CalendarEvents",
                newName: "IX_CalendarEvents_UserId_StartTime");

            migrationBuilder.RenameIndex(
                name: "IX_CalendarEvent_CaseId",
                table: "CalendarEvents",
                newName: "IX_CalendarEvents_CaseId");

            migrationBuilder.AddColumn<string>(
                name: "RelatedEntityId",
                table: "Notifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Data",
                table: "FormSubmissions",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Clients",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "TimeEntries",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "TimeEntries",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "InvoiceId",
                table: "TimeEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsInvoiced",
                table: "TimeEntries",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "CalendarEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "MeetingLink",
                table: "CalendarEvents",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_TimeEntries",
                table: "TimeEntries",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CalendarEvents",
                table: "CalendarEvents",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "AdvancedTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    Variables = table.Column<string>(type: "TEXT", nullable: false),
                    Conditions = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdvancedTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CaseActivities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserName = table.Column<string>(type: "TEXT", nullable: false),
                    ActivityType = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    OldValue = table.Column<string>(type: "TEXT", nullable: true),
                    NewValue = table.Column<string>(type: "TEXT", nullable: true),
                    Metadata = table.Column<string>(type: "TEXT", nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseActivities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CaseCollaborators",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    CanEdit = table.Column<bool>(type: "INTEGER", nullable: false),
                    CanComment = table.Column<bool>(type: "INTEGER", nullable: false),
                    CanViewDocuments = table.Column<bool>(type: "INTEGER", nullable: false),
                    CanUploadDocuments = table.Column<bool>(type: "INTEGER", nullable: false),
                    CanInviteOthers = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReceiveNotifications = table.Column<bool>(type: "INTEGER", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AddedByUserId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseCollaborators", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CaseComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    ParentCommentId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Mentions = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EditedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseComments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DocumentSignatures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    DocumentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DocumentName = table.Column<string>(type: "TEXT", nullable: false),
                    DocumentUrl = table.Column<string>(type: "TEXT", nullable: false),
                    SignatureRequests = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IpAddress = table.Column<string>(type: "TEXT", nullable: true),
                    AuditTrail = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentSignatures", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DynamicForms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Fields = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPublic = table.Column<bool>(type: "INTEGER", nullable: false),
                    PublicUrl = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DynamicForms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InvoiceItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    InvoiceId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Quantity = table.Column<decimal>(type: "TEXT", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    TimeEntryId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ClientId = table.Column<Guid>(type: "TEXT", nullable: false),
                    InvoiceNumber = table.Column<string>(type: "TEXT", nullable: false),
                    IssueDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DueDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Subtotal = table.Column<decimal>(type: "TEXT", nullable: false),
                    TaxRate = table.Column<decimal>(type: "TEXT", nullable: false),
                    Tax = table.Column<decimal>(type: "TEXT", nullable: false),
                    Total = table.Column<decimal>(type: "TEXT", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    TaxAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    SentAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_Cases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "Cases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Invoices_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PendingActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventType = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    From = table.Column<string>(type: "TEXT", nullable: false),
                    FromName = table.Column<string>(type: "TEXT", nullable: true),
                    Subject = table.Column<string>(type: "TEXT", nullable: false),
                    Preview = table.Column<string>(type: "TEXT", nullable: false),
                    SuggestCreateCase = table.Column<bool>(type: "INTEGER", nullable: false),
                    SuggestedCaseTitle = table.Column<string>(type: "TEXT", nullable: true),
                    SuggestCreateClient = table.Column<bool>(type: "INTEGER", nullable: false),
                    SuggestedClientName = table.Column<string>(type: "TEXT", nullable: true),
                    SuggestedClientPhone = table.Column<string>(type: "TEXT", nullable: true),
                    SuggestedClientEmail = table.Column<string>(type: "TEXT", nullable: true),
                    SuggestLinkToExistingCase = table.Column<Guid>(type: "TEXT", nullable: true),
                    SuggestLinkToExistingClient = table.Column<Guid>(type: "TEXT", nullable: true),
                    UserCreateCase = table.Column<bool>(type: "INTEGER", nullable: false),
                    UserCaseTitle = table.Column<string>(type: "TEXT", nullable: true),
                    UserCreateClient = table.Column<bool>(type: "INTEGER", nullable: false),
                    UserClientName = table.Column<string>(type: "TEXT", nullable: true),
                    UserLinkToCaseId = table.Column<Guid>(type: "TEXT", nullable: true),
                    UserLinkToClientId = table.Column<Guid>(type: "TEXT", nullable: true),
                    UserAssignToUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    UserPriority = table.Column<int>(type: "INTEGER", nullable: true),
                    UserTags = table.Column<string>(type: "TEXT", nullable: true),
                    UserNotes = table.Column<string>(type: "TEXT", nullable: true),
                    UserMarkAsSpam = table.Column<bool>(type: "INTEGER", nullable: false),
                    UserArchive = table.Column<bool>(type: "INTEGER", nullable: false),
                    UserIgnore = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingActions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TaskChecklistItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaskId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    IsCompleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskChecklistItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TaskDependencies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaskId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DependsOnTaskId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskDependencies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserAutomationSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AutoMonitorEmails = table.Column<bool>(type: "INTEGER", nullable: false),
                    EmailCheckIntervalSeconds = table.Column<int>(type: "INTEGER", nullable: false),
                    AutoCreateCaseFromEmail = table.Column<bool>(type: "INTEGER", nullable: false),
                    AutoCreateClientFromEmail = table.Column<bool>(type: "INTEGER", nullable: false),
                    AutoExtractClientInfo = table.Column<bool>(type: "INTEGER", nullable: false),
                    AutoAssignCases = table.Column<bool>(type: "INTEGER", nullable: false),
                    DefaultAssignedUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    AutoSetPriority = table.Column<bool>(type: "INTEGER", nullable: false),
                    DefaultPriority = table.Column<int>(type: "INTEGER", nullable: true),
                    AutoAddTags = table.Column<bool>(type: "INTEGER", nullable: false),
                    DefaultTags = table.Column<string>(type: "TEXT", nullable: true),
                    EnableNotifications = table.Column<bool>(type: "INTEGER", nullable: false),
                    NotifyNewEmail = table.Column<bool>(type: "INTEGER", nullable: false),
                    NotifyCaseAssigned = table.Column<bool>(type: "INTEGER", nullable: false),
                    NotifyHighPriority = table.Column<bool>(type: "INTEGER", nullable: false),
                    NotifyDeadlineApproaching = table.Column<bool>(type: "INTEGER", nullable: false),
                    AutoForwardToSignal = table.Column<bool>(type: "INTEGER", nullable: false),
                    SignalPhoneNumber = table.Column<string>(type: "TEXT", nullable: true),
                    AutoReplyEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AutoReplyMessage = table.Column<string>(type: "TEXT", nullable: true),
                    AutoMergeDuplicateCases = table.Column<bool>(type: "INTEGER", nullable: false),
                    AutoMergeDuplicateClients = table.Column<bool>(type: "INTEGER", nullable: false),
                    EnableSemanticSearch = table.Column<bool>(type: "INTEGER", nullable: false),
                    EnableEmbeddings = table.Column<bool>(type: "INTEGER", nullable: false),
                    RequireApprovalForDelete = table.Column<bool>(type: "INTEGER", nullable: false),
                    RequireApprovalForExport = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAutomationSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WebhookLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WebhookId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Event = table.Column<string>(type: "TEXT", nullable: false),
                    Payload = table.Column<string>(type: "TEXT", nullable: false),
                    StatusCode = table.Column<int>(type: "INTEGER", nullable: false),
                    Response = table.Column<string>(type: "TEXT", nullable: true),
                    Success = table.Column<bool>(type: "INTEGER", nullable: false),
                    TriggeredAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebhookLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Webhooks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Url = table.Column<string>(type: "TEXT", nullable: false),
                    Event = table.Column<string>(type: "TEXT", nullable: false),
                    Secret = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastTriggeredAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TriggerCount = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Webhooks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SignatureRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    DocumentSignatureId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SignerName = table.Column<string>(type: "TEXT", nullable: false),
                    SignerEmail = table.Column<string>(type: "TEXT", nullable: false),
                    SignerPhone = table.Column<string>(type: "TEXT", nullable: true),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    SignatureData = table.Column<string>(type: "TEXT", nullable: true),
                    SignedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IpAddress = table.Column<string>(type: "TEXT", nullable: true),
                    Token = table.Column<string>(type: "TEXT", nullable: true),
                    TokenExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SignatureRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SignatureRequests_DocumentSignatures_DocumentSignatureId",
                        column: x => x.DocumentSignatureId,
                        principalTable: "DocumentSignatures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cases_ClientId",
                table: "Cases",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_InvoiceId",
                table: "TimeEntries",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CaseId",
                table: "Invoices",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ClientId",
                table: "Invoices",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_SignatureRequests_DocumentSignatureId",
                table: "SignatureRequests",
                column: "DocumentSignatureId");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_Cases_CaseId",
                table: "CalendarEvents",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_Users_UserId",
                table: "CalendarEvents",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseEvents_Cases_CaseId",
                table: "CaseEvents",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Cases_Clients_ClientId",
                table: "Cases",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Cases_CaseId",
                table: "TimeEntries",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Invoices_InvoiceId",
                table: "TimeEntries",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Users_UserId",
                table: "TimeEntries",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_Cases_CaseId",
                table: "CalendarEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_Users_UserId",
                table: "CalendarEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseEvents_Cases_CaseId",
                table: "CaseEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_Cases_Clients_ClientId",
                table: "Cases");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Cases_CaseId",
                table: "TimeEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Invoices_InvoiceId",
                table: "TimeEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Users_UserId",
                table: "TimeEntries");

            migrationBuilder.DropTable(
                name: "AdvancedTemplates");

            migrationBuilder.DropTable(
                name: "CaseActivities");

            migrationBuilder.DropTable(
                name: "CaseCollaborators");

            migrationBuilder.DropTable(
                name: "CaseComments");

            migrationBuilder.DropTable(
                name: "DynamicForms");

            migrationBuilder.DropTable(
                name: "InvoiceItems");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "PendingActions");

            migrationBuilder.DropTable(
                name: "SignatureRequests");

            migrationBuilder.DropTable(
                name: "TaskChecklistItems");

            migrationBuilder.DropTable(
                name: "TaskDependencies");

            migrationBuilder.DropTable(
                name: "UserAutomationSettings");

            migrationBuilder.DropTable(
                name: "WebhookLogs");

            migrationBuilder.DropTable(
                name: "Webhooks");

            migrationBuilder.DropTable(
                name: "DocumentSignatures");

            migrationBuilder.DropIndex(
                name: "IX_Cases_ClientId",
                table: "Cases");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TimeEntries",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_InvoiceId",
                table: "TimeEntries");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CalendarEvents",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "RelatedEntityId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Data",
                table: "FormSubmissions");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "Amount",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "IsInvoiced",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "MeetingLink",
                table: "CalendarEvents");

            migrationBuilder.RenameTable(
                name: "TimeEntries",
                newName: "TimeEntry");

            migrationBuilder.RenameTable(
                name: "CalendarEvents",
                newName: "CalendarEvent");

            migrationBuilder.RenameIndex(
                name: "IX_TimeEntries_UserId",
                table: "TimeEntry",
                newName: "IX_TimeEntry_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_TimeEntries_CaseId_UserId_StartTime",
                table: "TimeEntry",
                newName: "IX_TimeEntry_CaseId_UserId_StartTime");

            migrationBuilder.RenameIndex(
                name: "IX_CalendarEvents_UserId_StartTime",
                table: "CalendarEvent",
                newName: "IX_CalendarEvent_UserId_StartTime");

            migrationBuilder.RenameIndex(
                name: "IX_CalendarEvents_CaseId",
                table: "CalendarEvent",
                newName: "IX_CalendarEvent_CaseId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TimeEntry",
                table: "TimeEntry",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CalendarEvent",
                table: "CalendarEvent",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvent_Cases_CaseId",
                table: "CalendarEvent",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvent_Users_UserId",
                table: "CalendarEvent",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntry_Cases_CaseId",
                table: "TimeEntry",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntry_Users_UserId",
                table: "TimeEntry",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
