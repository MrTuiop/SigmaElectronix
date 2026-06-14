using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.InventoryDTOs;
using SigmaElectronix.Server.Entities.StoreModels;
using SigmaElectronix.Server.Enums; // 🚀 Добавлен using
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly ApplicationDbContext _context;

        public InventoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🔹 1. Поступление товара (Приемка)
        public async Task<bool> ReceiveStockAsync(ReceiveStockDto dto)
        {
            var inventory = await _context.StoreInventories
                .FirstOrDefaultAsync(i => i.StoreId == dto.StoreId && i.ProductId == dto.ProductId);

            if (inventory == null)
            {
                inventory = new StoreInventory
                {
                    StoreId = dto.StoreId,
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    LastUpdated = DateTime.UtcNow,
                    IsReservable = true
                };
                _context.StoreInventories.Add(inventory);
            }
            else
            {
                inventory.Quantity += dto.Quantity;
                inventory.LastUpdated = DateTime.UtcNow;
            }

            // 🚀 ИСПОЛЬЗУЕМ ENUM: InventoryTransactionType.Receipt
            _context.InventoryTransactions.Add(new InventoryTransaction
            {
                StoreId = dto.StoreId,
                ProductId = dto.ProductId,
                QuantityChange = dto.Quantity,
                TransactionType = InventoryTransactionType.Receipt,
                ReferenceId = dto.ReferenceId,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return true;
        }

        // 🔹 2. Перемещение товара между складами
        public async Task<bool> TransferStockAsync(TransferStockDto dto)
        {
            if (dto.FromStoreId == dto.ToStoreId)
                throw new ArgumentException("Магазин отправитель и получатель не могут совпадать.");

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var fromInventory = await _context.StoreInventories
                    .FirstOrDefaultAsync(i => i.StoreId == dto.FromStoreId && i.ProductId == dto.ProductId);

                if (fromInventory == null || fromInventory.Quantity < dto.Quantity)
                    throw new InvalidOperationException("Недостаточно товара на складе-отправителе.");

                var toInventory = await _context.StoreInventories
                    .FirstOrDefaultAsync(i => i.StoreId == dto.ToStoreId && i.ProductId == dto.ProductId);

                if (toInventory == null)
                {
                    toInventory = new StoreInventory
                    {
                        StoreId = dto.ToStoreId,
                        ProductId = dto.ProductId,
                        Quantity = 0,
                        IsReservable = true
                    };
                    _context.StoreInventories.Add(toInventory);
                }

                fromInventory.Quantity -= dto.Quantity;
                fromInventory.LastUpdated = DateTime.UtcNow;

                toInventory.Quantity += dto.Quantity;
                toInventory.LastUpdated = DateTime.UtcNow;

                // 🚀 ИСПОЛЬЗУЕМ ENUM: TransferOut
                _context.InventoryTransactions.Add(new InventoryTransaction
                {
                    StoreId = dto.FromStoreId,
                    ProductId = dto.ProductId,
                    QuantityChange = -dto.Quantity,
                    TransactionType = InventoryTransactionType.TransferOut,
                    ReferenceId = dto.ReferenceId,
                    CreatedAt = DateTime.UtcNow
                });

                // 🚀 ИСПОЛЬЗУЕМ ENUM: TransferIn
                _context.InventoryTransactions.Add(new InventoryTransaction
                {
                    StoreId = dto.ToStoreId,
                    ProductId = dto.ProductId,
                    QuantityChange = dto.Quantity,
                    TransactionType = InventoryTransactionType.TransferIn,
                    ReferenceId = dto.ReferenceId,
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                throw new InvalidOperationException("Состояние склада изменилось. Пожалуйста, обновите страницу и попробуйте снова.");
            }
        }
    }
}