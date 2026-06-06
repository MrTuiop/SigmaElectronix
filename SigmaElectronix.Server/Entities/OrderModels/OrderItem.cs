using SigmaElectronix.Server.Entities.StoreModels;

namespace SigmaElectronix.Server.Entities.OrderModels
{
    public class OrderItem
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public Order Order { get; set; } = null!;
        public int? StoreId { get; set; }
        public Store? Store { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty; // Снапшот названия
        public string? ProductImageUrl { get; set; } // Снапшот картинки
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; } // Цена на момент покупки
        public decimal TotalPrice => Quantity * UnitPrice;
    }
}
