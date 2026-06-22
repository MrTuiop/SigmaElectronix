using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.SearchDTOs;
using SigmaElectronix.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SigmaElectronix.Server.Services
{
    public class SearchService : ISearchService
    {
        private readonly ApplicationDbContext _context;
        private const string DefaultLanguage = "ru"; // 🎯 Дефолтный язык для поиска

        public SearchService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SearchSuggestDto> GetSuggestionsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return new SearchSuggestDto();
            }

            var normalizedQuery = query.ToLower();

            // 1. Ищем подходящие категории (максимум 3)
            var categories = await _context.Categories
                .AsNoTracking()
                .Where(c => c.Translations.Any(t =>
                    t.LanguageCode == DefaultLanguage &&
                    (t.Name.ToLower().Contains(normalizedQuery) ||
                     t.Tags.Any(tag => tag.ToLower().Contains(normalizedQuery)))))
                .Take(3)
                // 🚀 СРАЗУ маппим в DTO для базы данных
                .Select(c => new SuggestCategoryDto
                {
                    Name = c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ?? "",
                    Slug = c.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Slug).FirstOrDefault() ?? ""
                })
                .ToListAsync();

            // 2. Ищем подходящие бренды (максимум 3)
            var brands = await _context.Brands
                .AsNoTracking()
                .Where(b => b.IsActive &&
                    (
                        b.Translations.Any(t => t.LanguageCode == DefaultLanguage && t.Name.ToLower().Contains(normalizedQuery))
                        ||
                        b.Products.Any(p => !p.IsDeleted && p.IsPublished &&
                            p.Translations.Any(pt => pt.LanguageCode == DefaultLanguage &&
                                (pt.Name.ToLower().Contains(normalizedQuery) ||
                                 pt.Tags.Any(tag => tag.ToLower().Contains(normalizedQuery)))))
                    ))
                .Take(3)
                // 🚀 СРАЗУ маппим в DTO
                .Select(b => new SuggestBrandDto
                {
                    Name = b.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ?? "",
                    Slug = b.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Slug).FirstOrDefault() ?? "",
                    LogoUrl = b.LogoUrl
                })
                .ToListAsync();

            // 3. Ищем подходящие товары (максимум 5)
            var products = await _context.Products
                .AsNoTracking()
                .Where(p => !p.IsDeleted && p.IsPublished &&
                    p.Translations.Any(t => t.LanguageCode == DefaultLanguage &&
                        (t.Name.ToLower().Contains(normalizedQuery) ||
                         t.Tags.Any(tag => tag.ToLower().Contains(normalizedQuery)))))
                .Take(5)
                // 🚀 СРАЗУ маппим в DTO
                .Select(p => new SuggestProductDto
                {
                    Id = p.Id,
                    Name = p.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ?? "",
                    Slug = p.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Slug).FirstOrDefault() ?? "",
                    Price = p.Price,
                    DiscountPrice = p.DiscountPrice,
                    ImageUrl = p.Images.OrderBy(i => i.SortOrder).Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                            ?? p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()
                })
                .ToListAsync();

            return new SearchSuggestDto
            {
                Categories = categories,
                Brands = brands,
                Products = products
            };
        }

        public async Task<List<string>> GetPopularTagsAsync(int count = 5)
        {
            // 🚀 МАГИЯ: Ищем теги напрямую в таблице переводов товаров!
            var allTags = await _context.ProductTranslations
                .AsNoTracking()
                .Where(t => t.LanguageCode == DefaultLanguage &&
                            t.Product != null &&
                            t.Product.IsPublished &&
                            !t.Product.IsDeleted &&
                            t.Tags != null &&
                            t.Tags.Any())
                .SelectMany(t => t.Tags)
                .Distinct()
                .ToListAsync();

            if (!allTags.Any())
            {
                // Заглушки, если тегов еще нет
                return new List<string> { "Смартфоны", "Ноутбуки", "Наушники", "Часы", "Телевизоры" }.Take(count).ToList();
            }

            var random = new Random();
            var randomTags = allTags.OrderBy(x => random.Next()).Take(count).ToList();

            return randomTags.Select(t => string.IsNullOrEmpty(t) ? t : char.ToUpper(t[0]) + t.Substring(1)).ToList();
        }
    }
}