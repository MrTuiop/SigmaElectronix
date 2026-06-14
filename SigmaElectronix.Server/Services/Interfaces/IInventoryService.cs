using SigmaElectronix.Server.DTOs.InventoryDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IInventoryService
    {
        // Поступление товара на конкретный склад
        Task<bool> ReceiveStockAsync(ReceiveStockDto dto);
        Task<bool> TransferStockAsync(TransferStockDto dto);
    }
}
