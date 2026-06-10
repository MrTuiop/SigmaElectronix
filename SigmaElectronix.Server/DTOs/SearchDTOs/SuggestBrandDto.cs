namespace SigmaElectronix.Server.DTOs.SearchDTOs
{
    public class SuggestBrandDto
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
    }
}
