using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoLib.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixCaseNoteMentionsType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPrivate",
                table: "CaseNotes");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "CaseNotes",
                newName: "Visibility");

            migrationBuilder.AlterColumn<string>(
                name: "Mentions",
                table: "CaseNotes",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddColumn<Guid>(
                name: "AuthorId",
                table: "CaseNotes",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_CaseNotes_AuthorId",
                table: "CaseNotes",
                column: "AuthorId");

            migrationBuilder.AddForeignKey(
                name: "FK_CaseNotes_Cases_CaseId",
                table: "CaseNotes",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CaseNotes_Users_AuthorId",
                table: "CaseNotes",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CaseNotes_Cases_CaseId",
                table: "CaseNotes");

            migrationBuilder.DropForeignKey(
                name: "FK_CaseNotes_Users_AuthorId",
                table: "CaseNotes");

            migrationBuilder.DropIndex(
                name: "IX_CaseNotes_AuthorId",
                table: "CaseNotes");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "CaseNotes");

            migrationBuilder.RenameColumn(
                name: "Visibility",
                table: "CaseNotes",
                newName: "UserId");

            migrationBuilder.AlterColumn<string>(
                name: "Mentions",
                table: "CaseNotes",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPrivate",
                table: "CaseNotes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }
    }
}
