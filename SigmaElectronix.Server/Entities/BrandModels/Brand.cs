using SigmaElectronix.Server.Entities.ProductModels;

namespace SigmaElectronix.Server.Entities.BrandModels
{
    public class Brand
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;  // ← добавим slug для красивых URL

        // Основные данные
        public string? LogoUrl { get; set; }
        public string Description { get; set; } = string.Empty;

        // ====== ВИТРИНА БРЕНДА ======
        public string? HeroImageUrl { get; set; }       // Большой баннер сверху
        public string? HeroTitle { get; set; }          // Заголовок на баннере
        public string? HeroSubtitle { get; set; }       // Подзаголовок
        public string? BannerButtonText { get; set; }   // "Смотреть товары"

        // Статус
        public bool IsFeatured { get; set; } = false;   // Показывать на главной в "Бренды"
        public bool IsActive { get; set; } = true;      // Активен ли бренд

        // Навигационные свойства
        public ICollection<Product> Products { get; set; } = new List<Product>();
        public ICollection<BrandImage> Images { get; set; } = new List<BrandImage>();
    }
}
