namespace SigmaElectronix.Server.DTOs.LocationDTOs
{
    public class CreateUpdateCityDto
    {
        public string Name { get; set; } = string.Empty;
        public int RegionId { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? TimeZone { get; set; }
    }
}
