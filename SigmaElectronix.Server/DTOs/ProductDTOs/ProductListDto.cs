using SigmaElectronix.Server.DTOs.BrandDTOs;

namespace SigmaElectronix.Server.DTOs.ProductDTOs
{
    public class ProductListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public decimal FinalPrice => DiscountPrice ?? Price;
        public BrandSummaryDto Brand { get; set; } = null!;
        public string CategoryName { get; set; } = string.Empty;
        public string MainImageUrl { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int ReviewsCount { get; set; }
        public bool IsPublished { get; set; }

        public bool IsNew { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
