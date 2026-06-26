using SigmaElectronix.Server.DTOs.TranslationDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface ILanguageService
    {
        Task<List<LanguageDto>> GetAllAsync(bool includeInactive = false);
        Task<LanguageDto?> GetByCodeAsync(string code);
        Task<LanguageDto> CreateAsync(CreateUpdateLanguageDto dto);
        Task<LanguageDto?> UpdateAsync(string code, CreateUpdateLanguageDto dto);
        Task<bool> ToggleActiveStatusAsync(string code);
        Task<bool> SetDefaultAsync(string code);
        Task<bool> DeleteAsync(string code);
    }
}
