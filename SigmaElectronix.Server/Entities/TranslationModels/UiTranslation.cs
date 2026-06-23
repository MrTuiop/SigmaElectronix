namespace SigmaElectronix.Server.Entities.TranslationModels
{
    public class UiTranslation
    {
        public int Id { get; set; }
        public string Key { get; set; } = string.Empty;          // "COMMON.SAVE"
        public string LanguageCode { get; set; } = string.Empty; // "ru", "en"
        public string Value { get; set; } = string.Empty;        // "Сохранить"
    }
}
