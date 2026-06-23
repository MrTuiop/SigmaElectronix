using SigmaElectronix.Server.DTOs.TranslationDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IUiTranslationService
    {
        // Для ngx-translate (отдает словарь { "КЛЮЧ": "ЗНАЧЕНИЕ" })
        Task<Dictionary<string, string>> GetTranslationsForClientAsync(string langCode);

        // Для админки
        Task<List<UiTranslationDto>> GetAllAsync();
        Task<UiTranslationDto> CreateAsync(CreateUpdateUiTranslationDto dto);
        Task<UiTranslationDto> UpdateAsync(int id, CreateUpdateUiTranslationDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
