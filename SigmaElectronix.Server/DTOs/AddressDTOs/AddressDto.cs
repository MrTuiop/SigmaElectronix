namespace SigmaElectronix.Server.DTOs.AddressDTOs
{
    public class AddressDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty; // Склеим улицу, дом и квартиру
        public string City { get; set; } = string.Empty;   // Название города
        public string Zip { get; set; } = string.Empty;    // PostalCode
        public bool IsDefault { get; set; }

        // Для редактирования нам нужны чистые данные:
        public int CityId { get; set; }
        public string OriginalStreet { get; set; } = string.Empty;
        public string OriginalBuilding { get; set; } = string.Empty;
        public string? OriginalApartment { get; set; }
    }
}
