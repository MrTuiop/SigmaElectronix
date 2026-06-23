using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.Entities.TranslationModels
{
    public class Language
    {
        // Делаем сам код языка первичным ключом! (например: "ru", "en")
        // Это избавит нас от лишних JOIN-ов в SQL запросах
        [Key]
        [MaxLength(10)]
        public string Code { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // "Русский", "English"

        [MaxLength(100)]
        public string NativeName { get; set; } = string.Empty; // Если нужно вывести на языке оригинала

        public string? IconUrl { get; set; } // Ссылка на иконку флага

        public bool IsDefault { get; set; } = false; // Язык по умолчанию
        public bool IsActive { get; set; } = true;   // Доступен ли на сайте
    }
}
