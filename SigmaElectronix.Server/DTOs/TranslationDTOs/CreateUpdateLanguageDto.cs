using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs.TranslationDTOs
{
    public class CreateUpdateLanguageDto
    {
        [Required]
        [MaxLength(10)]
        public string Code { get; set; } = string.Empty; // "ru", "en"

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // "Русский"

        [Required]
        [MaxLength(100)]
        public string NativeName { get; set; } = string.Empty; // "Русский"

        public string? IconUrl { get; set; }

        public bool IsDefault { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
