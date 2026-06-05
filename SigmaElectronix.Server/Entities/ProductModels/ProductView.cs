namespace SigmaElectronix.Server.Entities.ProductModels
{
    public class ProductView
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public string? UserId { get; set; } // null, если гость
        public string? SessionId { get; set; } // для анонимов

        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
}
