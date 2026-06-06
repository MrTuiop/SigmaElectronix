namespace SigmaElectronix.Server.DTOs.BrandDTOs
{
    public class BrandImageDto
    {
        public int Id { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? AltText { get; set; }
        public string? Caption { get; set; }
        public int SortOrder { get; set; }
        public string ImageType { get; set; } = string.Empty;
    }
}
