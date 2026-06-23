using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.TranslationDTOs;
using SigmaElectronix.Server.Entities.TranslationModels;
using SigmaElectronix.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SigmaElectronix.Server.Services
{
    public class UiTranslationService : IUiTranslationService
    {
        private readonly ApplicationDbContext _context;

        public UiTranslationService(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🚀 Этот метод скачивает ngx-translate при загрузке сайта
        public async Task<Dictionary<string, string>> GetTranslationsForClientAsync(string langCode)
        {
            return await _context.UiTranslations
                .AsNoTracking()
                .Where(t => t.LanguageCode == langCode)
                .ToDictionaryAsync(t => t.Key, t => t.Value);
        }

        public async Task<List<UiTranslationDto>> GetAllAsync()
        {
            var translations = await _context.UiTranslations.AsNoTracking().ToListAsync();
            return translations.Select(t => new UiTranslationDto
            {
                Id = t.Id,
                Key = t.Key,
                LanguageCode = t.LanguageCode,
                Value = t.Value
            }).ToList();
        }

        public async Task<UiTranslationDto> CreateAsync(CreateUpdateUiTranslationDto dto)
        {
            var translation = new UiTranslation
            {
                Key = dto.Key,
                LanguageCode = dto.LanguageCode,
                Value = dto.Value
            };
            _context.UiTranslations.Add(translation);
            await _context.SaveChangesAsync();
            return new UiTranslationDto { Id = translation.Id, Key = translation.Key, LanguageCode = translation.LanguageCode, Value = translation.Value };
        }

        public async Task<UiTranslationDto> UpdateAsync(int id, CreateUpdateUiTranslationDto dto)
        {
            var translation = await _context.UiTranslations.FindAsync(id);
            if (translation == null) throw new KeyNotFoundException("Перевод не найден");

            translation.Key = dto.Key;
            translation.LanguageCode = dto.LanguageCode;
            translation.Value = dto.Value;

            await _context.SaveChangesAsync();
            return new UiTranslationDto { Id = translation.Id, Key = translation.Key, LanguageCode = translation.LanguageCode, Value = translation.Value };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var translation = await _context.UiTranslations.FindAsync(id);
            if (translation == null) return false;

            _context.UiTranslations.Remove(translation);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
