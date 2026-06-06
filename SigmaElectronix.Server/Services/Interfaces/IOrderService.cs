using SigmaElectronix.Server.DTOs.OrderDTOs;
using SigmaElectronix.Server.Enums;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderDto> CreateOrderAsync(string? userId, CreateOrderDto dto);
        Task<OrderDto?> GetByIdAsync(int id);
        Task<List<OrderDto>> GetUserOrdersAsync(string userId);
        Task<List<OrderDto>> GetAllOrdersAsync();
        Task<OrderDto?> UpdateStatusAsync(int id, OrderStatus newStatus);
        Task<bool> CancelOrderAsync(int id, string userId);
    }
}
