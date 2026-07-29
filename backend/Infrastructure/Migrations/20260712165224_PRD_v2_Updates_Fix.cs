using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace techretail_api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PRD_v2_Updates_Fix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CorrelationId",
                table: "SystemLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SeverityLevel",
                table: "SystemLogs",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CorrelationId",
                table: "SystemLogs");

            migrationBuilder.DropColumn(
                name: "SeverityLevel",
                table: "SystemLogs");
        }
    }
}
