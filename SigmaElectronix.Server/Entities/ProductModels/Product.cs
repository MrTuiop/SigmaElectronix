using SigmaElectronix.Server.Entities.BrandModels;
using SigmaElectronix.Server.Entities.UserModels;

namespace SigmaElectronix.Server.Entities.ProductModels
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;

        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public Dictionary<string, string> Specifications { get; set; } = new();

        public List<string> Tags { get; set; } = new();

        public double AverageRating { get; set; }
        public int ReviewsCount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsPublished { get; set; } = true;
        public bool IsDeleted { get; set; } = false;

        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
