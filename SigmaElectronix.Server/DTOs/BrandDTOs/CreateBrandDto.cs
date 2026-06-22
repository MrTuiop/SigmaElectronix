using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs.BrandDTOs
{
    public class CreateBrandDto
    {
        // 🟢 Общие поля (не зависят от языка)
        public string? LogoUrl { get; set; }
        public string? HeroImageUrl { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; } = true;

        // 🔵 Переводы (массив!)
        [Required, MinLength(1, ErrorMessage = "Бренд должен иметь хотя бы один перевод")]
        public List<BrandTranslationDto> Translations { get; set; } = new();
    }
}
