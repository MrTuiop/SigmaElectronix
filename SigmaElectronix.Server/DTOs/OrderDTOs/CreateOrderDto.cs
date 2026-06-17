using SigmaElectronix.Server.Enums;

namespace SigmaElectronix.Server.DTOs.OrderDTOs
{
    public class CreateOrderDto
    {
        // Снапшоты адреса
        public string ShippingFullName { get; set; } = string.Empty;
        public string ShippingPhone { get; set; } = string.Empty;
        public string? ShippingEmail { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public decimal ShippingCost { get; set; }
        public string? PromoCode { get; set; }
        public int? StoreId { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public decimal BonusesToSpend { get; set; }
        public List<CreateOrderItemDto> Items { get; set; } = new();
    }
}
