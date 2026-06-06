using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.CategoryDTOs;
using SigmaElectronix.Server.Entities.ProductModels;
using SigmaElectronix.Server.Services.Interfaces;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace SigmaElectronix.Server.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context;

        public CategoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<CategoryDto>> GetAllAsync()
        {
            // Здесь .Include не нужен. EF Core сам сделает JOIN благодаря .Select()
            return await _context.Categories
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    ImageUrl = c.ImageUrl,
                    ParentCategoryId = c.ParentCategoryId,
                    ParentCategoryName = c.ParentCategory != null ? c.ParentCategory.Name : null,
                    ProductsCount = c.Products.Count, // Транслируется в COUNT() в SQL
                    SubCategoriesCount = c.SubCategories.Count // Транслируется в COUNT() в SQL
                })
                .ToListAsync();
        }

        public async Task<List<CategoryTreeDto>> GetTreeAsync()
        {
            // 1. Делаем плоскую выборку ТОЛЬКО нужных полей и сразу считаем товары в базе
            var flatCategories = await _context.Categories
                .AsNoTracking()
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Slug,
                    c.ImageUrl,
                    c.ParentCategoryId,
                    ProductsCount = c.Products.Count
                })
                .ToListAsync();

            // 2. Группируем один раз (O(N) вместо O(N^2))
            var lookup = flatCategories.ToLookup(c => c.ParentCategoryId);

            // 3. Строим дерево
            List<CategoryTreeDto> BuildTree(int? parentId)
            {
                return lookup[parentId]
                    .Select(c => new CategoryTreeDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug,
                        ImageUrl = c.ImageUrl,
                        ProductsCount = c.ProductsCount,
                        SubCategories = BuildTree(c.Id)
                    })
                    .ToList();
            }

            return BuildTree(null);
        }

        public async Task<CategoryDto?> GetByIdAsync(int id)
        {
            // Сразу проецируем в DTO. Это решит проблему с нулями в счетчиках.
            return await _context.Categories
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    ImageUrl = c.ImageUrl,
                    ParentCategoryId = c.ParentCategoryId,
                    ParentCategoryName = c.ParentCategory != null ? c.ParentCategory.Name : null,
                    ProductsCount = c.Products.Count,
                    SubCategoriesCount = c.SubCategories.Count
                })
                .FirstOrDefaultAsync();
        }

        public async Task<CategoryDto?> GetBySlugAsync(string slug)
        {
            return await _context.Categories
                .AsNoTracking()
                .Where(c => c.Slug == slug)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    ImageUrl = c.ImageUrl,
                    ParentCategoryId = c.ParentCategoryId,
                    ParentCategoryName = c.ParentCategory != null ? c.ParentCategory.Name : null,
                    ProductsCount = c.Products.Count,
                    SubCategoriesCount = c.SubCategories.Count
                })
                .FirstOrDefaultAsync();
        }

        public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
        {
            // Валидация slug
            if (string.IsNullOrWhiteSpace(dto.Slug))
                throw new ArgumentException("Slug обязателен");

            if (!IsValidSlug(dto.Slug))
                throw new ArgumentException("Slug содержит недопустимые символы. Только латиница, цифры и дефис.");

            if (!await IsSlugUniqueAsync(dto.Slug))
                throw new InvalidOperationException("Такой slug уже используется");

            var category = new Category
            {
                Name = dto.Name,
                Slug = dto.Slug.ToLowerInvariant(),
                ImageUrl = dto.ImageUrl ?? string.Empty,
                ParentCategoryId = dto.ParentCategoryId
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(category.Id))!;
        }

        public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return null;

            if (dto.ParentCategoryId == id)
                throw new InvalidOperationException("Категория не может быть родителем самой себя");

            if (string.IsNullOrWhiteSpace(dto.Slug))
                throw new ArgumentException("Slug обязателен");

            if (!IsValidSlug(dto.Slug))
                throw new ArgumentException("Slug содержит недопустимые символы");

            // Проверяем уникальность, исключая текущую категорию
            if (!await IsSlugUniqueAsync(dto.Slug, id))
                throw new InvalidOperationException("Такой slug уже используется");

            category.Name = dto.Name;
            category.Slug = dto.Slug.ToLowerInvariant();
            category.ImageUrl = dto.ImageUrl ?? category.ImageUrl;
            category.ParentCategoryId = dto.ParentCategoryId;

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

        // 🆕 Проверка уникальности slug
        public async Task<bool> IsSlugUniqueAsync(string slug, int? excludeId = null)
        {
            var normalizedSlug = slug.ToLowerInvariant();
            var query = _context.Categories.Where(c => c.Slug == normalizedSlug);

            if (excludeId.HasValue)
                query = query.Where(c => c.Id != excludeId.Value);

            return !await query.AnyAsync();
        }

        // 🆕 Валидация формата slug
        private bool IsValidSlug(string slug)
        {
            // Разрешаем: латиница, цифры, дефис, подчёркивание
            return Regex.IsMatch(slug, @"^[a-z0-9\-_]+$", RegexOptions.IgnoreCase);
        }

        private CategoryDto MapToDto(Category c)
        {
            return new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                ImageUrl = c.ImageUrl,
                ParentCategoryId = c.ParentCategoryId,
                ParentCategoryName = c.ParentCategory?.Name,
                ProductsCount = c.Products?.Count ?? 0,
                SubCategoriesCount = c.SubCategories?.Count ?? 0
            };
        }
    }
}
