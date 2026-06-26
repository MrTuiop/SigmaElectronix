using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SigmaElectronix.Server.Migrations
{
    /// <inheritdoc />
    public partial class LinkUiTranslationsToLanguages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_UiTranslations_LanguageCode",
                table: "UiTranslations",
                column: "LanguageCode");

            migrationBuilder.AddForeignKey(
                name: "FK_UiTranslations_Languages_LanguageCode",
                table: "UiTranslations",
                column: "LanguageCode",
                principalTable: "Languages",
                principalColumn: "Code",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UiTranslations_Languages_LanguageCode",
                table: "UiTranslations");

            migrationBuilder.DropIndex(
                name: "IX_UiTranslations_LanguageCode",
                table: "UiTranslations");
        }
    }
}
