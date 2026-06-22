namespace SigmaElectronix.Server.DTOs.ProductDTOs
{
    public class ProductTranslationDto
    {
        public string LanguageCode { get; set; } = string.Empty; // "ru", "en", "uz"
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;
        public Dictionary<string, string> Specifications { get; set; } = new();
        public List<string> Tags { get; set; } = new();
    }
}
