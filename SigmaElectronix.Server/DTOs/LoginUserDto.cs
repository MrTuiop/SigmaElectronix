using System.ComponentModel.DataAnnotations;

namespace SigmaElectronix.Server.DTOs
{
    public class LoginUserDto
    {
        [Required(ErrorMessage = "Введите имя пользователя (UserName) или Email")]
        public string UsernameOrEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Введите пароль")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
    }
}
