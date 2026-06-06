using SigmaElectronix.Server.DTOs.OrderDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<OrderDto> ProcessPaymentAsync(int orderId, string userId);
        Task<OrderDto> MarkAsPaidInStoreAsync(int orderId, string userId);
    }
}
