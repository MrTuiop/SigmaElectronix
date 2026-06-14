using SigmaElectronix.Server.Entities.ProductModels;
using SigmaElectronix.Server.Enums;

namespace SigmaElectronix.Server.Entities.StoreModels
{
    public class InventoryTransaction
    {
        public int Id { get; set; }

        public int StoreId { get; set; }
        public Store Store { get; set; } = null!;

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        // Сколько товара пришло (+) или ушло (-)
        public int QuantityChange { get; set; }

        // Тип операции: "RECEIPT" (Поступление), "SALE" (Продажа), "RETURN" (Возврат), "TRANSFER" (Перемещение)
        public InventoryTransactionType TransactionType { get; set; }

        // Ссылка на документ: например, "ORD-20260606-12345" или номер накладной
        public string? ReferenceId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}