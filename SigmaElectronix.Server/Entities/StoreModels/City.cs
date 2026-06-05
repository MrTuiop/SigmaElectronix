using SigmaElectronix.Server.Entities.UserModels;

namespace SigmaElectronix.Server.Entities.StoreModels
{
    public class City
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // "Москва", "Санкт-Петербург"
        public int RegionId { get; set; }
        public Region Region { get; set; } = null!;

        // Координаты для расчета расстояния до пользователя (для карты)
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

        // Для отображения на фронте
        public string? TimeZone { get; set; } // "Europe/Moscow"

        // Навигация
        public ICollection<Store> Stores { get; set; } = new List<Store>();
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
        public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>(); // Пользователи, выбравшие этот город
    }
}
