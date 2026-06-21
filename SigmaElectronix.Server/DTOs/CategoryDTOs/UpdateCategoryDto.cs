namespace SigmaElectronix.Server.DTOs.CategoryDTOs
{
    public class UpdateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Icon { get; set; }
        public int? ParentCategoryId { get; set; }
    }
}
