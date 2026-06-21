using SigmaElectronix.Server.Common;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.BrandDTOs;
using SigmaElectronix.Server.DTOs.ProductDTOs;
using SigmaElectronix.Server.Entities.BrandModels;
using SigmaElectronix.Server.Entities.ProductModels;
using SigmaElectronix.Server.Services.Interfaces;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace SigmaElectronix.Server.Services
{
    public class BrandService : IBrandService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BrandService> _logger;

        public BrandService(ApplicationDbContext context, ILogger<BrandService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // 1. Получение списка всех активных брендов с пагинацией
        public async Task<PagedResult<BrandListDto>> GetBrandsAsync(int pageNumber = 1, int pageSize = 20, string? searchQuery = null, string? sortBy = null)
        {
            var query = _context.Brands.AsQueryable();

            // 1. ПОИСК
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var search = searchQuery.ToLower();
                query = query.Where(b => b.Name.ToLower().Contains(search) || b.Description.ToLower().Contains(search));
            }

            // 2. СОРТИРОВКА
            query = sortBy?.ToLower() switch
            {
                "name_desc" => query.OrderByDescending(b => b.Name),
                "status_asc" => query.OrderBy(b => b.IsActive),
                "status_desc" => query.OrderByDescending(b => b.IsActive),
                "featured_asc" => query.OrderBy(b => b.IsFeatured),
                "featured_desc" => query.OrderByDescending(b => b.IsFeatured),

                // 👇 ДОБАВЛЕНА СОРТИРОВКА ПО КОЛИЧЕСТВУ ТОВАРОВ
                "count_asc" => query.OrderBy(b => b.Products.Count(p => !p.IsDeleted && p.IsPublished)),
                "count_desc" => query.OrderByDescending(b => b.Products.Count(p => !p.IsDeleted && p.IsPublished)),

                _ => query.OrderBy(b => b.Name) // "name_asc" по умолчанию
            };

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BrandListDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    Slug = b.Slug,
                    LogoUrl = b.LogoUrl,
                    HeroImageUrl = b.HeroImageUrl,
                    ShortDescription = b.Description.Length > 150 ? b.Description.Substring(0, 147) + "..." : b.Description,
                    ProductsCount = _context.Products.Count(p => p.BrandId == b.Id && !p.IsDeleted && p.IsPublished),
                    IsFeatured = b.IsFeatured,
                    IsActive = b.IsActive
                })
                .AsNoTracking()
                .ToListAsync();

            return new PagedResult<BrandListDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        // 2. Получение популярных брендов для карусели на главной (Случайный порядок)
        public async Task<IEnumerable<BrandSummaryDto>> GetFeaturedBrandsAsync(int count = 6)
        {
            return await _context.Brands
                .Where(b => b.IsActive && b.IsFeatured)
                .OrderBy(b => Guid.NewGuid()) // Случайная сортировка при каждом запросе
                .Take(count)
                .Select(b => new BrandSummaryDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    Slug = b.Slug,
                    LogoUrl = b.LogoUrl
                })
                .AsNoTracking()
                .ToListAsync();
        }

        // 3. Тяжелый метод: Загрузка полной витрины бренда (Showcase) по его Slug
        public async Task<BrandShowcaseDto?> GetBrandBySlugAsync(string slug)
        {
            // Находим сам бренд и подтягиваем его галерею изображений
            var brand = await _context.Brands
                .Include(b => b.Images)
                .FirstOrDefaultAsync(b => b.Slug == slug && b.IsActive);

            if (brand == null) return null;

            // Вытаскиваем все активные товары этого бренда для агрегации данных
            var activeProducts = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.BrandId == brand.Id && !p.IsDeleted && p.IsPublished)
                .ToListAsync();

            // Формируем список категорий, в которых у бренда есть товары
            var categories = activeProducts
                .GroupBy(p => p.Category)
                .Select(g => new BrandCategoryDto
                {
                    CategoryId = g.Key.Id,
                    CategoryName = g.Key.Name,
                    CategorySlug = g.Key.Slug,
                    IconUrl = g.Key.ImageUrl,
                    Icon = g.Key.Icon, // 👈 Передаем системную иконку из сущности Category
                    ProductsCount = g.Count()
                })
                .OrderByDescending(c => c.ProductsCount)
                .ToList();

            // Выбираем популярные товары бренда (например, с наивысшим рейтингом) для блока "Популярное"
            var featuredProducts = activeProducts
                .OrderByDescending(p => p.AverageRating)
                .ThenByDescending(p => p.ReviewsCount)
                .Take(8)
                .Select(p => MapProductToListDto(p))
                .ToList();

            return new BrandShowcaseDto
            {
                Id = brand.Id,
                Name = brand.Name,
                Slug = brand.Slug,
                LogoUrl = brand.LogoUrl,
                Description = brand.Description,
                HeroImageUrl = brand.HeroImageUrl,
                HeroTitle = brand.HeroTitle,
                HeroSubtitle = brand.HeroSubtitle,
                BannerButtonText = brand.BannerButtonText,
                Images = brand.Images.Select(i => new BrandImageDto
                {
                    Id = i.Id,
                    Url = i.Url,
                    AltText = i.AltText,
                    Caption = i.Caption,
                    SortOrder = i.SortOrder,
                    ImageType = i.ImageType
                }).OrderBy(i => i.SortOrder),
                Categories = categories,
                FeaturedProducts = featuredProducts,
                TotalProductsCount = activeProducts.Count
            };
        }

        // 4. Создание нового бренда (Админка)
        public async Task<BrandSummaryDto> CreateBrandAsync(CreateBrandDto dto)
        {
            // Автоматически генерируем ЧПУ (Slug), если админ оставил поле пустым
            var slug = string.IsNullOrWhiteSpace(dto.Slug)
                ? GenerateSlug(dto.Name)
                : GenerateSlug(dto.Slug);

            // Проверяем уникальность Slug в базе
            if (await _context.Brands.AnyAsync(b => b.Slug == slug))
            {
                // Если такой slug занят, делаем его уникальным (добавляем суффикс)
                slug = $"{slug}-{Guid.NewGuid().ToString().Substring(0, 5)}";
            }

            var brand = new Brand
            {
                Name = dto.Name,
                Slug = slug,
                Description = dto.Description,
                LogoUrl = dto.LogoUrl,
                HeroImageUrl = dto.HeroImageUrl,
                HeroTitle = dto.HeroTitle,
                HeroSubtitle = dto.HeroSubtitle,
                BannerButtonText = dto.BannerButtonText,
                IsFeatured = dto.IsFeatured,
                IsActive = dto.IsActive
            };

            _context.Brands.Add(brand);
            await _context.SaveChangesAsync();

            return new BrandSummaryDto
            {
                Id = brand.Id,
                Name = brand.Name,
                Slug = brand.Slug,
                LogoUrl = brand.LogoUrl
            };
        }

        // 5. Редактирование бренда (Админка)
        public async Task<BrandSummaryDto?> UpdateBrandAsync(int id, UpdateBrandDto dto)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return null;

            // Если имя или slug поменялись, обновляем и валидируем Slug
            var targetSlug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : GenerateSlug(dto.Slug);
            if (brand.Slug != targetSlug)
            {
                if (await _context.Brands.AnyAsync(b => b.Id != id && b.Slug == targetSlug))
                {
                    targetSlug = $"{targetSlug}-{Guid.NewGuid().ToString().Substring(0, 5)}";
                }
                brand.Slug = targetSlug;
            }

            brand.Name = dto.Name;
            brand.Description = dto.Description;
            brand.LogoUrl = dto.LogoUrl;
            brand.HeroImageUrl = dto.HeroImageUrl;
            brand.HeroTitle = dto.HeroTitle;
            brand.HeroSubtitle = dto.HeroSubtitle;
            brand.BannerButtonText = dto.BannerButtonText;
            brand.IsFeatured = dto.IsFeatured;
            brand.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return new BrandSummaryDto
            {
                Id = brand.Id,
                Name = brand.Name,
                Slug = brand.Slug,
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
                // Если товары есть, бренд нельзя удалять из базы жестко — просто гасим его видимость
                brand.IsActive = false;
            }
            else
            {
                _context.Brands.Remove(brand);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // Вспомогательный метод для генерации безопасных URL (Slug)
        private string GenerateSlug(string text)
        {
            string str = text.ToLowerInvariant();
            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            str = Regex.Replace(str, @"\s+", " ").Trim();
            str = Regex.Replace(str, @"\s", "-");
            return str;
        }

        // Маппинг товара в ProductListDto
        private ProductListDto MapProductToListDto(Product p)
        {
            return new ProductListDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                ShortDescription = p.ShortDescription,
                Price = p.Price,
                DiscountPrice = p.DiscountPrice,
                CategoryName = p.Category?.Name ?? string.Empty,
                AverageRating = p.AverageRating,
                ReviewsCount = p.ReviewsCount,
                MainImageUrl = p.Images?.FirstOrDefault(i => i.IsPrimary)?.Url
                               ?? p.Images?.FirstOrDefault()?.Url ?? string.Empty
            };
        }

        // 7. Переключение статуса активности (Опубликован / Скрыт)
        public async Task<bool> ToggleActiveStatusAsync(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return false;

            brand.IsActive = !brand.IsActive; // Меняем на противоположный
            await _context.SaveChangesAsync();
            return true;
        }

        // 8. Переключение статуса "Популярный" (На главной)
        public async Task<bool> ToggleFeaturedStatusAsync(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return false;

            brand.IsFeatured = !brand.IsFeatured; // Меняем на противоположный
            await _context.SaveChangesAsync();
            return true;
        }
    }
}