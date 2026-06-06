using SigmaElectronix.Server.DTOs.BrandDTOs;

namespace SigmaElectronix.Server.DTOs.ProductDTOs
{
    public class ProductDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public decimal FinalPrice => DiscountPrice ?? Price;
        public decimal? DiscountPercent => DiscountPrice.HasValue
            ? Math.Round((1 - DiscountPrice.Value / Price) * 100, 0)
            : null;
        public BrandSummaryDto Brand { get; set; } = null!;
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public Dictionary<string, string> Specifications { get; set; } = new();
        public double AverageRating { get; set; }
        public int ReviewsCount { get; set; }
        public List<ProductImageDto> Images { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }
}
