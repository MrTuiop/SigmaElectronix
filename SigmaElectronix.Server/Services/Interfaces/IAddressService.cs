using SigmaElectronix.Server.DTOs.AddressDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IAddressService
    {
        Task<List<AddressDto>> GetUserAddressesAsync(string userId);
        Task<AddressDto> CreateAddressAsync(string userId, CreateUpdateAddressDto dto);
        Task<AddressDto?> UpdateAddressAsync(int id, string userId, CreateUpdateAddressDto dto);
        Task<bool> DeleteAddressAsync(int id, string userId);
    }
}
