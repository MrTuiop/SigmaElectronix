namespace SigmaElectronix.Server.DTOs.ProductDTOs
{
    public class ProductFilterDto
    {
        public int? CategoryId { get; set; }
        public List<int>? BrandIds { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? SearchQuery { get; set; }
        public Dictionary<string, string>? Specifications { get; set; }
        public string? SortBy { get; set; } = "newest"; // newest, price_asc, price_desc, rating, popular
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
