using SigmaElectronix.Server.Entities.ProductModels;

namespace SigmaElectronix.Server.Entities.UserModels
{
    public class Review
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public int Rating { get; set; } // 1-5
        public string Title { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;

        public bool IsApproved { get; set; } = false; // Модерация отзывов
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Для ответа магазина на отзыв
        public string? AdminResponse { get; set; }
        public DateTime? AdminResponseDate { get; set; }
    }
}
