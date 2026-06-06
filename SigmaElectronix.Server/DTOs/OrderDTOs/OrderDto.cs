namespace SigmaElectronix.Server.DTOs.OrderDTOs
{
    public class OrderDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string? UserId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal DiscountAmount { get; set; }
        public string Status { get; set; } = string.Empty; // Enum как строка

        public int? StoreId { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime? PaidAt { get; set; }
        public DateTime? ReservationExpiresAt { get; set; }

        public string ShippingFullName { get; set; } = string.Empty;
        public string ShippingPhone { get; set; } = string.Empty;
        public string? ShippingEmail { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public List<OrderItemDto> Items { get; set; } = new();
    }
}
