namespace SigmaElectronix.Server.DTOs.BrandDTOs
{
    public class BrandListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? HeroImageUrl { get; set; }
        public string ShortDescription { get; set; } = string.Empty; // первые 150 символов Description
        public int ProductsCount { get; set; }
        public bool IsFeatured { get; set; }
    }
}
