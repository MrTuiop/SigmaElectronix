using SigmaElectronix.Server.DTOs.StoreDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IStoreService
    {
        Task<List<StoreDto>> GetAllStoresAsync(bool includeInactive = false);
        Task<StoreDto?> GetStoreByIdAsync(int id);
        Task<StoreDto> CreateStoreAsync(CreateStoreDto dto);
        Task<StoreDto?> UpdateStoreAsync(int id, UpdateStoreDto dto);
        Task<bool> ToggleStoreStatusAsync(int id); // Мягкое удаление (деактивация)
    }
}