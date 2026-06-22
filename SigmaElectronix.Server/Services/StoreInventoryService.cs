using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.StoreDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class StoreInventoryService : IStoreInventoryService
    {
        private readonly ApplicationDbContext _context;

        public StoreInventoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<StoreInventoryDto>> GetInventoryByStoreAsync(int storeId)
        {
            return await _context.StoreInventories
                .AsNoTracking()
                .Where(i => i.StoreId == storeId)
                .Select(i => new StoreInventoryDto
                {
                    Id = i.Id,
                    StoreId = i.StoreId,
                    StoreName = i.Store.Name,
                    ProductId = i.ProductId,
                    // 🚀 Извлекаем название товара из переводов
                    // Приоритет: сначала русский (0), потом любой другой (1)
                    ProductName = i.Product.Translations
                        .OrderBy(t => t.LanguageCode == "ru" ? 0 : 1)
                        .Select(t => t.Name)
                        .FirstOrDefault() ?? "Unknown",
                    Quantity = i.Quantity,
                    LastUpdated = i.LastUpdated,
                    IsReservable = i.IsReservable
                })
                .ToListAsync();
        }

        public async Task<List<StoreInventoryDto>> GetInventoryByProductAsync(int productId)
        {
            return await _context.StoreInventories
                .AsNoTracking()
                .Where(i => i.ProductId == productId)
                .Select(i => new StoreInventoryDto
                {
                    Id = i.Id,
                    StoreId = i.StoreId,
                    StoreName = i.Store.Name,
                    ProductId = i.ProductId,
                    // 🚀 Та же логика извлечения названия
                    ProductName = i.Product.Translations
                        .OrderBy(t => t.LanguageCode == "ru" ? 0 : 1)
                        .Select(t => t.Name)
                        .FirstOrDefault() ?? "Unknown",
                    Quantity = i.Quantity,
                    LastUpdated = i.LastUpdated,
                    IsReservable = i.IsReservable
                })
                .ToListAsync();
        }

        // 🚀 ВОТ ОНА — СВЯЗЬ С ТРАНЗАКЦИЯМИ!
        public async Task<List<TransactionHistoryDto>> GetProductHistoryInStoreAsync(int storeId, int productId)
        {
            return await _context.InventoryTransactions
                .AsNoTracking()
                .Where(t => t.StoreId == storeId && t.ProductId == productId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new TransactionHistoryDto
                {
                    Id = t.Id,
                    TransactionType = t.TransactionType.ToString(), // EF Core переведет Enum в строку
                    QuantityChange = t.QuantityChange,
                    ReferenceId = t.ReferenceId,
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateReservableStatusAsync(int storeId, int productId, UpdateInventorySettingsDto dto)
        {
            var inventory = await _context.StoreInventories
                .FirstOrDefaultAsync(i => i.StoreId == storeId && i.ProductId == productId);

            if (inventory == null) return false;

            inventory.IsReservable = dto.IsReservable;
            inventory.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}