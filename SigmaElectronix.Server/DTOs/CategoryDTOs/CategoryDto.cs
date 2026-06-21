namespace SigmaElectronix.Server.DTOs.CategoryDTOs
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Icon { get; set; }
        public int? ParentCategoryId { get; set; }
        public string? ParentCategoryName { get; set; }
        public int ProductsCount { get; set; }
        public int SubCategoriesCount { get; set; }
    }
}
