namespace SigmaElectronix.Server.DTOs.UserDTOs
{
    public class UpdateUserDto
    {
        public string UserName { get; set; } = string.Empty; // 🚀 Новое поле
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public decimal BonusBalance { get; set; }
        public bool IsActive { get; set; }
        public string Role { get; set; } = string.Empty;
    }
}
