using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClientIdToCase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ClientId",
                table: "Cases",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Cases");
        }
    }
}
