using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Common;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.BrandDTOs;
using SigmaElectronix.Server.DTOs.ProductDTOs;
using SigmaElectronix.Server.Entities.ProductModels;
using SigmaElectronix.Server.Services.Interfaces;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using SigmaElectronix.Server.DTOs.CategoryDTOs;

namespace SigmaElectronix.Server.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private const string DefaultLanguage = "ru";

        public ProductService(
            ApplicationDbContext context,
            ILogger<ProductService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        // 🚀 Метод для динамического получения языка из заголовков Angular
        private string GetCurrentLanguage()
        {
            var langHeader = _httpContextAccessor.HttpContext?.Request.Headers["Accept-Language"].ToString();
            if (!string.IsNullOrEmpty(langHeader))
            {
                var primaryLang = langHeader.Split(',')[0].Split('-')[0].Trim().ToLower();
                if (primaryLang.Length >= 2)
                    return primaryLang.Substring(0, 2);

                return primaryLang;
            }
            return "ru"; // Fallback, если заголовок пустой
        }

        // ====== Публичные методы ======

        public async Task<PagedResult<ProductListDto>> GetProductsAsync(ProductFilterDto filter)
        {
            var lang = GetCurrentLanguage();

            var query = _context.Products
                .Include(p => p.Brand).ThenInclude(b => b.Translations)
                .Include(p => p.Category).ThenInclude(c => c.Translations)
                .Include(p => p.Images)
                .Include(p => p.Translations)
                .Include(p => p.Inventories) // 🚀 Подтягиваем остатки
                .Where(p => !p.IsDeleted && p.IsPublished)
                .AsNoTracking();

            query = ApplyFilters(query, filter, lang);
            query = ApplySorting(query, filter.SortBy, lang);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResult<ProductListDto>
            {
                Items = items.Select(i => MapToListDto(i, lang)).ToList(),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<ProductDetailDto?> GetProductByIdAsync(int id)
        {
            var lang = GetCurrentLanguage();

            var product = await _context.Products
                .Include(p => p.Brand).ThenInclude(b => b.Translations)
                .Include(p => p.Category).ThenInclude(c => c.Translations)
                .Include(p => p.Images.OrderBy(i => i.SortOrder))
                .Include(p => p.Translations)
                .Include(p => p.Inventories) // 🚀 Подтягиваем остатки
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

            return product == null ? null : MapToDetailDto(product, lang);
        }

        public async Task<ProductDetailDto?> GetProductBySlugAsync(string slug)
        {
            var lang = GetCurrentLanguage();

            // 🔥 ОПТИМИЗАЦИЯ: Ищем по ЛЮБОМУ слагу одним запросом!
            var product = await _context.Products
                .Include(p => p.Brand).ThenInclude(b => b.Translations)
                .Include(p => p.Category).ThenInclude(c => c.Translations)
                .Include(p => p.Images.OrderBy(i => i.SortOrder))
                .Include(p => p.Translations)
                .Include(p => p.Inventories)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Translations.Any(t => t.Slug == slug) && !p.IsDeleted && p.IsPublished);

            return product == null ? null : MapToDetailDto(product, lang);
        }

        public async Task<IEnumerable<ProductListDto>> GetFeaturedProductsAsync(int count = 8)
        {
            var lang = GetCurrentLanguage();

            var products = await _context.Products
                .Where(p => !p.IsDeleted && p.IsPublished)
                .Include(p => p.Brand).ThenInclude(b => b.Translations)
                .Include(p => p.Category).ThenInclude(c => c.Translations)
                .Include(p => p.Images)
                .Include(p => p.Translations)
                .Include(p => p.Inventories) // 🚀 Подтягиваем остатки
                .OrderByDescending(p => p.AverageRating)
                .ThenByDescending(p => p.ReviewsCount)
                .Take(count)
                .AsNoTracking()
                .ToListAsync();

            return products.Select(p => MapToListDto(p, lang));
        }

        public async Task<IEnumerable<ProductListDto>> GetDiscountedProductsAsync(int count = 8)
        {
            var lang = GetCurrentLanguage();

            var products = await _context.Products
                .Where(p => !p.IsDeleted && p.IsPublished && p.DiscountPrice.HasValue)
                .Include(p => p.Brand).ThenInclude(b => b.Translations)
                .Include(p => p.Category).ThenInclude(c => c.Translations)
                .Include(p => p.Images)
                .Include(p => p.Translations)
                .Include(p => p.Inventories) // 🚀 Подтягиваем остатки
                .OrderByDescending(p => p.DiscountPrice)
                .Take(count)
                .AsNoTracking()
                .ToListAsync();

            return products.Select(p => MapToListDto(p, lang));
        }

        public async Task<IEnumerable<ProductListDto>> GetRelatedProductsAsync(int productId, int count = 4)
        {
            var lang = GetCurrentLanguage();
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return Enumerable.Empty<ProductListDto>();

            var related = await _context.Products
                .Where(p => p.Id != productId && !p.IsDeleted && p.IsPublished && (p.CategoryId == product.CategoryId || p.BrandId == product.BrandId))
                .Include(p => p.Brand).ThenInclude(b => b.Translations)
                .Include(p => p.Category).ThenInclude(c => c.Translations)
                .Include(p => p.Images)
                .Include(p => p.Translations)
                .Include(p => p.Inventories) // 🚀 Подтягиваем остатки
                .OrderByDescending(p => p.AverageRating)
                .Take(count)
                .AsNoTracking()
                .ToListAsync();

            return related.Select(p => MapToListDto(p, lang));
        }

        public async Task<IEnumerable<ProductListDto>> GetNewArrivalsAsync(int count = 8)
        {
            var lang = GetCurrentLanguage();
            var thresholdDate = DateTime.UtcNow.AddDays(-30);

            var products = await _context.Products
                .Where(p => !p.IsDeleted && p.IsPublished && p.CreatedAt >= thresholdDate)
                .Include(p => p.Brand).ThenInclude(b => b.Translations)
                .Include(p => p.Category).ThenInclude(c => c.Translations)
                .Include(p => p.Images)
                .Include(p => p.Translations)
                .Include(p => p.Inventories) // 🚀 Подтягиваем остатки
                .OrderByDescending(p => p.CreatedAt)
                .Take(count)
                .AsNoTracking()
                .ToListAsync();

            return products.Select(p => MapToListDto(p, lang));
        }

        // ====== Административные методы (CRUD) ======

        public async Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto)
        {
            if (dto.Translations == null || !dto.Translations.Any())
                throw new ArgumentException("Товар должен иметь хотя бы один перевод.");

            var product = new Product
            {
                Price = dto.Price,
                DiscountPrice = dto.DiscountPrice,
                BrandId = dto.BrandId,
                CategoryId = dto.CategoryId,
                IsPublished = dto.IsPublished,
                CreatedAt = DateTime.UtcNow,
                Images = dto.Images?.Select(i => new ProductImage
                {
                    Url = i.Url,
                    IsPrimary = i.IsPrimary,
                    SortOrder = i.SortOrder,
                    AltText = i.AltText
                }).ToList() ?? new List<ProductImage>()
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            foreach (var transDto in dto.Translations)
            {
                var slug = await GenerateUniqueSlugAsync(transDto.Slug, transDto.Name, transDto.LanguageCode);

                var translation = new ProductTranslation
                {
                    ProductId = product.Id,
                    LanguageCode = transDto.LanguageCode,
                    Name = transDto.Name,
                    Slug = slug,
                    ShortDescription = transDto.ShortDescription ?? "",
                    FullDescription = transDto.FullDescription ?? "",
                    Specifications = transDto.Specifications ?? new Dictionary<string, string>(),
                    Tags = transDto.Tags ?? new List<string>()
                };
                _context.ProductTranslations.Add(translation);
            }

            await _context.SaveChangesAsync();
            return (await GetProductByIdAsync(product.Id))!;
        }

        public async Task<ProductDetailDto?> UpdateProductAsync(int id, UpdateProductDto dto)
        {
            var product = await _context.Products
                .Include(p => p.Images)
                .Include(p => p.Translations)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null || product.IsDeleted) return null;

            product.Price = dto.Price;
            product.DiscountPrice = dto.DiscountPrice;
            product.BrandId = dto.BrandId;
            product.CategoryId = dto.CategoryId;
            product.IsPublished = dto.IsPublished;

            _context.ProductImages.RemoveRange(product.Images);
            product.Images = dto.Images?.Select(i => new ProductImage
            {
                Url = i.Url,
                IsPrimary = i.IsPrimary,
                SortOrder = i.SortOrder,
                AltText = i.AltText
            }).ToList() ?? new List<ProductImage>();

            foreach (var transDto in dto.Translations)
            {
                var existingTrans = product.Translations.FirstOrDefault(t => t.LanguageCode == transDto.LanguageCode);
                var targetSlug = string.IsNullOrWhiteSpace(transDto.Slug) ? transDto.Name : transDto.Slug;

                if (existingTrans != null)
                {
                    if (existingTrans.Name != transDto.Name || existingTrans.Slug != targetSlug)
                        existingTrans.Slug = await GenerateUniqueSlugAsync(transDto.Slug, transDto.Name, transDto.LanguageCode, id);

                    existingTrans.Name = transDto.Name;
                    existingTrans.ShortDescription = transDto.ShortDescription ?? "";
                    existingTrans.FullDescription = transDto.FullDescription ?? "";
                    existingTrans.Specifications = transDto.Specifications ?? new Dictionary<string, string>();
                    existingTrans.Tags = transDto.Tags ?? new List<string>();
                }
                else
                {
                    var newSlug = await GenerateUniqueSlugAsync(transDto.Slug, transDto.Name, transDto.LanguageCode, id);
                    _context.ProductTranslations.Add(new ProductTranslation
                    {
                        ProductId = product.Id,
                        LanguageCode = transDto.LanguageCode,
                        Name = transDto.Name,
                        Slug = newSlug,
                        ShortDescription = transDto.ShortDescription ?? "",
                        FullDescription = transDto.FullDescription ?? "",
                        Specifications = transDto.Specifications ?? new Dictionary<string, string>(),
                        Tags = transDto.Tags ?? new List<string>()
                    });
                }
            }

            var incomingLangCodes = dto.Translations.Select(t => t.LanguageCode).ToList();
            var translationsToRemove = product.Translations.Where(t => !incomingLangCodes.Contains(t.LanguageCode)).ToList();
            _context.ProductTranslations.RemoveRange(translationsToRemove);

            await _context.SaveChangesAsync();
            return await GetProductByIdAsync(id);
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || product.IsDeleted) return false;

            product.IsDeleted = true;
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
            var lang = GetCurrentLanguage();

            var query = _context.Products
                .Where(p => !p.IsDeleted)
                .Include(p => p.Brand).ThenInclude(b => b.Translations)
                .Include(p => p.Category).ThenInclude(c => c.Translations)
                .Include(p => p.Images)
                .Include(p => p.Translations)
                .Include(p => p.Inventories) // 🚀 Подтягиваем остатки
                .AsNoTracking();

            query = ApplyFilters(query, filter, lang);
            query = ApplySorting(query, filter.SortBy, lang);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResult<ProductListDto>
            {
                Items = items.Select(p => MapToListDto(p, lang)).ToList(),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        // ====== Вспомогательные методы ======

        private IQueryable<Product> ApplyFilters(IQueryable<Product> query, ProductFilterDto filter, string lang)
        {
            if (filter.CategoryId.HasValue)
            {
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
                query = query.Where(p => p.Translations.Any(t =>
                    (t.LanguageCode == lang || t.LanguageCode == DefaultLanguage) && // 🔥 Ищем в текущем или базовом
                    (t.Name.ToLower().Contains(search) || t.ShortDescription.ToLower().Contains(search))
                ));
            }

            if (filter.Specifications != null && filter.Specifications.Any())
            {
                foreach (var spec in filter.Specifications)
                {
                    var key = spec.Key;
                    var values = spec.Value;

                    if (values == null || !values.Any())
                        continue;

                    var jsons = values
                        .Take(6)
                        .Select(val => System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string> { { key, val } }))
                        .ToList();

                    var dummyJson = "{\"__DUMMY_KEY__\":\"__DUMMY_VALUE__\"}";

                    var j0 = jsons.Count > 0 ? jsons[0] : dummyJson;
                    var j1 = jsons.Count > 1 ? jsons[1] : dummyJson;
                    var j2 = jsons.Count > 2 ? jsons[2] : dummyJson;
                    var j3 = jsons.Count > 3 ? jsons[3] : dummyJson;
                    var j4 = jsons.Count > 4 ? jsons[4] : dummyJson;
                    var j5 = jsons.Count > 5 ? jsons[5] : dummyJson;

                    query = query.Where(p => p.Translations.Any(t =>
                        (t.LanguageCode == lang || t.LanguageCode == DefaultLanguage) &&
                        (
                        EF.Functions.JsonContains(t.Specifications, j0) ||
                        EF.Functions.JsonContains(t.Specifications, j1) ||
                        EF.Functions.JsonContains(t.Specifications, j2) ||
                        EF.Functions.JsonContains(t.Specifications, j3) ||
                        EF.Functions.JsonContains(t.Specifications, j4) ||
                        EF.Functions.JsonContains(t.Specifications, j5)
                    )));
                }
            }

            return query;
        }

        public async Task<CategoryFilterDto> GetAvailableFiltersAsync(int? categoryId)
        {
            var lang = GetCurrentLanguage();
            var query = _context.Products.Where(p => !p.IsDeleted && p.IsPublished);

            if (categoryId.HasValue)
            {
                var categoryIds = GetCategoryAndAllSubCategoryIds(categoryId.Value);
                query = query.Where(p => categoryIds.Contains(p.CategoryId));
            }

            var minPrice = await query.MinAsync(p => (decimal?)(p.DiscountPrice ?? p.Price)) ?? 0;
            var maxPrice = await query.MaxAsync(p => (decimal?)(p.DiscountPrice ?? p.Price)) ?? 200000;

            var brands = await query
                .Where(p => p.Brand != null)
                .Select(p => p.Brand!)
                .Distinct()
                .Select(b => new BrandSummaryDto
                {
                    Id = b.Id,
                    Name = b.Translations.Where(t => t.LanguageCode == lang).Select(t => t.Name).FirstOrDefault() ??
                           b.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                           b.Translations.Select(t => t.Name).FirstOrDefault() ?? "Unknown",
                    Slug = b.Translations.Where(t => t.LanguageCode == lang).Select(t => t.Slug).FirstOrDefault() ??
                           b.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Slug).FirstOrDefault() ??
                           b.Translations.Select(t => t.Slug).FirstOrDefault() ?? "",
                    LogoUrl = b.LogoUrl
                })
                .ToListAsync();

            var allSpecs = await query
                .Select(p => p.Translations.Where(t => t.LanguageCode == lang).Select(t => t.Specifications).FirstOrDefault() ??
                             p.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Specifications).FirstOrDefault() ??
                             p.Translations.Select(t => t.Specifications).FirstOrDefault()) // 🔥 Фоллбэк для JSON
                .ToListAsync();

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
                Specifications = specDict.ToDictionary(k => k.Key, v => v.Value.OrderBy(val => val).ToList())
            };
        }

        private IQueryable<Product> ApplySorting(IQueryable<Product> query, string? sortBy, string lang)
        {
            // 🔥 Надежный фоллбэк: Текущий -> Русский -> Любой другой
            System.Linq.Expressions.Expression<Func<Product, string>> nameSelector = p =>
                p.Translations.Where(t => t.LanguageCode == lang).Select(t => t.Name).FirstOrDefault() ??
                p.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                p.Translations.Select(t => t.Name).FirstOrDefault() ?? "";

            System.Linq.Expressions.Expression<Func<Product, string>> brandNameSelector = p =>
                p.Brand != null ? (
                    p.Brand.Translations.Where(t => t.LanguageCode == lang).Select(t => t.Name).FirstOrDefault() ??
                    p.Brand.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                    p.Brand.Translations.Select(t => t.Name).FirstOrDefault() ?? ""
                ) : "";

            System.Linq.Expressions.Expression<Func<Product, string>> categoryNameSelector = p =>
                p.Category != null ? (
                    p.Category.Translations.Where(t => t.LanguageCode == lang).Select(t => t.Name).FirstOrDefault() ??
                    p.Category.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                    p.Category.Translations.Select(t => t.Name).FirstOrDefault() ?? ""
                ) : "";

            return sortBy?.ToLower() switch
            {
                "price_asc" => query.OrderBy(p => p.DiscountPrice ?? p.Price),
                "price_desc" => query.OrderByDescending(p => p.DiscountPrice ?? p.Price),
                "name_asc" => query.OrderBy(nameSelector),
                "name_desc" => query.OrderByDescending(nameSelector),
                "date_asc" => query.OrderBy(p => p.CreatedAt),
                "date_desc" => query.OrderByDescending(p => p.CreatedAt),
                "brand_asc" => query.OrderBy(brandNameSelector),
                "brand_desc" => query.OrderByDescending(brandNameSelector),
                "category_asc" => query.OrderBy(categoryNameSelector),
                "category_desc" => query.OrderByDescending(categoryNameSelector),
                "status_desc" => query.OrderByDescending(p => p.IsPublished),
                "status_asc" => query.OrderBy(p => p.IsPublished),
                "rating" => query.OrderByDescending(p => p.AverageRating).ThenByDescending(p => p.ReviewsCount),
                "popular" => query.OrderByDescending(p => p.ReviewsCount),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };
        }

        private async Task<string> GenerateUniqueSlugAsync(string? customSlug, string name, string langCode, int? excludeId = null)
        {
            string baseSlug = string.IsNullOrWhiteSpace(customSlug) ? name : customSlug;

            baseSlug = baseSlug.ToLowerInvariant();
            baseSlug = Regex.Replace(baseSlug, @"[^a-z0-9\s-]", "");
            baseSlug = Regex.Replace(baseSlug, @"\s+", "-").Trim('-');

            string finalSlug = baseSlug;
            int counter = 1;

            while (await _context.ProductTranslations.AnyAsync(pt => pt.Slug == finalSlug && pt.LanguageCode == langCode && pt.ProductId != excludeId))
            {
                finalSlug = $"{baseSlug}-{counter}";
                counter++;
            }

            return finalSlug;
        }

        private ProductDetailDto MapToDetailDto(Product p, string lang)
        {
            var pt = p.Translations?.FirstOrDefault(t => t.LanguageCode == lang) ??
                     p.Translations?.FirstOrDefault(t => t.LanguageCode == DefaultLanguage) ??
                     p.Translations?.FirstOrDefault();

            var ct = p.Category?.Translations?.FirstOrDefault(t => t.LanguageCode == lang) ??
                     p.Category?.Translations?.FirstOrDefault(t => t.LanguageCode == DefaultLanguage) ??
                     p.Category?.Translations?.FirstOrDefault();

            var bt = p.Brand?.Translations?.FirstOrDefault(t => t.LanguageCode == lang) ??
                     p.Brand?.Translations?.FirstOrDefault(t => t.LanguageCode == DefaultLanguage) ??
                     p.Brand?.Translations?.FirstOrDefault();

            return new ProductDetailDto
            {
                Id = p.Id,
                Name = pt?.Name ?? "Unknown",
                Slug = pt?.Slug ?? "",
                ShortDescription = pt?.ShortDescription ?? "",
                FullDescription = pt?.FullDescription ?? "",
                Price = p.Price,
                DiscountPrice = p.DiscountPrice,
                CategoryId = p.CategoryId,
                CategoryName = ct?.Name ?? string.Empty,

                Brand = p.Brand != null ? new BrandSummaryDto
                {
                    Id = p.Brand.Id,
                    Name = bt?.Name ?? "Unknown",
                    Slug = bt?.Slug ?? "",
                    LogoUrl = p.Brand.LogoUrl // 👈 ДОБАВИТЬ ЭТУ СТРОКУ
                } : null!,

                IsPublished = p.IsPublished,
                Specifications = pt?.Specifications ?? new Dictionary<string, string>(),
                Tags = pt?.Tags ?? new List<string>(),
                AverageRating = p.AverageRating,
                ReviewsCount = p.ReviewsCount,

                Images = p.Images.Select(i => new ProductImageDto
                {
                    Id = i.Id,
                    Url = i.Url,
                    AltText = i.AltText,
                    SortOrder = i.SortOrder,
                    IsPrimary = i.IsPrimary
                }).ToList(),

                CreatedAt = p.CreatedAt,

                Translations = p.Translations?.Select(t => new ProductTranslationDto
                {
                    LanguageCode = t.LanguageCode,
                    Name = t.Name,
                    Slug = t.Slug,
                    ShortDescription = t.ShortDescription,
                    FullDescription = t.FullDescription,
                    Specifications = t.Specifications ?? new Dictionary<string, string>(),
                    Tags = t.Tags?.ToList() ?? new List<string>()
                }).ToList() ?? new List<ProductTranslationDto>()
            };
        }

        private ProductListDto MapToListDto(Product p, string lang)
        {
            var thresholdDate = DateTime.UtcNow.AddDays(-30);
            var pt = p.Translations?.FirstOrDefault(t => t.LanguageCode == lang) ??
                     p.Translations?.FirstOrDefault(t => t.LanguageCode == DefaultLanguage) ??
                     p.Translations?.FirstOrDefault();

            var ct = p.Category?.Translations?.FirstOrDefault(t => t.LanguageCode == lang) ??
                     p.Category?.Translations?.FirstOrDefault(t => t.LanguageCode == DefaultLanguage) ??
                     p.Category?.Translations?.FirstOrDefault();

            var bt = p.Brand?.Translations?.FirstOrDefault(t => t.LanguageCode == lang) ??
                     p.Brand?.Translations?.FirstOrDefault(t => t.LanguageCode == DefaultLanguage) ??
                     p.Brand?.Translations?.FirstOrDefault();

            return new ProductListDto
            {
                Id = p.Id,
                Name = pt?.Name ?? "Unknown",
                Slug = pt?.Slug ?? "",
                ShortDescription = pt?.ShortDescription ?? "",
                Price = p.Price,
                DiscountPrice = p.DiscountPrice,
                CategoryName = ct?.Name ?? string.Empty,

                Brand = p.Brand != null ? new BrandSummaryDto
                {
                    Id = p.Brand.Id,
                    Name = bt?.Name ?? "Unknown",
                    Slug = bt?.Slug ?? "",
                    LogoUrl = p.Brand.LogoUrl // 👈 ДОБАВИТЬ ЭТУ СТРОКУ
                } : null!,

                AverageRating = p.AverageRating,
                ReviewsCount = p.ReviewsCount,
                IsPublished = p.IsPublished,
                IsNew = p.CreatedAt >= thresholdDate,
                CreatedAt = p.CreatedAt,

                MainImageUrl = p.Images?.FirstOrDefault(i => i.IsPrimary)?.Url
                              ?? p.Images?.FirstOrDefault()?.Url ?? string.Empty,

                TranslationsCount = Math.Max(0, (p.Translations?.Count() ?? 0) - 1),

                // 🚀 Считаем общее количество на всех складах/магазинах
                Quantity = p.Inventories?.Sum(i => i.Quantity) ?? 0
            };
        }

        private List<int> GetCategoryAndAllSubCategoryIds(int categoryId)
        {
            var result = new List<int> { categoryId };

            var allCategories = _context.Categories
                .AsNoTracking()
                .Select(c => new { c.Id, c.ParentCategoryId })
                .ToList();

            void FindChildren(int parentId)
            {
                var children = allCategories
                    .Where(c => c.ParentCategoryId == parentId)
                    .Select(c => c.Id)
                    .ToList();

                foreach (var childId in children)
                {
                    result.Add(childId);
                    FindChildren(childId);
                }
            }

            FindChildren(categoryId);
            return result;
        }

        public async Task<bool> TogglePublishStatusAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || product.IsDeleted) return false;

            product.IsPublished = !product.IsPublished;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}