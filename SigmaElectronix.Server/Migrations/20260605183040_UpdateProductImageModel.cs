using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SigmaElectronix.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProductImageModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "ProductImages",
                newName: "Url");

            migrationBuilder.RenameColumn(
                name: "DisplayOrder",
                table: "ProductImages",
                newName: "SortOrder");

            migrationBuilder.AddColumn<string>(
                name: "AltText",
                table: "ProductImages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AltText",
                table: "ProductImages");

            migrationBuilder.RenameColumn(
                name: "Url",
                table: "ProductImages",
                newName: "ImageUrl");

            migrationBuilder.RenameColumn(
                name: "SortOrder",
                table: "ProductImages",
                newName: "DisplayOrder");
        }
    }
}
