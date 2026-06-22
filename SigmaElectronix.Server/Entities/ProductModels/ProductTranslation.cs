using SigmaElectronix.Server.Entities.Translation;

namespace SigmaElectronix.Server.Entities.ProductModels
{
    public class ProductTranslation
    {
        public int Id { get; set; }

        // Связь с основным товаром
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        // Код языка (например: "ru", "en", "uz")
        public string LanguageCode { get; set; } = string.Empty;
        public Language Language { get; set; } = null!;

        // --- Переводимые поля ---
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;

        // Характеристики на конкретном языке (PostgreSQL JSONB)
        public Dictionary<string, string> Specifications { get; set; } = new();

        // Теги тоже логично переводить
        public List<string> Tags { get; set; } = new();
    }
}