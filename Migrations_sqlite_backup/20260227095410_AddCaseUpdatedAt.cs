using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseUpdatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Cases",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Cases");
        }
    }
}
