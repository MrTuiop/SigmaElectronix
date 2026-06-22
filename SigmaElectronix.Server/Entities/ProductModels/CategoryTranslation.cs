using SigmaElectronix.Server.Entities.Translation;

namespace SigmaElectronix.Server.Entities.ProductModels
{
    public class CategoryTranslation
    {
        public int Id { get; set; }

        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public string LanguageCode { get; set; } = string.Empty;
        public Language Language { get; set; } = null!;

        // Переводимые поля
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;

        // Теги перенес сюда, так как на разных языках они пишутся по-разному
        public List<string> Tags { get; set; } = new();
    }
}
