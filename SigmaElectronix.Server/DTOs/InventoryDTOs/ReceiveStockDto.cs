using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs.InventoryDTOs
{
    public class ReceiveStockDto
    {
        [Required]
        public int StoreId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Количество должно быть больше 0")]
        public int Quantity { get; set; }

        public string? ReferenceId { get; set; } // Например, номер накладной "ТТН-12345"
    }
}