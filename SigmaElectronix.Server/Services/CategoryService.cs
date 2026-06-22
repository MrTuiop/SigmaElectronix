using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.CategoryDTOs;
using SigmaElectronix.Server.Entities.ProductModels;
using SigmaElectronix.Server.Services.Interfaces;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // 🚀 Требуется для работы с заголовками HTTP
using System.Linq;

namespace SigmaElectronix.Server.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor; // 🚀 Инжектим HttpContextAccessor
        private const string DefaultLanguage = "ru"; // 🎯 Дефолтный язык (фоллбэк)

        public CategoryService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        // 🚀 Хелпер для получения текущего языка
        private string GetCurrentLanguage()
        {
            var lang = _httpContextAccessor.HttpContext?.Request.Headers["Accept-Language"].ToString();

            if (string.IsNullOrEmpty(lang))
                return DefaultLanguage;

            var firstLang = lang.Split(',')[0].Trim();
            return firstLang.Split('-')[0].ToLower();
        }

        public async Task<List<CategoryDto>> GetAllAsync()
        {
            var currentLang = GetCurrentLanguage(); // 🚀

            // 1. Вытягиваем плоский список из БД со счетчиком только ПРЯМЫХ товаров.
            var flatCategories = await _context.Categories
                .AsNoTracking()
                .Select(c => new
                {
                    c.Id,
                    // 🚀 Каскадный поиск перевода: Текущий язык -> Дефолтный -> Любой первый попавшийся
                    Name = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Name).FirstOrDefault() ??
                           c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                           c.Translations.Select(t => t.Name).FirstOrDefault() ?? "Unknown",
                    Slug = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Slug).FirstOrDefault() ??
                           c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Slug).FirstOrDefault() ??
                           c.Translations.Select(t => t.Slug).FirstOrDefault() ?? "",
                    c.ImageUrl,
                    Icon = c.Icon,
                    c.ParentCategoryId,
                    ParentCategoryName = c.ParentCategory != null
                        ? (c.ParentCategory.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Name).FirstOrDefault() ??
                           c.ParentCategory.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                           c.ParentCategory.Translations.Select(t => t.Name).FirstOrDefault())
                        : null,
                    SubCategoriesCount = c.SubCategories.Count,
                    DirectProductsCount = c.Products.Count
                })
                .ToListAsync();

            // 2. Создаем словарь связей для быстрого поиска
            var childrenLookup = flatCategories.ToLookup(c => c.ParentCategoryId);

            // 3. Локальная рекурсивная функция подсчета товаров
            int GetTotalProducts(int categoryId, int directCount)
            {
                int total = directCount;
                foreach (var child in childrenLookup[categoryId])
                {
                    total += GetTotalProducts(child.Id, child.DirectProductsCount);
                }
                return total;
            }

            // 4. Формируем финальный список DTO
            return flatCategories
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    ImageUrl = c.ImageUrl,
                    Icon = c.Icon,
                    ParentCategoryId = c.ParentCategoryId,
                    ParentCategoryName = c.ParentCategoryName,
                    SubCategoriesCount = c.SubCategoriesCount,
                    ProductsCount = GetTotalProducts(c.Id, c.DirectProductsCount)
                })
                .ToList();
        }

        public async Task<List<CategoryTreeDto>> GetTreeAsync()
        {
            var currentLang = GetCurrentLanguage(); // 🚀

            // 1. Делаем плоскую выборку с умными переводами
            var flatCategories = await _context.Categories
                .AsNoTracking()
                .Select(c => new
                {
                    c.Id,
                    Name = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Name).FirstOrDefault() ??
                           c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                           c.Translations.Select(t => t.Name).FirstOrDefault() ?? "Unknown",
                    Slug = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Slug).FirstOrDefault() ??
                           c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Slug).FirstOrDefault() ??
                           c.Translations.Select(t => t.Slug).FirstOrDefault() ?? "",
                    c.ImageUrl,
                    Icon = c.Icon,
                    c.ParentCategoryId,
                    ProductsCount = c.Products.Count
                })
                .ToListAsync();

            // 2. Группируем для построения дерева
            var lookup = flatCategories.ToLookup(c => c.ParentCategoryId);

            // 3. Строим дерево рекурсивно
            List<CategoryTreeDto> BuildTree(int? parentId)
            {
                var nodes = lookup[parentId]
                    .Select(c => new CategoryTreeDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug,
                        ImageUrl = c.ImageUrl,
                        Icon = c.Icon,
                        ProductsCount = c.ProductsCount,
                        SubCategories = BuildTree(c.Id)
                    })
                    .ToList();

                // Агрегация: добавляем товары из подкатегорий
                foreach (var node in nodes)
                {
                    if (node.SubCategories != null && node.SubCategories.Any())
                    {
                        node.ProductsCount += node.SubCategories.Sum(s => s.ProductsCount);
                    }
                }

                return nodes;
            }

            return BuildTree(null);
        }

        public async Task<CategoryDto?> GetByIdAsync(int id)
        {
            var currentLang = GetCurrentLanguage(); // 🚀

            return await _context.Categories
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Name).FirstOrDefault() ??
                           c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                           c.Translations.Select(t => t.Name).FirstOrDefault() ?? "Unknown",
                    Slug = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Slug).FirstOrDefault() ??
                           c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Slug).FirstOrDefault() ??
                           c.Translations.Select(t => t.Slug).FirstOrDefault() ?? "",
                    ImageUrl = c.ImageUrl,
                    Icon = c.Icon,
                    ParentCategoryId = c.ParentCategoryId,
                    ParentCategoryName = c.ParentCategory != null
                        ? (c.ParentCategory.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Name).FirstOrDefault() ??
                           c.ParentCategory.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                           c.ParentCategory.Translations.Select(t => t.Name).FirstOrDefault())
                        : null,
                    ProductsCount = c.Products.Count,
                    SubCategoriesCount = c.SubCategories.Count
                })
                .FirstOrDefaultAsync();
        }

        public async Task<CategoryDto?> GetBySlugAsync(string slug)
        {
            var currentLang = GetCurrentLanguage(); // 🚀

            // Ищем категорию по slug в таблице переводов по ТЕКУЩЕМУ ИЛИ ДЕФОЛТНОМУ языку
            return await _context.Categories
                .AsNoTracking()
                .Where(c => c.Translations.Any(t => t.Slug == slug && (t.LanguageCode == currentLang || t.LanguageCode == DefaultLanguage)))
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Name).FirstOrDefault() ??
                           c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                           c.Translations.Select(t => t.Name).FirstOrDefault() ?? "Unknown",
                    Slug = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Slug).FirstOrDefault() ??
                           c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Slug).FirstOrDefault() ??
                           c.Translations.Select(t => t.Slug).FirstOrDefault() ?? "",
                    ImageUrl = c.ImageUrl,
                    Icon = c.Icon,
                    ParentCategoryId = c.ParentCategoryId,
                    ParentCategoryName = c.ParentCategory != null
                        ? (c.ParentCategory.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Name).FirstOrDefault() ??
                           c.ParentCategory.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                           c.ParentCategory.Translations.Select(t => t.Name).FirstOrDefault())
                        : null,
                    ProductsCount = c.Products.Count,
                    SubCategoriesCount = c.SubCategories.Count
                })
                .FirstOrDefaultAsync();
        }

        public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
        {
            if (dto.Translations == null || !dto.Translations.Any())
                throw new ArgumentException("Категория должна иметь хотя бы один перевод.");

            var category = new Category
            {
                ImageUrl = dto.ImageUrl ?? string.Empty,
                Icon = dto.Icon ?? "folder",
                ParentCategoryId = dto.ParentCategoryId
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            // 🚀 Сохраняем ВСЕ переводы, которые пришли из админки (Angular)
            foreach (var transDto in dto.Translations)
            {
                // Если slug пустой, генерируем из имени
                var baseSlug = string.IsNullOrWhiteSpace(transDto.Slug) ? transDto.Name : transDto.Slug;
                var uniqueSlug = await GenerateUniqueSlugAsync(baseSlug, transDto.LanguageCode);

                _context.CategoryTranslations.Add(new CategoryTranslation
                {
                    CategoryId = category.Id,
                    LanguageCode = transDto.LanguageCode,
                    Name = transDto.Name,
                    Slug = uniqueSlug
                });
            }

            await _context.SaveChangesAsync();

            return (await GetByIdAsync(category.Id))!;
        }

        public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto)
        {
            var category = await _context.Categories
                .Include(c => c.Translations)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return null;

            if (dto.ParentCategoryId == id)
                throw new InvalidOperationException("Категория не может быть родителем самой себя");

            category.ImageUrl = dto.ImageUrl ?? category.ImageUrl;
            category.Icon = dto.Icon ?? category.Icon;
            category.ParentCategoryId = dto.ParentCategoryId;

            // 🚀 ОБНОВЛЕНИЕ ПЕРЕВОДОВ
            foreach (var transDto in dto.Translations)
            {
                var existingTrans = category.Translations.FirstOrDefault(t => t.LanguageCode == transDto.LanguageCode);
                var targetSlug = string.IsNullOrWhiteSpace(transDto.Slug) ? transDto.Name : transDto.Slug;

                if (existingTrans != null)
                {
                    // Обновляем, если изменилось имя или slug
                    if (existingTrans.Name != transDto.Name || existingTrans.Slug != targetSlug)
                        existingTrans.Slug = await GenerateUniqueSlugAsync(targetSlug, transDto.LanguageCode, id);

                    existingTrans.Name = transDto.Name;
                }
                else
                {
                    // Добавляем новый язык
                    var newSlug = await GenerateUniqueSlugAsync(targetSlug, transDto.LanguageCode, id);
                    _context.CategoryTranslations.Add(new CategoryTranslation
                    {
                        CategoryId = category.Id,
                        LanguageCode = transDto.LanguageCode,
                        Name = transDto.Name,
                        Slug = newSlug
                    });
                }
            }

            // Опционально: удаление переводов, которые удалили на фронтенде
            var incomingLangCodes = dto.Translations.Select(t => t.LanguageCode).ToList();
            var translationsToRemove = category.Translations.Where(t => !incomingLangCodes.Contains(t.LanguageCode)).ToList();
            _context.CategoryTranslations.RemoveRange(translationsToRemove);

            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        private async Task<string> GenerateUniqueSlugAsync(string baseText, string languageCode, int? excludeId = null)
        {
            var slug = baseText.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\-_]", "");

            var finalSlug = slug;
            int counter = 1;

            // Ищем дубликаты именно в ТАКОМ ЖЕ языке
            while (await _context.CategoryTranslations.AnyAsync(ct => ct.Slug == finalSlug && ct.LanguageCode == languageCode && ct.CategoryId != excludeId))
            {
                finalSlug = $"{slug}-{counter}";
                counter++;
            }

            return finalSlug;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Products)
                .Include(c => c.SubCategories)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return false;

            if (category.Products.Any())
                throw new InvalidOperationException("Нельзя удалить категорию с товарами");

            if (category.SubCategories.Any())
                throw new InvalidOperationException("Нельзя удалить категорию с подкатегориями");

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }

        // 🚀 Проверяем уникальность slug в текущем языке
        public async Task<bool> IsSlugUniqueAsync(string slug, int? excludeId = null)
        {
            var currentLang = GetCurrentLanguage();
            var normalizedSlug = slug.ToLowerInvariant();

            var query = _context.CategoryTranslations
                .Where(ct => ct.Slug == normalizedSlug && ct.LanguageCode == currentLang);

            if (excludeId.HasValue)
                query = query.Where(ct => ct.CategoryId != excludeId.Value);

            return !await query.AnyAsync();
        }
    }
}