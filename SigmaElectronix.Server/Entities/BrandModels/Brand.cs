using SigmaElectronix.Server.Entities.ProductModels;

namespace SigmaElectronix.Server.Entities.BrandModels
{
    public class Brand
    {
        public int Id { get; set; }

        // Картинки и статусы едины для всех языков
        public string? LogoUrl { get; set; }
        public string? HeroImageUrl { get; set; }
        public bool IsFeatured { get; set; } = false;
        public bool IsActive { get; set; } = true;

        public ICollection<Product> Products { get; set; } = new List<Product>();
        public ICollection<BrandImage> Images { get; set; } = new List<BrandImage>();

        // 🚀 Коллекция переводов
        public ICollection<BrandTranslation> Translations { get; set; } = new List<BrandTranslation>();
    }
}
