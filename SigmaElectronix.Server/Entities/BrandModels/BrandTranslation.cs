using SigmaElectronix.Server.Entities.TranslationModels;

namespace SigmaElectronix.Server.Entities.BrandModels
{
    public class BrandTranslation
    {
        public int Id { get; set; }

        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;

        public string LanguageCode { get; set; } = string.Empty;
        public Language Language { get; set; } = null!;

        // Переводимые поля
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // Переводимые тексты баннера
        public string? HeroTitle { get; set; }
        public string? HeroSubtitle { get; set; }
        public string? BannerButtonText { get; set; }
    }
}
