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
        public async Task<PagedResult<BrandListDto>> GetBrandsAsync(int pageNumber = 1, int pageSize = 20)
        {
            var query = _context.Brands
                .Where(b => b.IsActive)
                .OrderBy(b => b.SortOrder)
                .ThenBy(b => b.Name)
                .AsNoTracking();

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
                    // Обрезаем описание до 150 символов для превью в списке
                    ShortDescription = b.Description.Length > 150
                        ? b.Description.Substring(0, 147) + "..."
                        : b.Description,
                    // Считаем только живые опубликованные товары бренда
                    ProductsCount = _context.Products.Count(p => p.BrandId == b.Id && !p.IsDeleted && p.IsPublished),
                    IsFeatured = b.IsFeatured
                })
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
                .OrderBy(b => Guid.NewGuid()) // 🔥 ВОТ СЕКРЕТ: Случайная сортировка при каждом запросе
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
                    IconUrl = g.Key.ImageUrl, // Используем ImageUrl категории как иконку
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
                SeoTitle = brand.SeoTitle,
                SeoDescription = brand.SeoDescription,
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
                SeoTitle = dto.SeoTitle,
                SeoDescription = dto.SeoDescription,
                SeoKeywords = dto.SeoKeywords,
                IsFeatured = dto.IsFeatured,
                IsActive = dto.IsActive,
                SortOrder = dto.SortOrder
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
            brand.SeoTitle = dto.SeoTitle;
            brand.SeoDescription = dto.SeoDescription;
            brand.SeoKeywords = dto.SeoKeywords;
            brand.IsFeatured = dto.IsFeatured;
            brand.IsActive = dto.IsActive;
            brand.SortOrder = dto.SortOrder;

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

            // Так как у нас нет флага IsDeleted в модели Brand (судя по файлам),
            // мы можем либо просто деактивировать его (IsActive = false), либо удалить физически,
            // предварительно проверив, нет ли привязанных товаров. 
            // Сделаем безопасное удаление через проверку зависимостей:
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
            // Делаем базовую замену пробелов и спецсимволов. 
            // Так как бренды электроники в основном на английском (Apple, Samsung), регулярка очистит всё лишнее.
            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            str = Regex.Replace(str, @"\s+", " ").Trim();
            str = Regex.Replace(str, @"\s", "-");
            return str;
        }

        // Маппинг товара в ProductListDto (аналогично вашему методу из ProductService)
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
    }
}
