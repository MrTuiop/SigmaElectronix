using SigmaElectronix.Server.DTOs.ProductDTOs;

namespace SigmaElectronix.Server.DTOs.BrandDTOs
{
    public class BrandShowcaseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;

        // Основные
        public string? LogoUrl { get; set; }
        public string Description { get; set; } = string.Empty;

        // Hero-секция
        public string? HeroImageUrl { get; set; }
        public string? HeroTitle { get; set; }
        public string? HeroSubtitle { get; set; }
        public string? BannerButtonText { get; set; }

        // Галерея
        public IEnumerable<BrandImageDto> Images { get; set; } = new List<BrandImageDto>();

        // Категории, в которых есть товары этого бренда
        public IEnumerable<BrandCategoryDto> Categories { get; set; } = new List<BrandCategoryDto>();

        // Популярные товары бренда
        public IEnumerable<ProductListDto> FeaturedProducts { get; set; } = new List<ProductListDto>();

        // Общая статистика
        public int TotalProductsCount { get; set; }

        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; }

        public List<BrandTranslationDto> Translations { get; set; } = new();
    }
}
