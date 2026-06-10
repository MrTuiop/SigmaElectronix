using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Common;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.BrandDTOs; // Добавлен using для BrandDto
using SigmaElectronix.Server.DTOs.ProductDTOs;
using SigmaElectronix.Server.Entities.ProductModels;
using SigmaElectronix.Server.Services.Interfaces;
using System.Text.RegularExpressions;

namespace SigmaElectronix.Server.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductService> _logger;

        public ProductService(ApplicationDbContext context, ILogger<ProductService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ====== Публичные методы ======

        public async Task<PagedResult<ProductListDto>> GetProductsAsync(ProductFilterDto filter)
        {
            var query = _context.Products
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => !p.IsDeleted && p.IsPublished)
                .AsNoTracking(); // Оптимизация для чтения

            query = ApplyFilters(query, filter);
            query = ApplySorting(query, filter.SortBy);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            // Маппинг выполняем в памяти после загрузки (чтобы не было проблем с переводом BrandDto в SQL)
            return new PagedResult<ProductListDto>
            {
                Items = items.Select(MapToListDto).ToList(),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<ProductDetailDto?> GetProductByIdAsync(int id)
        {
            var product = await _context.Products
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .Include(p => p.Images.OrderBy(i => i.SortOrder))
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

            return product == null ? null : MapToDetailDto(product);
        }

        public async Task<ProductDetailDto?> GetProductBySlugAsync(string slug)
        {
            var product = await _context.Products
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .Include(p => p.Images.OrderBy(i => i.SortOrder))
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Slug == slug && !p.IsDeleted && p.IsPublished);

            return product == null ? null : MapToDetailDto(product);
        }

        public async Task<IEnumerable<ProductListDto>> GetFeaturedProductsAsync(int count = 8)
        {
            var products = await _context.Products
                .Where(p => !p.IsDeleted && p.IsPublished)
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .OrderByDescending(p => p.AverageRating)
                .ThenByDescending(p => p.ReviewsCount)
                .Take(count)
                .AsNoTracking()
                .ToListAsync();

            return products.Select(MapToListDto);
        }

        public async Task<IEnumerable<ProductListDto>> GetDiscountedProductsAsync(int count = 8)
        {
            var products = await _context.Products
                .Where(p => !p.IsDeleted && p.IsPublished && p.DiscountPrice.HasValue)
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .OrderByDescending(p => p.DiscountPrice)
                .Take(count)
                .AsNoTracking()
                .ToListAsync();

            return products.Select(MapToListDto);
        }

        public async Task<IEnumerable<ProductListDto>> GetRelatedProductsAsync(int productId, int count = 4)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return Enumerable.Empty<ProductListDto>();

            var related = await _context.Products
                .Where(p => p.Id != productId
                         && !p.IsDeleted
                         && p.IsPublished
                         && (p.CategoryId == product.CategoryId || p.BrandId == product.BrandId))
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .OrderByDescending(p => p.AverageRating)
                .Take(count)
                .AsNoTracking()
                .ToListAsync();

            return related.Select(MapToListDto);
        }

        public async Task<IEnumerable<ProductListDto>> GetNewArrivalsAsync(int count = 8)
        {
            // Считаем новинками только то, что добавлено за последние 30 дней
            var thresholdDate = DateTime.UtcNow.AddDays(-30);

            var products = await _context.Products
                .Where(p => !p.IsDeleted && p.IsPublished && p.CreatedAt >= thresholdDate) // 🎯 ДОБАВЛЕН ФИЛЬТР ПО ДАТЕ
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .OrderByDescending(p => p.CreatedAt)
                .Take(count)
                .AsNoTracking()
                .ToListAsync();

            return products.Select(MapToListDto);
        }

        // ====== Административные методы (CRUD) ======

        public async Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto)
        {
            var product = new Product
            {
                Name = dto.Name,
                Slug = await GenerateUniqueSlugAsync(dto.Slug, dto.Name),
                ShortDescription = dto.ShortDescription,
                FullDescription = dto.FullDescription,
                Price = dto.Price,
                DiscountPrice = dto.DiscountPrice,
                BrandId = dto.BrandId,
                CategoryId = dto.CategoryId,
                Specifications = dto.Specifications ?? new Dictionary<string, string>(),
                IsPublished = dto.IsPublished,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return (await GetProductByIdAsync(product.Id))!;
        }

        public async Task<ProductDetailDto?> UpdateProductAsync(int id, UpdateProductDto dto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || product.IsDeleted) return null;

            // Если имя или переданный slug изменились, генерируем новый slug
            var targetSlug = string.IsNullOrWhiteSpace(dto.Slug) ? dto.Name : dto.Slug;
            if (product.Name != dto.Name || product.Slug != targetSlug)
            {
                product.Slug = await GenerateUniqueSlugAsync(dto.Slug, dto.Name, id);
            }

            product.Name = dto.Name;
            product.ShortDescription = dto.ShortDescription;
            product.FullDescription = dto.FullDescription;
            product.Price = dto.Price;
            product.DiscountPrice = dto.DiscountPrice;
            product.BrandId = dto.BrandId;
            product.CategoryId = dto.CategoryId;
            product.Specifications = dto.Specifications ?? new Dictionary<string, string>();
            product.IsPublished = dto.IsPublished;

            await _context.SaveChangesAsync();
            return await GetProductByIdAsync(id);
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || product.IsDeleted) return false;

            product.IsDeleted = true; // Soft delete
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestoreProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || !product.IsDeleted) return false;

            product.IsDeleted = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResult<ProductListDto>> GetAllProductsAdminAsync(ProductFilterDto filter)
        {
            var query = _context.Products
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .AsNoTracking();

            query = ApplyFilters(query, filter);
            query = ApplySorting(query, filter.SortBy);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResult<ProductListDto>
            {
                Items = items.Select(MapToListDto).ToList(),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        // ====== Вспомогательные методы ======

        private IQueryable<Product> ApplyFilters(IQueryable<Product> query, ProductFilterDto filter)
        {
            if (filter.CategoryId.HasValue)
            {
                // Ищем товары в категории и всех её подкатегориях
                var categoryIds = GetCategoryAndAllSubCategoryIds(filter.CategoryId.Value);
                query = query.Where(p => categoryIds.Contains(p.CategoryId));
            }

            if (filter.BrandIds != null && filter.BrandIds.Any())
                query = query.Where(p => filter.BrandIds.Contains(p.BrandId));

            if (filter.MinPrice.HasValue)
                query = query.Where(p => (p.DiscountPrice ?? p.Price) >= filter.MinPrice.Value);

            if (filter.MaxPrice.HasValue)
                query = query.Where(p => (p.DiscountPrice ?? p.Price) <= filter.MaxPrice.Value);

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var search = filter.SearchQuery.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(search) ||
                    p.ShortDescription.ToLower().Contains(search));
            }

            // 🚀 РАЗБЛОКИРОВАНО: Фильтрация по характеристикам!
            // EF Core 8 Npgsql умеет транслировать это в мощные JSONB SQL-операторы
            if (filter.Specifications != null && filter.Specifications.Any())
            {
                foreach (var spec in filter.Specifications)
                {
                    var key = spec.Key;
                    var values = spec.Value; // Это наш List<string> со значениями

                    if (values == null || !values.Any())
                        continue;

                    // 1. Превращаем выбранные значения в готовые JSON-строки для поиска
                    var jsons = values
                        .Take(6) // Поддерживаем до 6 выбранных чекбоксов одной характеристики
                        .Select(val => System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string> { { key, val } }))
                        .ToList();

                    // 2. Создаем "пустышку", которая гарантированно не совпадет ни с одним товаром
                    var dummyJson = "{\"__DUMMY_KEY__\":\"__DUMMY_VALUE__\"}";

                    // 3. Заполняем слоты поиска (если значений меньше 6, лишние слоты будут пустышками)
                    var j0 = jsons.Count > 0 ? jsons[0] : dummyJson;
                    var j1 = jsons.Count > 1 ? jsons[1] : dummyJson;
                    var j2 = jsons.Count > 2 ? jsons[2] : dummyJson;
                    var j3 = jsons.Count > 3 ? jsons[3] : dummyJson;
                    var j4 = jsons.Count > 4 ? jsons[4] : dummyJson;
                    var j5 = jsons.Count > 5 ? jsons[5] : dummyJson;

                    // 4. Формируем SQL-запрос с логикой OR (ИЛИ) для текущей группы.
                    // PostgreSQL безупречно и молниеносно обрабатывает это через JSONB оператор @>
                    query = query.Where(p =>
                        EF.Functions.JsonContains(p.Specifications, j0) ||
                        EF.Functions.JsonContains(p.Specifications, j1) ||
                        EF.Functions.JsonContains(p.Specifications, j2) ||
                        EF.Functions.JsonContains(p.Specifications, j3) ||
                        EF.Functions.JsonContains(p.Specifications, j4) ||
                        EF.Functions.JsonContains(p.Specifications, j5)
                    );
                }
            }

            return query;
        }

        // 🚀 НОВЫЙ МЕТОД: Сбор доступных фильтров для фронтенда
        public async Task<CategoryFilterDto> GetAvailableFiltersAsync(int? categoryId)
        {
            var query = _context.Products.Where(p => !p.IsDeleted && p.IsPublished);

            if (categoryId.HasValue)
            {
                var categoryIds = GetCategoryAndAllSubCategoryIds(categoryId.Value);
                query = query.Where(p => categoryIds.Contains(p.CategoryId));
            }

            // 1. Получаем реальную минимальную и максимальную цену в этой категории
            var minPrice = await query.MinAsync(p => (decimal?)(p.DiscountPrice ?? p.Price)) ?? 0;
            var maxPrice = await query.MaxAsync(p => (decimal?)(p.DiscountPrice ?? p.Price)) ?? 200000;

            // 2. Получаем только те бренды, товары которых реально есть в этой категории
            var brands = await query
                .Where(p => p.Brand != null)
                .Select(p => p.Brand)
                .Distinct()
                .Select(b => new BrandSummaryDto { Id = b.Id, Name = b.Name })
                .ToListAsync();

            // 3. Вытаскиваем все спецификации (JSON) из найденных товаров и собираем уникальные значения
            var allSpecs = await query.Select(p => p.Specifications).ToListAsync();
            var specDict = new Dictionary<string, HashSet<string>>();

            foreach (var dict in allSpecs)
            {
                if (dict == null) continue;
                foreach (var kvp in dict)
                {
                    if (!specDict.ContainsKey(kvp.Key))
                        specDict[kvp.Key] = new HashSet<string>();

                    specDict[kvp.Key].Add(kvp.Value);
                }
            }

            return new CategoryFilterDto
            {
                MinPrice = minPrice,
                MaxPrice = maxPrice,
                Brands = brands,
                // Переводим HashSet (уникальные значения) обратно в List для JSON
                Specifications = specDict.ToDictionary(k => k.Key, v => v.Value.OrderBy(val => val).ToList())
            };
        }

        private IQueryable<Product> ApplySorting(IQueryable<Product> query, string? sortBy)
        {
            return sortBy?.ToLower() switch
            {
                "price_asc" => query.OrderBy(p => p.DiscountPrice ?? p.Price),
                "price_desc" => query.OrderByDescending(p => p.DiscountPrice ?? p.Price),
                "rating" => query.OrderByDescending(p => p.AverageRating).ThenByDescending(p => p.ReviewsCount),
                "popular" => query.OrderByDescending(p => p.ReviewsCount),
                "name" => query.OrderBy(p => p.Name),
                _ => query.OrderByDescending(p => p.CreatedAt) // newest
            };
        }

        // Асинхронная проверка уникальности Slug в базе данных
        private async Task<string> GenerateUniqueSlugAsync(string? customSlug, string name, int? excludeId = null)
        {
            string baseSlug = string.IsNullOrWhiteSpace(customSlug) ? name : customSlug;

            // Очистка строки
            baseSlug = baseSlug.ToLowerInvariant();
            baseSlug = Regex.Replace(baseSlug, @"[^a-z0-9\s-]", "");
            baseSlug = Regex.Replace(baseSlug, @"\s+", "-").Trim('-');

            string finalSlug = baseSlug;
            int counter = 1;

            // Цикл проверяет, есть ли такой slug в БД (исключая текущий товар при Update)
            while (await _context.Products.AnyAsync(p => p.Slug == finalSlug && p.Id != excludeId))
            {
                finalSlug = $"{baseSlug}-{counter}";
                counter++;
            }

            return finalSlug;
        }

        // Исправленный метод (возвращает именно ProductDetailDto и мапит объект Brand)
        private ProductDetailDto MapToDetailDto(Product p)
        {
            return new ProductDetailDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                ShortDescription = p.ShortDescription,
                FullDescription = p.FullDescription,
                Price = p.Price,
                DiscountPrice = p.DiscountPrice,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? string.Empty,

                // Создаем объект BrandDto
                Brand = p.Brand != null ? new BrandSummaryDto
                {
                    Id = p.Brand.Id,
                    Name = p.Brand.Name,
                    Slug = p.Brand.Slug,
                    // Если у BrandDto есть LogoUrl, добавьте его сюда
                } : null!,

                Specifications = p.Specifications ?? new Dictionary<string, string>(),
                AverageRating = p.AverageRating,
                ReviewsCount = p.ReviewsCount,

                // Обязательно вызываем .ToList() для List<ProductImageDto>
                Images = p.Images.Select(i => new ProductImageDto
                {
                    Id = i.Id,
                    Url = i.Url,
                    AltText = i.AltText,
                    SortOrder = i.SortOrder,
                    IsPrimary = i.IsPrimary
                }).ToList(),

                CreatedAt = p.CreatedAt
            };
        }


        // Исправленный метод для списков
        // Исправленный метод для списков
        private ProductListDto MapToListDto(Product p)
        {
            // 🎯 Считаем товар новинкой, если он добавлен менее 90 дней назад
            // (Ты можешь поменять 90 на любое количество дней, подходящее для твоего магазина)
            var thresholdDate = DateTime.UtcNow.AddDays(-30);

            return new ProductListDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                ShortDescription = p.ShortDescription,
                Price = p.Price,
                DiscountPrice = p.DiscountPrice,
                CategoryName = p.Category?.Name ?? string.Empty,

                Brand = p.Brand != null ? new BrandSummaryDto
                {
                    Id = p.Brand.Id,
                    Name = p.Brand.Name,
                    Slug = p.Brand.Slug
                } : null!,

                AverageRating = p.AverageRating,
                ReviewsCount = p.ReviewsCount,
                IsPublished = p.IsPublished,

                // 🎯 Устанавливаем флаг "Новинка" на основе даты создания
                IsNew = p.CreatedAt >= thresholdDate,

                MainImageUrl = p.Images?.FirstOrDefault(i => i.IsPrimary)?.Url
                              ?? p.Images?.FirstOrDefault()?.Url ?? string.Empty
            };
        }

        private List<int> GetCategoryAndAllSubCategoryIds(int categoryId)
        {
            // Сразу добавляем родительскую категорию в список
            var result = new List<int> { categoryId };

            // Загружаем ВСЕ категории из БД один раз (только нужные поля для скорости)
            // Это намного быстрее, чем делать отдельный SQL-запрос для каждого уровня вложенности
            var allCategories = _context.Categories
                .AsNoTracking()
                .Select(c => new { c.Id, c.ParentCategoryId })
                .ToList();

            // Создаем локальную рекурсивную функцию
            void FindChildren(int parentId)
            {
                // Находим всех детей текущей категории
                var children = allCategories
                    .Where(c => c.ParentCategoryId == parentId)
                    .Select(c => c.Id)
                    .ToList();

                // Добавляем их в общий список и ищем детей для каждого ребенка
                foreach (var childId in children)
                {
                    result.Add(childId);
                    FindChildren(childId); // Рекурсия!
                }
            }

            // Запускаем поиск, начиная с выбранной категории
            FindChildren(categoryId);

            return result;
        }
    }
}