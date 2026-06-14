using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs.InventoryDTOs
{
    public class TransferStockDto
    {
        [Required]
        public int FromStoreId { get; set; }

        [Required]
        public int ToStoreId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Количество должно быть больше 0")]
        public int Quantity { get; set; }

        public string? ReferenceId { get; set; } // Например, "ПЕРЕМЕЩЕНИЕ-99"
    }
}