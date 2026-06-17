namespace SigmaElectronix.Server.DTOs.AddressDTOs
{
    public class CreateUpdateAddressDto
    {
        public string Title { get; set; } = string.Empty;
        public int CityId { get; set; } // 👈 ИЗМЕНИЛИ: теперь принимаем ID города
        public string Street { get; set; } = string.Empty;
        public string Building { get; set; } = string.Empty;
        public string? Apartment { get; set; }
        public string PostalCode { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public string? RecipientName { get; set; }
        public string? RecipientPhone { get; set; }
    }
}