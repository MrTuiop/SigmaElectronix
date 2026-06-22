using SigmaElectronix.Server.DTOs.BrandDTOs;

namespace SigmaElectronix.Server.DTOs.CategoryDTOs
{
    public class CategoryFilterDto
    {
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public List<BrandSummaryDto> Brands { get; set; } = new();
        // Словарь: Название характеристики -> Список доступных значений (Например: "Цвет" -> ["Черный", "Белый"])
        public Dictionary<string, List<string>> Specifications { get; set; } = new();
    }
}
