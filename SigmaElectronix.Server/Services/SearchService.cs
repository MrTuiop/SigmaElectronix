using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.SearchDTOs;
using SigmaElectronix.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;

namespace SigmaElectronix.Server.Services
{
    public class SearchService : ISearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private const string DefaultLanguage = "ru";

        public SearchService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetCurrentLanguage()
        {
            var lang = _httpContextAccessor.HttpContext?.Request.Headers["Accept-Language"].ToString();
            return string.IsNullOrEmpty(lang) ? DefaultLanguage : lang.Split(',')[0].Trim().ToLower();
        }

        private static string GetNameWithFallback<T>(ICollection<T> translations, string currentLang, Func<T, string> nameSelector, Func<T, string> langSelector)
        {
            var translation = translations.FirstOrDefault(t => langSelector(t) == currentLang)
                           ?? translations.FirstOrDefault(t => langSelector(t) == DefaultLanguage)
                           ?? translations.FirstOrDefault();
            return translation != null ? nameSelector(translation) : "";
        }

        private static string GetSlugWithFallback<T>(ICollection<T> translations, string currentLang, Func<T, string> slugSelector, Func<T, string> langSelector)
        {
            var translation = translations.FirstOrDefault(t => langSelector(t) == currentLang)
                           ?? translations.FirstOrDefault(t => langSelector(t) == DefaultLanguage)
                           ?? translations.FirstOrDefault();
            return translation != null ? slugSelector(translation) : "";
        }

        public async Task<SearchSuggestDto> GetSuggestionsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2) return new SearchSuggestDto();

            var normalizedQuery = query.ToLower();
            var currentLang = GetCurrentLanguage();

            // 1. КАТЕГОРИИ (Их обычно мало, поэтому AsEnumerable безопасен)
            var categoryEntities = _context.Categories
                .AsNoTracking()
                .Include(c => c.Translations)
                .AsEnumerable() // 🚀 Явно переходим на Client Evaluation
                .Where(c => c.Translations.Any(t =>
                    t.LanguageCode == currentLang &&
                    (t.Name.ToLower().Contains(normalizedQuery) ||
                     (t.Tags != null && t.Tags.Any(tag => tag.ToLower().Contains(normalizedQuery))))))
                .Take(3)
                .ToList();

            var categories = categoryEntities.Select(c => new SuggestCategoryDto
            {
                Name = GetNameWithFallback(c.Translations, currentLang, t => t.Name, t => t.LanguageCode),
                Slug = GetSlugWithFallback(c.Translations, currentLang, t => t.Slug, t => t.LanguageCode)
            }).ToList();

            // 2. БРЕНДЫ (Их тоже обычно немного)
            var brandEntities = _context.Brands
                .AsNoTracking()
                .Include(b => b.Translations)
                .Include(b => b.Products).ThenInclude(p => p.Translations) // Нужно для поиска по товарам бренда
                .AsEnumerable()
                .Where(b => b.IsActive &&
                    (
                        b.Translations.Any(t => t.LanguageCode == currentLang && t.Name.ToLower().Contains(normalizedQuery))
                        ||
                        b.Products.Any(p => !p.IsDeleted && p.IsPublished &&
                            p.Translations.Any(pt => pt.LanguageCode == currentLang &&
                                (pt.Name.ToLower().Contains(normalizedQuery) ||
                                 (pt.Tags != null && pt.Tags.Any(tag => tag.ToLower().Contains(normalizedQuery))))))
                    ))
                .Take(3)
                .ToList();

            var brands = brandEntities.Select(b => new SuggestBrandDto
            {
                Name = GetNameWithFallback(b.Translations, currentLang, t => t.Name, t => t.LanguageCode),
                Slug = GetSlugWithFallback(b.Translations, currentLang, t => t.Slug, t => t.LanguageCode),
                LogoUrl = b.LogoUrl
            }).ToList();

            // 3. ТОВАРЫ
            var productEntities = _context.Products
                .AsNoTracking()
                .Include(p => p.Translations)
                .Include(p => p.Images)
                .AsEnumerable() // 🚀 Явно переходим на Client Evaluation
                .Where(p => !p.IsDeleted && p.IsPublished &&
                    p.Translations.Any(t => t.LanguageCode == currentLang &&
                        (t.Name.ToLower().Contains(normalizedQuery) ||
                         t.ShortDescription.ToLower().Contains(normalizedQuery) ||
                         (t.Tags != null && t.Tags.Any(tag => tag.ToLower().Contains(normalizedQuery))))))
                .Take(5)
                .ToList();

            var products = productEntities.Select(p => new SuggestProductDto
            {
                Id = p.Id,
                Name = GetNameWithFallback(p.Translations, currentLang, t => t.Name, t => t.LanguageCode),
                Slug = GetSlugWithFallback(p.Translations, currentLang, t => t.Slug, t => t.LanguageCode),
                Price = p.Price,
                DiscountPrice = p.DiscountPrice,
                ImageUrl = p.Images.OrderBy(i => i.SortOrder).Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                        ?? p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()
            }).ToList();

            return new SearchSuggestDto
            {
                Categories = categories,
                Brands = brands,
                Products = products
            };
        }

        public async Task<List<string>> GetPopularTagsAsync(int count = 5)
        {
            var currentLang = GetCurrentLanguage();

            var allTagsLists = await _context.ProductTranslations
                .AsNoTracking()
                .Where(t => (t.LanguageCode == currentLang || t.LanguageCode == DefaultLanguage) &&
                            t.Product != null && t.Product.IsPublished && !t.Product.IsDeleted &&
                            t.Tags != null && t.Tags.Any())
                .Select(t => new { t.LanguageCode, t.Tags })
                .ToListAsync();

            var popularTags = allTagsLists
                .Where(t => t.LanguageCode == currentLang)
                .SelectMany(t => t.Tags)
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Distinct()
                .ToList();

            if (!popularTags.Any())
            {
                popularTags = allTagsLists.Where(t => t.LanguageCode == DefaultLanguage)
                    .SelectMany(t => t.Tags).Where(tag => !string.IsNullOrWhiteSpace(tag)).Distinct().ToList();
            }

            if (!popularTags.Any()) return new List<string> { "Смартфоны", "Ноутбуки", "Наушники", "Часы", "Телевизоры" }.Take(count).ToList();

            return popularTags.OrderBy(x => Random.Shared.Next()).Take(count)
                .Select(t => string.IsNullOrEmpty(t) ? t : char.ToUpper(t[0]) + t.Substring(1)).ToList();
        }
    }
}