namespace SigmaElectronix.Server.DTOs.BrandDTOs
{
    public class BrandSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
    }
}
