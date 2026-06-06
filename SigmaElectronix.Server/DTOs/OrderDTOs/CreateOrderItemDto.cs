using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs.OrderDTOs
{
    public class CreateOrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
