using SigmaElectronix.Server.DTOs.CartDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface ICartService
    {
        Task<CartDto> GetCartAsync(string? userId, string? sessionId);
        Task<CartDto> AddItemToCartAsync(string? userId, string? sessionId, AddToCartRequest request);
        Task<CartDto> UpdateItemQuantityAsync(string? userId, string? sessionId, int itemId, int quantity);
        Task<bool> RemoveItemAsync(string? userId, string? sessionId, int itemId);
        Task<bool> ClearCartAsync(string? userId, string? sessionId);
        Task MergeGuestCartAsync(string sessionId, string userId); // При авторизации
    }
}
