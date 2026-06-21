namespace SigmaElectronix.Server.Entities.ProductModels
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public int? ParentCategoryId { get; set; }
        public Category? ParentCategory { get; set; }

        public List<string> Tags { get; set; } = new();

        public ICollection<Category> SubCategories { get; set; } = new List<Category>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
