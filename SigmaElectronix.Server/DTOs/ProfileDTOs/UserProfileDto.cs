namespace SigmaElectronix.Server.DTOs.ProfileDTOs
{
    public class UserProfileDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int? PreferredCityId { get; set; }
        public int? PreferredStoreId { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal BonusBalance { get; set; }
    }
}
