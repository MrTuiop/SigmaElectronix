using SigmaElectronix.Server.DTOs.WishlistDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IWishlistService
    {
        Task<WishlistDto> GetWishlistAsync(string? userId, string? sessionId);
        // Метод Toggle: если товара нет - добавит, если есть - удалит. Идеально для кнопки-сердечка!
        Task<WishlistDto> ToggleItemAsync(string? userId, string? sessionId, int productId);
        Task<bool> ClearWishlistAsync(string? userId, string? sessionId);
        Task MergeGuestWishlistAsync(string sessionId, string userId);
    }
}
