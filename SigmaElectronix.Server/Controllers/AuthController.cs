using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.AuthDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
        {
            var errors = await _authService.RegisterAsync(dto);

            if (errors.Any())
            {
                return BadRequest(new { Errors = errors });
            }

            return Ok(new { message = "Регистрация успешна!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var token = await _authService.LoginAsync(dto);

            if (token == null)
            {
                return Unauthorized(new { message = "Неверное имя пользователя/Email или пароль" });
            }

            return Ok(new { accessToken = token });
        }
    }
}
