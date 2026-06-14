namespace SigmaElectronix.Server.DTOs.LocationDTOs
{
    public class RegionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public int CitiesCount { get; set; } // Считаем количество городов в регионе
    }
}
