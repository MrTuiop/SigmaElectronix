namespace SigmaElectronix.Server.DTOs.ProductDTOs
{
    public class CreateProductDto
    {
        // Только то, что не зависит от языка
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int BrandId { get; set; }
        public int CategoryId { get; set; }
        public bool IsPublished { get; set; } = true;
        public List<ProductImageDto> Images { get; set; } = new();

        // 🚀 Массив переводов (минимум 1 элемент)
        public List<ProductTranslationDto> Translations { get; set; } = new();
    }
}
