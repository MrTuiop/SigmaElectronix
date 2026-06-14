using SigmaElectronix.Server.DTOs.LocationDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface ICityService
    {
        Task<List<CityDto>> GetAllAsync();
        Task<List<CityDto>> GetByRegionIdAsync(int regionId);
        Task<CityDto?> GetByIdAsync(int id);
        Task<CityDto> CreateAsync(CreateUpdateCityDto dto);
        Task<CityDto?> UpdateAsync(int id, CreateUpdateCityDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
