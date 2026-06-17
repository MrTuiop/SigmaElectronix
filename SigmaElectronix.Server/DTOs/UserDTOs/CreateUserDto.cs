namespace SigmaElectronix.Server.DTOs.UserDTOs
{
    public class CreateUserDto
    {
        public string UserName { get; set; } = string.Empty; // 🚀 Новое поле
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer"; // По умолчанию обычный покупатель
    }
}
