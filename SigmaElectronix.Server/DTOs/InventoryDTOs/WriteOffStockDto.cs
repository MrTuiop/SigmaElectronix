using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs.InventoryDTOs
{
    public class WriteOffStockDto
    {
        [Required(ErrorMessage = "Не указан магазин.")]
        public int StoreId { get; set; }

        [Required(ErrorMessage = "Не указан товар.")]
        public int ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Количество для списания должно быть больше нуля.")]
        public int Quantity { get; set; }

        public string? ReferenceId { get; set; } // Опциональная причина/документ списания
    }
}
