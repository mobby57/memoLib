using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class BackfillOwnershipForLegacyData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
                        migrationBuilder.Sql(@"
UPDATE Cases
SET UserId = (
        SELECT Id
        FROM Users
        ORDER BY CreatedAt ASC
        LIMIT 1
)
WHERE UserId IS NULL
    AND EXISTS (SELECT 1 FROM Users);

UPDATE Clients
SET UserId = (
        SELECT Id
        FROM Users
        ORDER BY CreatedAt ASC
        LIMIT 1
)
WHERE UserId IS NULL
    AND EXISTS (SELECT 1 FROM Users);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
