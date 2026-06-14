namespace SigmaElectronix.Server.DTOs.LocationDTOs
{
    public class CityDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int RegionId { get; set; }
        public string RegionName { get; set; } = string.Empty; // Для удобного вывода на фронте
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? TimeZone { get; set; }
    }
}
