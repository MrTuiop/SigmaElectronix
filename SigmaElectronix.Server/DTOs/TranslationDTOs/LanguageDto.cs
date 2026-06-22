namespace SigmaElectronix.Server.DTOs.TranslationDTOs
{
    public class LanguageDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string NativeName { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
    }
}
