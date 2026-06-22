namespace SigmaElectronix.Server.DTOs.CategoryDTOs
{
    public class CreateCategoryDto
    {
        public string? ImageUrl { get; set; }
        public string? Icon { get; set; }
        public int? ParentCategoryId { get; set; }

        // 🚀 Массив переводов вместо одного имени
        public List<CategoryTranslationDto> Translations { get; set; } = new();
    }
}
