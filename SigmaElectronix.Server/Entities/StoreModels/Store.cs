using SigmaElectronix.Server.Enums;

namespace SigmaElectronix.Server.Entities.StoreModels
{
    public class Store
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // "ТЦ Авиапарк, 3 этаж"
        public string Code { get; set; } = string.Empty; // "MSK-001" — код для внутренних систем

        public int CityId { get; set; }
        public City City { get; set; } = null!;

        public string FullAddress { get; set; } = string.Empty; // "ул. Ходынский бульвар, д. 4"
        public decimal Latitude { get; set; }  // Для карты на сайте
        public decimal Longitude { get; set; }

        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }

        // Режим работы
        public string WorkingHours { get; set; } = string.Empty; // "10:00 - 22:00, без выходных"
        public bool IsActive { get; set; } = true;

        // Тип магазина
        public StoreType Type { get; set; } = StoreType.Retail;

        // Навигация
        public ICollection<StoreInventory> Inventory { get; set; } = new List<StoreInventory>();
    }
}
