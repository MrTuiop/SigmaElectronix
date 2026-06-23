namespace SigmaElectronix.Server.DTOs.TranslationDTOs
{
    public class CreateUpdateUiTranslationDto
    {
        public string Key { get; set; } = string.Empty;
        public string LanguageCode { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}
