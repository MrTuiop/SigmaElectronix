namespace SigmaElectronix.Server.DTOs.CategoryDTOs
{
    public class CategoryTreeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int ProductsCount { get; set; }
        public List<CategoryTreeDto> SubCategories { get; set; } = new();
    }
}
