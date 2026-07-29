using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace techretail_api.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSystemLog_AddEntityIdIp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EntityId",
                table: "SystemLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "SystemLogs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EntityId",
                table: "SystemLogs");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "SystemLogs");
        }
    }
}
