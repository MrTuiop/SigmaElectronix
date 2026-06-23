using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.CategoryDTOs;
using SigmaElectronix.Server.Entities.ProductModels;
using SigmaElectronix.Server.Services.Interfaces;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace SigmaElectronix.Server.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private const string DefaultLanguage = "ru";

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

        // 🚀 УМНЫЙ ПОДСЧЕТ ТОВАРОВ: рекурсивно и только активные товары
        private async Task<Dictionary<int, int>> GetCategoryProductsCountsAsync()
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .Select(c => new
                {
                    c.Id,
                    c.ParentCategoryId,
                    // Считаем только опубликованные и неудаленные товары!
                    DirectCount = c.Products.Count(p => !p.IsDeleted && p.IsPublished)
                })
                .ToListAsync();

            var childrenLookup = categories.ToLookup(c => c.ParentCategoryId);
            var counts = new Dictionary<int, int>();

            // Локальная рекурсивная функция для суммирования
            int GetTotalProducts(int catId, int directCount)
            {
                int total = directCount;
                foreach (var child in childrenLookup[catId])
                {
                    total += GetTotalProducts(child.Id, child.DirectCount);
                }
                return total;
            }

            foreach (var c in categories)
            {
                counts[c.Id] = GetTotalProducts(c.Id, c.DirectCount);
            }

            return counts;
        }

        public async Task<List<CategoryDto>> GetAllAsync()
        {
            var currentLang = GetCurrentLanguage();
            var productsCounts = await GetCategoryProductsCountsAsync();

            var categories = await _context.Categories
                .AsNoTracking()
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
                    SubCategoriesCount = c.SubCategories.Count,
                    // 👇 НОВОЕ: считаем переводы минус базовый язык (ru)
                    TranslationsCount = Math.Max(0, c.Translations.Count - 1)
                })
                .ToListAsync();

            foreach (var cat in categories)
            {
                cat.ProductsCount = productsCounts.TryGetValue(cat.Id, out var count) ? count : 0;
            }

            return categories.OrderBy(c => c.Name).ToList();
        }

        public async Task<List<CategoryTreeDto>> GetTreeAsync()
        {
            var currentLang = GetCurrentLanguage();
            var productsCounts = await GetCategoryProductsCountsAsync();

            var rawCategories = await _context.Categories
                .AsNoTracking()
                .Select(c => new
                {
                    ParentId = c.ParentCategoryId,
                    Dto = new CategoryTreeDto
                    {
                        Id = c.Id,
                        Name = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Name).FirstOrDefault() ??
                               c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                               c.Translations.Select(t => t.Name).FirstOrDefault() ?? "Unknown",
                        Slug = c.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Slug).FirstOrDefault() ??
                               c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Slug).FirstOrDefault() ??
                               c.Translations.Select(t => t.Slug).FirstOrDefault() ?? "",
                        ImageUrl = c.ImageUrl,
                        Icon = c.Icon
                    }
                })
                .ToListAsync();

            // Подставляем товары
            foreach (var item in rawCategories)
            {
                item.Dto.ProductsCount = productsCounts.TryGetValue(item.Dto.Id, out var count) ? count : 0;
            }

            var lookup = rawCategories.ToLookup(c => c.ParentId);

            List<CategoryTreeDto> BuildTree(int? parentId)
            {
                return lookup[parentId]
                    .Select(c =>
                    {
                        var node = c.Dto;
                        node.SubCategories = BuildTree(node.Id);
                        return node;
                    })
                    .ToList();
            }

            return BuildTree(null);
        }

        public async Task<CategoryDto?> GetByIdAsync(int id)
        {
            var currentLang = GetCurrentLanguage();
            var productsCounts = await GetCategoryProductsCountsAsync();

            var category = await _context.Categories
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
                    SubCategoriesCount = c.SubCategories.Count,
                    TranslationsCount = Math.Max(0, c.Translations.Count - 1),
                    // 👇 НОВОЕ: возвращаем ВСЕ переводы
                    Translations = c.Translations.Select(t => new CategoryTranslationDto
                    {
                        LanguageCode = t.LanguageCode,
                        Name = t.Name,
                        Slug = t.Slug
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (category != null)
                category.ProductsCount = productsCounts.TryGetValue(category.Id, out var count) ? count : 0;

            return category;
        }

        public async Task<CategoryDto?> GetBySlugAsync(string slug)
        {
            var currentLang = GetCurrentLanguage();
            var productsCounts = await GetCategoryProductsCountsAsync();

            var category = await _context.Categories
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
                    SubCategoriesCount = c.SubCategories.Count
                })
                .FirstOrDefaultAsync();

            if (category != null)
                category.ProductsCount = productsCounts.TryGetValue(category.Id, out var count) ? count : 0;

            return category;
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

            foreach (var transDto in dto.Translations)
            {
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

            foreach (var transDto in dto.Translations)
            {
                var existingTrans = category.Translations.FirstOrDefault(t => t.LanguageCode == transDto.LanguageCode);
                var targetSlug = string.IsNullOrWhiteSpace(transDto.Slug) ? transDto.Name : transDto.Slug;

                if (existingTrans != null)
                {
                    if (existingTrans.Name != transDto.Name || existingTrans.Slug != targetSlug)
                        existingTrans.Slug = await GenerateUniqueSlugAsync(targetSlug, transDto.LanguageCode, id);

                    existingTrans.Name = transDto.Name;
                }
                else
                {
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

            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
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

        private async Task<string> GenerateUniqueSlugAsync(string baseText, string languageCode, int? excludeId = null)
        {
            var slug = baseText.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\-_]", "");

            var finalSlug = slug;
            int counter = 1;

            while (await _context.CategoryTranslations.AnyAsync(ct => ct.Slug == finalSlug && ct.LanguageCode == languageCode && ct.CategoryId != excludeId))
            {
                finalSlug = $"{slug}-{counter}";
                counter++;
            }

            return finalSlug;
        }

        // 🚀 Проверяем уникальность slug в текущем языке (Для фронтенд-проверок)
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