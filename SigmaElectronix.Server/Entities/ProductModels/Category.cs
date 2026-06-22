namespace SigmaElectronix.Server.Entities.ProductModels
{
    public class Category
    {
        public int Id { get; set; }

        // Файлы и настройки не зависят от языка
        public string ImageUrl { get; set; } = string.Empty;
        public string? Icon { get; set; }

        public int? ParentCategoryId { get; set; }
        public Category? ParentCategory { get; set; }

        public ICollection<Category> SubCategories { get; set; } = new List<Category>();
        public ICollection<Product> Products { get; set; } = new List<Product>();

        // 🚀 Коллекция переводов
        public ICollection<CategoryTranslation> Translations { get; set; } = new List<CategoryTranslation>();
    }
}
