using SigmaElectronix.Server.Entities.StoreModels;

namespace SigmaElectronix.Server.Entities.UserModels
{
    public class Address
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public string Title { get; set; } = string.Empty;

        // Ссылка на справочник городов
        public int CityId { get; set; }
        public City City { get; set; } = null!;

        public string Street { get; set; } = string.Empty;
        public string Building { get; set; } = string.Empty;
        public string? Apartment { get; set; }
        public string PostalCode { get; set; } = string.Empty;

        // Для картыф
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        public bool IsDefault { get; set; }
        public string? RecipientName { get; set; } // Если получатель — не пользователь
        public string? RecipientPhone { get; set; }
    }
}
