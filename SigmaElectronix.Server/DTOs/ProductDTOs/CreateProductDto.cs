namespace SigmaElectronix.Server.DTOs.ProductDTOs
{
    public class CreateProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int BrandId { get; set; }
        public int CategoryId { get; set; }
        public Dictionary<string, string> Specifications { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public bool IsPublished { get; set; } = true;
        public List<ProductImageDto> Images { get; set; } = new();
    }
}
