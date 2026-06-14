using SigmaElectronix.Server.DTOs.StoreDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IStoreInventoryService
    {
        // Чтение остатков
        Task<List<StoreInventoryDto>> GetInventoryByStoreAsync(int storeId);
        Task<List<StoreInventoryDto>> GetInventoryByProductAsync(int productId);

        // Связь с транзакциями (История движений товара в конкретном магазине)
        Task<List<TransactionHistoryDto>> GetProductHistoryInStoreAsync(int storeId, int productId);

        // Изменение настроек (резерв)
        Task<bool> UpdateReservableStatusAsync(int storeId, int productId, UpdateInventorySettingsDto dto);
    }
}
