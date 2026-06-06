using SigmaElectronix.Server.DTOs.CategoryDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface ICategoryService
    {
        Task<List<CategoryDto>> GetAllAsync();
        Task<List<CategoryTreeDto>> GetTreeAsync();
        Task<CategoryDto?> GetByIdAsync(int id);
        Task<CategoryDto?> GetBySlugAsync(string slug);  // 🆕 полезный метод
        Task<CategoryDto> CreateAsync(CreateCategoryDto dto);
        Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto);
        Task<bool> DeleteAsync(int id);
        Task<bool> IsSlugUniqueAsync(string slug, int? excludeId = null);  // 🆕
    }
}
