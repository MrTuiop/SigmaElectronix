using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs.BrandDTOs
{
    public class BrandTranslationDto
    {
        [Required]
        [MaxLength(10)]
        public string LanguageCode { get; set; } = string.Empty; // "ru", "en", "uz"

        [Required]
        [MinLength(2)]
        public string Name { get; set; } = string.Empty;

        public string? Slug { get; set; } // Если админ оставит пустым, сервис сгенерирует сам

        public string Description { get; set; } = string.Empty;

        // Баннер (Hero-секция)
        public string? HeroTitle { get; set; }
        public string? HeroSubtitle { get; set; }
        public string? BannerButtonText { get; set; }
    }
}
