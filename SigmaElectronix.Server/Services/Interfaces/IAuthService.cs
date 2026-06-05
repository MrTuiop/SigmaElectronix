using SigmaElectronix.Server.DTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IAuthService
    {
        Task<IEnumerable<string>> RegisterAsync(RegisterUserDto dto);
        Task<string?> LoginAsync(LoginUserDto dto);
    }
}
