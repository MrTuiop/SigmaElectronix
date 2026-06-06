using SigmaElectronix.Server.Common;
using SigmaElectronix.Server.DTOs.BrandDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IBrandService
    {
        // === Для покупателей ===
        // Вывод всех брендов (например, на страницу "Все бренды")
        Task<PagedResult<BrandListDto>> GetBrandsAsync(int pageNumber = 1, int pageSize = 20);

        // Популярные бренды для карусели на главной странице (IsFeatured = true)
        Task<IEnumerable<BrandSummaryDto>> GetFeaturedBrandsAsync(int count = 6);

        // Страница-витрина конкретного бренда (самый тяжелый метод, тянет товары и категории)
        Task<BrandShowcaseDto?> GetBrandBySlugAsync(string slug);

        // === Для админки ===
        Task<BrandSummaryDto> CreateBrandAsync(CreateBrandDto dto);
        Task<BrandSummaryDto?> UpdateBrandAsync(int id, UpdateBrandDto dto);
        Task<bool> DeleteBrandAsync(int id);
    }
}
