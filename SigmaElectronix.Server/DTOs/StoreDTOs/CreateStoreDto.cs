using SigmaElectronix.Server.Enums;
using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs.StoreDTOs
{
    public class CreateStoreDto
    {
        [Required] public string Name { get; set; } = string.Empty;
        [Required] public string Code { get; set; } = string.Empty;

        [Required] public int CityId { get; set; }

        [Required] public string FullAddress { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

        [Required] public string Phone { get; set; } = string.Empty;
        [EmailAddress] public string? Email { get; set; }
        [Required] public string WorkingHours { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public StoreType Type { get; set; } = StoreType.Retail;
    }
}
