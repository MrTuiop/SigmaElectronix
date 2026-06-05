using SigmaElectronix.Server.Entities.UserModels;
using SigmaElectronix.Server.Enums;

namespace SigmaElectronix.Server.Entities.OrderModels
{
    public class Order
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string? UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal DiscountAmount { get; set; }

        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        // Адреса на момент заказа (снапшоты, а не ссылки на Address, чтобы история не менялась)
        public string ShippingFullName { get; set; } = string.Empty;
        public string ShippingPhone { get; set; } = string.Empty;
        public string? ShippingEmail { get; set; }
        public string ShippingAddress { get; set; } = string.Empty; // Полный адрес одной строкой или отдельные поля

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
        public Payment? Payment { get; set; }
        public Shipment? Shipment { get; set; }
    }
}
