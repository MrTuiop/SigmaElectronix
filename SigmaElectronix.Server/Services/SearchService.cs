using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.SearchDTOs;
using SigmaElectronix.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SigmaElectronix.Server.Services
{
    public class SearchService : ISearchService
    {
        private readonly ApplicationDbContext _context;

        public SearchService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SearchSuggestDto> GetSuggestionsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return new SearchSuggestDto(); // Не ищем, если введено меньше 2 символов
            }

            var normalizedQuery = query.ToLower();

            // 1. Ищем подходящие категории (максимум 3)
            // Npgsql автоматически оптимизирует .ToLower().Contains() в ILIKE
            var categories = await _context.Categories
                .AsNoTracking()
                .Where(c => c.Name.ToLower().Contains(normalizedQuery) ||
                            c.Tags.Any(tag => tag.ToLower().Contains(normalizedQuery))) // <-- Добавили поиск по тегам
                .Take(3)
                .Select(c => new SuggestCategoryDto
                {
                    Name = c.Name,
                    Slug = c.Slug
                })
                .ToListAsync();

            // 2. Ищем подходящие бренды (максимум 3)
            var brands = await _context.Brands
                .AsNoTracking()
                .Where(b => b.IsActive &&
                           (b.Name.ToLower().Contains(normalizedQuery) ||
                            // 🚀 Ищем бренд через его товары!
                            // Если хоть один активный товар бренда содержит запрос в названии или тегах
                            b.Products.Any(p => !p.IsDeleted && p.IsPublished &&
                                               (p.Name.ToLower().Contains(normalizedQuery) ||
                                                p.Tags.Any(t => t.ToLower().Contains(normalizedQuery))))))
                .Take(3)
                .Select(b => new SuggestBrandDto
                {
                    Name = b.Name,
                    Slug = b.Slug,
                    LogoUrl = b.LogoUrl
                })
                .ToListAsync();

            // 3. Ищем подходящие товары
            var products = await _context.Products
                .AsNoTracking()
                .Where(p => !p.IsDeleted && p.IsPublished &&
                           // Ищем в названии товара
                           (p.Name.ToLower().Contains(normalizedQuery) ||
                            // ИЛИ ищем среди тегов (если хоть один тег содержит введенное слово)
                            p.Tags.Any(tag => tag.ToLower().Contains(normalizedQuery))))
                .Take(5)
                .Select(p => new SuggestProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Slug = p.Slug,
                    Price = p.Price,
                    DiscountPrice = p.DiscountPrice,
                    ImageUrl = p.Images.OrderBy(i => i.SortOrder)
                                       .Where(i => i.IsPrimary)
                                       .Select(i => i.Url)
                                       .FirstOrDefault()
                               ?? p.Images.OrderBy(i => i.SortOrder)
                                       .Select(i => i.Url)
                                       .FirstOrDefault()
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
            // Берем все теги из опубликованных товаров
            var allTags = await _context.Products
                .AsNoTracking()
                .Where(p => !p.IsDeleted && p.IsPublished && p.Tags != null && p.Tags.Any())
                .SelectMany(p => p.Tags)
                .Distinct() // Оставляем только уникальные
                .ToListAsync();

            if (!allTags.Any())
            {
                // Если тегов в базе еще нет (или мало), возвращаем дефолтные (заглушки)
                return new List<string> { "Смартфоны", "Ноутбуки", "Наушники", "Часы", "Телевизоры" }.Take(count).ToList();
            }

            // Перемешиваем список тегов случайным образом и берем первые 'count' штук
            var random = new Random();
            var randomTags = allTags.OrderBy(x => random.Next()).Take(count).ToList();

            // 💡 Опционально: можно сделать первую букву заглавной для красоты
            return randomTags.Select(t => char.ToUpper(t[0]) + t.Substring(1)).ToList();
        }
    }
}
