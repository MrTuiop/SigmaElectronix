using SigmaElectronix.Server.Entities.ProductModels;

namespace SigmaElectronix.Server.Entities.StoreModels
{
    public class StoreInventory
    {
        public int Id { get; set; }

        public int StoreId { get; set; }
        public Store Store { get; set; } = null!;

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public int Quantity { get; set; } // Сколько штук есть в этом магазине

        // Когда последний раз обновлялось (для синхронизации с 1С/складом)
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Можно ли зарезервировать (иногда товар есть, но он витринный)
        public bool IsReservable { get; set; } = true;
    }
}
