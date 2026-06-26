using SigmaElectronix.Server.Entities.BrandModels;
using SigmaElectronix.Server.Entities.StoreModels;
using SigmaElectronix.Server.Entities.UserModels;

namespace SigmaElectronix.Server.Entities.ProductModels
{
    public class Product
    {
        public int Id { get; set; }

        // --- Финансы и связи (НЕ зависят от языка) ---
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }

        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;

        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        // --- Статистика и системные поля ---
        public double AverageRating { get; set; }
        public int ReviewsCount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsPublished { get; set; } = true;
        public bool IsDeleted { get; set; } = false;

        // --- Навигационные свойства ---
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();

        // 🚀 Наша коллекция переводов
        public ICollection<ProductTranslation> Translations { get; set; } = new List<ProductTranslation>();
        public ICollection<StoreInventory> Inventories { get; set; } = new List<StoreInventory>();
    }
}