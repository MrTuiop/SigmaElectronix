using SigmaElectronix.Server.DTOs.CategoryDTOs;

public class UpdateCategoryDto
{
    public string? ImageUrl { get; set; }
    public string? Icon { get; set; }
    public int? ParentCategoryId { get; set; }

    // 🚀 Массив переводов
    public List<CategoryTranslationDto> Translations { get; set; } = new();
}