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
                query = query.Where(p => p.CategoryId == filter.CategoryId.Value);

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

            // Фильтрация по словарю (Specifications) в БД работает только 
            // если словарь сериализуется в JSON и БД поддерживает JSON-запросы (PostgreSQL).
            // В SQLite/SQLServer без явной настройки JSON это может выдать ошибку трансляции.
            // Поэтому для надежности лучше делать такую фильтрацию в памяти, если товаров не сотни тысяч.
            // Оставляем пока как есть, если EF настроен правильно - отработает.

            return query;
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
        private ProductListDto MapToListDto(Product p)
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

                // Создаем объект BrandDto
                Brand = p.Brand != null ? new BrandSummaryDto
                {
                    Id = p.Brand.Id,
                    Name = p.Brand.Name,
                    Slug = p.Brand.Slug
                } : null!,

                AverageRating = p.AverageRating,
                ReviewsCount = p.ReviewsCount,
                IsPublished = p.IsPublished, // Добавлено поле из вашего нового DTO

                MainImageUrl = p.Images?.FirstOrDefault(i => i.IsPrimary)?.Url
                              ?? p.Images?.FirstOrDefault()?.Url ?? string.Empty
            };
        }
    }
}