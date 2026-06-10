using SigmaElectronix.Server.Common;
using SigmaElectronix.Server.DTOs.ProductDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IProductService
    {
        // Публичные методы (для покупателей)
        Task<PagedResult<ProductListDto>> GetProductsAsync(ProductFilterDto filter);
        Task<ProductDetailDto?> GetProductByIdAsync(int id);
        Task<ProductDetailDto?> GetProductBySlugAsync(string slug);
        Task<IEnumerable<ProductListDto>> GetFeaturedProductsAsync(int count = 8);
        Task<IEnumerable<ProductListDto>> GetDiscountedProductsAsync(int count = 8);
        Task<IEnumerable<ProductListDto>> GetRelatedProductsAsync(int productId, int count = 4);
        Task<IEnumerable<ProductListDto>> GetNewArrivalsAsync(int count = 8);

        // Административные методы (CRUD)
        Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto);
        Task<ProductDetailDto?> UpdateProductAsync(int id, UpdateProductDto dto);
        Task<bool> DeleteProductAsync(int id); // Soft delete
        Task<bool> RestoreProductAsync(int id);
        Task<PagedResult<ProductListDto>> GetAllProductsAdminAsync(ProductFilterDto filter);
        Task<CategoryFilterDto> GetAvailableFiltersAsync(int? categoryId);
    }
}
