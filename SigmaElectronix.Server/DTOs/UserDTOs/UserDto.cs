namespace SigmaElectronix.Server.DTOs.UserDTOs
{
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty; // 🚀 Новое поле
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public decimal BonusBalance { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
        public string? AvatarUrl { get; set; }
    }
}
