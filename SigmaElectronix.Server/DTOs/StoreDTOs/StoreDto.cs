namespace SigmaElectronix.Server.DTOs.StoreDTOs
{
    public class StoreDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;

        public int CityId { get; set; }
        public string CityName { get; set; } = string.Empty; // Удобно для вывода в таблице Angular

        public string FullAddress { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string WorkingHours { get; set; } = string.Empty;

        public bool IsActive { get; set; }
        public string Type { get; set; } = string.Empty; // Enum преобразуем в строку для удобства фронта
    }
}