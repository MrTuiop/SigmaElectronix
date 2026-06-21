namespace SigmaElectronix.Server.DTOs.BrandDTOs
{
    public class BrandCategoryDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategorySlug { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
        public string? Icon { get; set; }
        public int ProductsCount { get; set; }   // Сколько товаров бренда в этой категории
    }
}
