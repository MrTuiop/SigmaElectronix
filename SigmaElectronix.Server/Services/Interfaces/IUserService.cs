using SigmaElectronix.Server.DTOs.UserDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IUserService
    {
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(string id);
        Task<UserDto> CreateUserAsync(CreateUserDto dto);
        Task<UserDto?> UpdateUserAsync(string id, UpdateUserDto dto);
        Task<bool> ChangePasswordAsync(string id, string newPassword);
        Task<bool> ToggleUserStatusAsync(string id); // Бан / Разбан
        Task<bool> DeleteUserAsync(string id);
    }
}
