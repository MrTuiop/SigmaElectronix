namespace SigmaElectronix.Server.DTOs.ProductDTOs
{
    public class ProductFilterDto
    {
        public int? CategoryId { get; set; }
        public List<int>? BrandIds { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? SearchQuery { get; set; }

        // 🚀 ИЗМЕНЕНИЕ ЗДЕСЬ: Теперь это список строк для каждого ключа
        public Dictionary<string, List<string>>? Specifications { get; set; }

        public string? SortBy { get; set; } = "newest";
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
