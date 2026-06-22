using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.TranslationDTOs;
using SigmaElectronix.Server.Entities.Translation;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class LanguageService : ILanguageService
    {
        private readonly ApplicationDbContext _context;

        public LanguageService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<LanguageDto>> GetAllAsync(bool includeInactive = false)
        {
            var query = _context.Languages.AsNoTracking();

            if (!includeInactive)
            {
                query = query.Where(l => l.IsActive);
            }

            return await query
                .OrderByDescending(l => l.IsDefault) // Дефолтный язык всегда первый
                .ThenBy(l => l.Name)
                .Select(l => MapToDto(l))
                .ToListAsync();
        }

        public async Task<LanguageDto?> GetByCodeAsync(string code)
        {
            var normalizedCode = code.Trim().ToLowerInvariant();
            var language = await _context.Languages
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Code.ToLower() == normalizedCode);

            return language == null ? null : MapToDto(language);
        }

        public async Task<LanguageDto> CreateAsync(CreateUpdateLanguageDto dto)
        {
            var normalizedCode = dto.Code.Trim().ToLowerInvariant();

            if (await _context.Languages.AnyAsync(l => l.Code.ToLower() == normalizedCode))
                throw new InvalidOperationException($"Язык с кодом '{normalizedCode}' уже существует.");

            // Если новый язык дефолтный - сбрасываем остальные
            if (dto.IsDefault)
            {
                await ResetDefaultLanguagesAsync();
            }

            var language = new Language
            {
                Code = normalizedCode,
                Name = dto.Name,
                NativeName = dto.NativeName,
                IconUrl = dto.IconUrl,
                IsDefault = dto.IsDefault,
                IsActive = dto.IsActive
            };

            _context.Languages.Add(language);
            await _context.SaveChangesAsync();

            return MapToDto(language);
        }

        public async Task<LanguageDto?> UpdateAsync(string code, CreateUpdateLanguageDto dto)
        {
            var normalizedCode = code.Trim().ToLowerInvariant();
            var language = await _context.Languages.FirstOrDefaultAsync(l => l.Code.ToLower() == normalizedCode);

            if (language == null) return null;

            // Если язык становится дефолтным - сбрасываем остальные
            if (dto.IsDefault && !language.IsDefault)
            {
                await ResetDefaultLanguagesAsync();
            }

            // Запрещаем убирать IsDefault, если это единственный дефолтный язык (должен быть хотя бы один)
            if (!dto.IsDefault && language.IsDefault)
            {
                var otherDefaultsExist = await _context.Languages.AnyAsync(l => l.IsDefault && l.Code != language.Code);
                if (!otherDefaultsExist)
                {
                    throw new InvalidOperationException("Нельзя убрать статус по умолчанию, так как в системе должен быть хотя бы один основной язык.");
                }
            }

            language.Name = dto.Name;
            language.NativeName = dto.NativeName;
            language.IconUrl = dto.IconUrl;
            language.IsDefault = dto.IsDefault;
            language.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return MapToDto(language);
        }

        public async Task<bool> ToggleActiveStatusAsync(string code)
        {
            var normalizedCode = code.Trim().ToLowerInvariant();
            var language = await _context.Languages.FirstOrDefaultAsync(l => l.Code.ToLower() == normalizedCode);

            if (language == null) return false;

            if (language.IsDefault && language.IsActive)
            {
                throw new InvalidOperationException("Нельзя отключить язык по умолчанию.");
            }

            language.IsActive = !language.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetDefaultAsync(string code)
        {
            var normalizedCode = code.Trim().ToLowerInvariant();
            var language = await _context.Languages.FirstOrDefaultAsync(l => l.Code.ToLower() == normalizedCode);

            if (language == null) return false;
            if (!language.IsActive) throw new InvalidOperationException("Нельзя сделать неактивный язык языком по умолчанию.");

            await ResetDefaultLanguagesAsync();

            language.IsDefault = true;
            await _context.SaveChangesAsync();
            return true;
        }

        // Хелпер: снимает галочку IsDefault со всех языков
        private async Task ResetDefaultLanguagesAsync()
        {
            var defaultLanguages = await _context.Languages.Where(l => l.IsDefault).ToListAsync();
            foreach (var lang in defaultLanguages)
            {
                lang.IsDefault = false;
            }
        }

        private static LanguageDto MapToDto(Language l) => new LanguageDto
        {
            Code = l.Code,
            Name = l.Name,
            NativeName = l.NativeName,
            IconUrl = l.IconUrl,
            IsDefault = l.IsDefault,
            IsActive = l.IsActive
        };
    }
}