using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs.AuthDTOs
{
    public class RegisterUserDto
    {
        [Required(ErrorMessage = "Имя пользователя (UserName) обязательно")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Имя пользователя должно быть от 3 до 50 символов")]
        public string UserName { get; set; } = string.Empty;

        // Email теперь необязательный (string?), но если он передан, формат должен быть корректным
        [EmailAddress(ErrorMessage = "Неверный формат Email")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Пароль обязателен")]
        [MinLength(6, ErrorMessage = "Пароль должен быть не менее 6 символов")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Номер телефона обязателен")]
        [Phone(ErrorMessage = "Неверный формат номера телефона")]
        // Опционально: можно добавить строгую проверку через регулярное выражение, например, для номеров РФ:
        // [RegularExpression(@"^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$", ErrorMessage = "Неверный формат российского номера телефона")]
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
