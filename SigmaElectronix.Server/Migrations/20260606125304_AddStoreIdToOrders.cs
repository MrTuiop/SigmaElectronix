using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SigmaElectronix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreIdToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StoreId",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StoreId",
                table: "OrderItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_StoreId",
                table: "Orders",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_StoreId",
                table: "OrderItems",
                column: "StoreId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Stores_StoreId",
                table: "OrderItems",
                column: "StoreId",
                principalTable: "Stores",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Stores_StoreId",
                table: "Orders",
                column: "StoreId",
                principalTable: "Stores",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Stores_StoreId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Stores_StoreId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_StoreId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_StoreId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "StoreId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "StoreId",
                table: "OrderItems");
        }
    }
}
