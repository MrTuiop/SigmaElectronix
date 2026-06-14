using SigmaElectronix.Server.DTOs.LocationDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IRegionService
    {
        Task<List<RegionDto>> GetAllAsync();
        Task<RegionDto?> GetByIdAsync(int id);
        Task<RegionDto> CreateAsync(CreateUpdateRegionDto dto);
        Task<RegionDto?> UpdateAsync(int id, CreateUpdateRegionDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
