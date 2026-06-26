using SigmaElectronix.Server.Common;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.BrandDTOs;
using SigmaElectronix.Server.DTOs.ProductDTOs;
using SigmaElectronix.Server.Entities.BrandModels;
using SigmaElectronix.Server.Entities.ProductModels;
using SigmaElectronix.Server.Services.Interfaces;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // 🚀 Требуется для работы с заголовками HTTP
using System.Linq;

namespace SigmaElectronix.Server.Services
{
    public class BrandService : IBrandService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BrandService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor; // 🚀
        private const string DefaultLanguage = "ru"; // 🎯 Дефолтный язык (фоллбэк)

        public BrandService(
            ApplicationDbContext context,
            ILogger<BrandService> logger,
            IHttpContextAccessor httpContextAccessor) // 🚀 Инжектим HttpContextAccessor
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        // 🚀 Хелпер для получения языка из заголовка запроса (от Angular)
        private string GetCurrentLanguage()
        {
            var lang = _httpContextAccessor.HttpContext?.Request.Headers["Accept-Language"].ToString();

            if (string.IsNullOrEmpty(lang))
                return DefaultLanguage;

            // Вытаскиваем чистый код (например, "ru-RU,ru;q=0.9" -> "ru")
            var firstLang = lang.Split(',')[0].Trim();
            return firstLang.Split('-')[0].ToLower();
        }

        // 1. Получение списка всех активных брендов с пагинацией
        public async Task<PagedResult<BrandListDto>> GetBrandsAsync(int pageNumber = 1, int pageSize = 20, string? searchQuery = null, string? sortBy = null)
        {
            var currentLang = GetCurrentLanguage(); // 🚀 Узнаем, что просит клиент
            var query = _context.Brands.AsQueryable();

            // 1. ПОИСК (ищем в таблице переводов по текущему ИЛИ дефолтному языку)
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var search = searchQuery.ToLower();
                query = query.Where(b => b.Translations.Any(t =>
                    (t.LanguageCode == currentLang || t.LanguageCode == DefaultLanguage) &&
                    (t.Name.ToLower().Contains(search) || (t.Description != null && t.Description.ToLower().Contains(search)))
                ));
            }

            // 🚀 Выражение для извлечения имени (чтобы сортировать по актуальному языку)
            System.Linq.Expressions.Expression<Func<Brand, string?>> nameSelector = b =>
                b.Translations.Where(t => t.LanguageCode == currentLang).Select(t => t.Name).FirstOrDefault() ??
                b.Translations.Where(t => t.LanguageCode == DefaultLanguage).Select(t => t.Name).FirstOrDefault() ??
                b.Translations.Select(t => t.Name).FirstOrDefault();

            // 2. СОРТИРОВКА
            query = sortBy?.ToLower() switch
            {
                "name_desc" => query.OrderByDescending(nameSelector),
                "status_asc" => query.OrderBy(b => b.IsActive),
                "status_desc" => query.OrderByDescending(b => b.IsActive),
                "featured_asc" => query.OrderBy(b => b.IsFeatured),
                "featured_desc" => query.OrderByDescending(b => b.IsFeatured),
                "count_asc" => query.OrderBy(b => b.Products.Count(p => !p.IsDeleted && p.IsPublished)),
                "count_desc" => query.OrderByDescending(b => b.Products.Count(p => !p.IsDeleted && p.IsPublished)),
                _ => query.OrderBy(nameSelector) // "name_asc" по умолчанию
            };

            var totalCount = await query.CountAsync();

            // Разбиваем запрос: сначала SQL, потом сборка DTO в памяти
            var rawItems = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new {
                    Brand = b,
                    Translation = b.Translations.FirstOrDefault(t => t.LanguageCode == currentLang) ??
                                  b.Translations.FirstOrDefault(t => t.LanguageCode == DefaultLanguage) ??
                                  b.Translations.FirstOrDefault(),
                    ProductsCount = b.Products.Count(p => !p.IsDeleted && p.IsPublished),
                    TranslationsCount = b.Translations.Count  // 👈 НОВОЕ
                })
                .AsNoTracking()
                .ToListAsync();

            var items = rawItems.Select(x => new BrandListDto
            {
                Id = x.Brand.Id,
                Name = x.Translation?.Name ?? "Unknown",
                Slug = x.Translation?.Slug ?? "",
                LogoUrl = x.Brand.LogoUrl,
                HeroImageUrl = x.Brand.HeroImageUrl,
                ShortDescription = x.Translation?.Description != null && x.Translation.Description.Length > 150
                    ? x.Translation.Description.Substring(0, 147) + "..."
                    : x.Translation?.Description ?? "",
                ProductsCount = x.ProductsCount,
                IsFeatured = x.Brand.IsFeatured,
                IsActive = x.Brand.IsActive,
                // 👇 НОВОЕ: минус базовый язык (ru)
                TranslationsCount = Math.Max(0, x.TranslationsCount - 1)
            }).ToList();

            return new PagedResult<BrandListDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        // 2. Получение популярных брендов для карусели на главной
        public async Task<IEnumerable<BrandSummaryDto>> GetFeaturedBrandsAsync(int count = 6)
        {
            var currentLang = GetCurrentLanguage();

            var rawItems = await _context.Brands
                .Where(b => b.IsActive && b.IsFeatured)
                .OrderBy(b => Guid.NewGuid())
                .Take(count)
                .Select(b => new {
                    Brand = b,
                    Translation = b.Translations.FirstOrDefault(t => t.LanguageCode == currentLang) ??
                                  b.Translations.FirstOrDefault(t => t.LanguageCode == DefaultLanguage) ??
                                  b.Translations.FirstOrDefault()
                })
                .AsNoTracking()
                .ToListAsync();

            return rawItems.Select(x => new BrandSummaryDto
            {
                Id = x.Brand.Id,
                Name = x.Translation?.Name ?? "Unknown",
                Slug = x.Translation?.Slug ?? "",
                LogoUrl = x.Brand.LogoUrl
            }).ToList();
        }

        // 3. Тяжелый метод: Загрузка полной витрины бренда (Showcase)
        public async Task<BrandShowcaseDto?> GetBrandBySlugAsync(string slug)
        {
            var currentLang = GetCurrentLanguage();

            // 🔥 ИЗМЕНЕНИЕ: Ищем бренд, у которого ЕСТЬ такой слаг в ЛЮБОМ переводе.
            // Убрали жесткую проверку (t.LanguageCode == currentLang || t.LanguageCode == DefaultLanguage)
            var brand = await _context.Brands
                .Include(b => b.Images)
                .Include(b => b.Translations)
                .FirstOrDefaultAsync(b => b.Translations.Any(t => t.Slug == slug) && b.IsActive);

            if (brand == null) return null;

            // А вот здесь мы уже выбираем перевод именно для ТЕКУЩЕГО языка клиента
            var brandTranslation = brand.Translations.FirstOrDefault(t => t.LanguageCode == currentLang)
                                ?? brand.Translations.FirstOrDefault(t => t.LanguageCode == DefaultLanguage)
                                ?? brand.Translations.FirstOrDefault();

            var activeProducts = await _context.Products
                .Include(p => p.Category)
                    .ThenInclude(c => c!.Translations)
                .Include(p => p.Images)
                .Include(p => p.Translations)
                .Where(p => p.BrandId == brand.Id && !p.IsDeleted && p.IsPublished)
                .ToListAsync();

            var categories = activeProducts
                .GroupBy(p => p.Category)
                .Select(g => {
                    var catTranslation = g.Key?.Translations?.FirstOrDefault(t => t.LanguageCode == currentLang)
                                      ?? g.Key?.Translations?.FirstOrDefault(t => t.LanguageCode == DefaultLanguage)
                                      ?? g.Key?.Translations?.FirstOrDefault();
                    return new BrandCategoryDto
                    {
                        CategoryId = g.Key!.Id,
                        CategoryName = catTranslation?.Name ?? "Unknown",
                        CategorySlug = catTranslation?.Slug ?? "",
                        IconUrl = g.Key.ImageUrl,
                        Icon = g.Key.Icon,
                        ProductsCount = g.Count()
                    };
                })
                .OrderByDescending(c => c.ProductsCount)
                .ToList();

            var featuredProducts = activeProducts
                .OrderByDescending(p => p.AverageRating)
                .ThenByDescending(p => p.ReviewsCount)
                .Take(8)
                .Select(p => MapProductToListDto(p, currentLang)) // 🚀 Передаем язык
                .ToList();

            return new BrandShowcaseDto
            {
                Id = brand.Id,
                Name = brandTranslation?.Name ?? "Unknown",
                Slug = brandTranslation?.Slug ?? "",
                LogoUrl = brand.LogoUrl,
                Description = brandTranslation?.Description ?? "",
                HeroImageUrl = brand.HeroImageUrl,
                HeroTitle = brandTranslation?.HeroTitle,
                HeroSubtitle = brandTranslation?.HeroSubtitle,
                BannerButtonText = brandTranslation?.BannerButtonText,
                Images = brand.Images.Select(i => new BrandImageDto
                {
                    Id = i.Id,
                    Url = i.Url,
                    AltText = i.AltText,
                    Caption = i.Caption,
                    SortOrder = i.SortOrder,
                    ImageType = i.ImageType
                }).OrderBy(i => i.SortOrder).ToList(),
                Categories = categories,
                FeaturedProducts = featuredProducts,
                TotalProductsCount = activeProducts.Count,
                IsFeatured = brand.IsFeatured,
                IsActive = brand.IsActive,
                // 👇 НОВОЕ: возвращаем ВСЕ переводы
                Translations = brand.Translations.Select(t => new BrandTranslationDto
                {
                    LanguageCode = t.LanguageCode,
                    Name = t.Name,
                    Slug = t.Slug,
                    Description = t.Description ?? "",
                    HeroTitle = t.HeroTitle,
                    HeroSubtitle = t.HeroSubtitle,
                    BannerButtonText = t.BannerButtonText
                }).ToList()
            };
        }

        // 4. Создание нового бренда (Админка)
        public async Task<BrandSummaryDto> CreateBrandAsync(CreateBrandDto dto)
        {
            // 1. Создаем "тушку" бренда (общие поля)
            var brand = new Brand
            {
                LogoUrl = dto.LogoUrl,
                HeroImageUrl = dto.HeroImageUrl,
                IsFeatured = dto.IsFeatured,
                IsActive = dto.IsActive
            };

            _context.Brands.Add(brand);
            await _context.SaveChangesAsync(); // Сохраняем, чтобы получить brand.Id

            // 2. Перебираем все переводы из массива
            foreach (var transDto in dto.Translations)
            {
                var slug = string.IsNullOrWhiteSpace(transDto.Slug)
                    ? GenerateSlug(transDto.Name)
                    : GenerateSlug(transDto.Slug);

                // Проверяем уникальность slug именно для этого языка
                if (await _context.BrandTranslations.AnyAsync(bt => bt.Slug == slug && bt.LanguageCode == transDto.LanguageCode))
                {
                    slug = $"{slug}-{Guid.NewGuid().ToString().Substring(0, 5)}";
                }

                var translation = new BrandTranslation
                {
                    BrandId = brand.Id,
                    LanguageCode = transDto.LanguageCode,
                    Name = transDto.Name,
                    Slug = slug,
                    Description = transDto.Description,
                    HeroTitle = transDto.HeroTitle,
                    HeroSubtitle = transDto.HeroSubtitle,
                    BannerButtonText = transDto.BannerButtonText
                };

                _context.BrandTranslations.Add(translation);
            }

            await _context.SaveChangesAsync(); // Сохраняем все переводы одной транзакцией

            // Возвращаем базовую инфу (обычно по дефолтному языку)
            var defaultTranslation = dto.Translations.FirstOrDefault(t => t.LanguageCode == "ru") ?? dto.Translations.First();

            return new BrandSummaryDto
            {
                Id = brand.Id,
                Name = defaultTranslation.Name,
                Slug = defaultTranslation.Slug ?? "",
                LogoUrl = brand.LogoUrl
            };
        }

        // 5. Редактирование бренда (Админка)
        public async Task<BrandSummaryDto?> UpdateBrandAsync(int id, UpdateBrandDto dto)
        {
            var brand = await _context.Brands
                .Include(b => b.Translations)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (brand == null) return null;

            brand.LogoUrl = dto.LogoUrl;
            brand.HeroImageUrl = dto.HeroImageUrl;
            brand.IsFeatured = dto.IsFeatured;
            brand.IsActive = dto.IsActive;

            foreach (var transDto in dto.Translations)
            {
                var targetSlug = string.IsNullOrWhiteSpace(transDto.Slug)
                    ? GenerateSlug(transDto.Name)
                    : GenerateSlug(transDto.Slug);

                var existingTranslation = brand.Translations.FirstOrDefault(t => t.LanguageCode == transDto.LanguageCode);

                if (existingTranslation != null)
                {
                    if (existingTranslation.Slug != targetSlug)
                    {
                        if (await _context.BrandTranslations.AnyAsync(bt => bt.BrandId != id && bt.Slug == targetSlug && bt.LanguageCode == transDto.LanguageCode))
                        {
                            targetSlug = $"{targetSlug}-{Guid.NewGuid().ToString().Substring(0, 5)}";
                        }
                    }

                    existingTranslation.Name = transDto.Name;
                    existingTranslation.Slug = targetSlug;
                    existingTranslation.Description = transDto.Description;
                    existingTranslation.HeroTitle = transDto.HeroTitle;
                    existingTranslation.HeroSubtitle = transDto.HeroSubtitle;
                    existingTranslation.BannerButtonText = transDto.BannerButtonText;
                }
                else
                {
                    if (await _context.BrandTranslations.AnyAsync(bt => bt.Slug == targetSlug && bt.LanguageCode == transDto.LanguageCode))
                    {
                        targetSlug = $"{targetSlug}-{Guid.NewGuid().ToString().Substring(0, 5)}";
                    }

                    brand.Translations.Add(new BrandTranslation
                    {
                        BrandId = brand.Id,
                        LanguageCode = transDto.LanguageCode,
                        Name = transDto.Name,
                        Slug = targetSlug,
                        Description = transDto.Description,
                        HeroTitle = transDto.HeroTitle,
                        HeroSubtitle = transDto.HeroSubtitle,
                        BannerButtonText = transDto.BannerButtonText
                    });
                }
            }

            await _context.SaveChangesAsync();

            var firstTranslation = brand.Translations.FirstOrDefault(t => t.LanguageCode == "ru") ?? brand.Translations.First();

            return new BrandSummaryDto
            {
                Id = brand.Id,
                Name = firstTranslation.Name,
                Slug = firstTranslation.Slug,
                LogoUrl = brand.LogoUrl
            };
        }

        // 6. Удаление бренда
        public async Task<bool> DeleteBrandAsync(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return false;

            var hasProducts = await _context.Products.AnyAsync(p => p.BrandId == id && !p.IsDeleted);
            if (hasProducts)
            {
                brand.IsActive = false;
            }
            else
            {
                _context.Brands.Remove(brand);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        private string GenerateSlug(string text)
        {
            string str = text.ToLowerInvariant();
            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            str = Regex.Replace(str, @"\s+", " ").Trim();
            str = Regex.Replace(str, @"\s", "-");
            return str;
        }

        // 🚀 Обновил: принимает currentLang
        private ProductListDto MapProductToListDto(Product p, string currentLang)
        {
            var productTranslation = p.Translations?.FirstOrDefault(t => t.LanguageCode == currentLang)
                                  ?? p.Translations?.FirstOrDefault(t => t.LanguageCode == DefaultLanguage)
                                  ?? p.Translations?.FirstOrDefault();

            var categoryTranslation = p.Category?.Translations?.FirstOrDefault(t => t.LanguageCode == currentLang)
                                   ?? p.Category?.Translations?.FirstOrDefault(t => t.LanguageCode == DefaultLanguage)
                                   ?? p.Category?.Translations?.FirstOrDefault();

            return new ProductListDto
            {
                Id = p.Id,
                Name = productTranslation?.Name ?? "Unknown",
                Slug = productTranslation?.Slug ?? "",
                ShortDescription = productTranslation?.ShortDescription ?? "",
                Price = p.Price,
                DiscountPrice = p.DiscountPrice,
                CategoryName = categoryTranslation?.Name ?? string.Empty,
                AverageRating = p.AverageRating,
                ReviewsCount = p.ReviewsCount,
                MainImageUrl = p.Images?.FirstOrDefault(i => i.IsPrimary)?.Url
                               ?? p.Images?.FirstOrDefault()?.Url ?? string.Empty
            };
        }

        public async Task<bool> ToggleActiveStatusAsync(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return false;

            brand.IsActive = !brand.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleFeaturedStatusAsync(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return false;

            brand.IsFeatured = !brand.IsFeatured;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}