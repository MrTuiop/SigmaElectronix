using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using SigmaElectronix.Server.DTOs;
using SigmaElectronix.Server.Entities.UserModels;
using SigmaElectronix.Server.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SigmaElectronix.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<IEnumerable<string>> RegisterAsync(RegisterUserDto dto)
        {
            var user = new ApplicationUser
            {
                UserName = dto.UserName,
                Email = dto.Email,

                FirstName = dto.FirstName ?? string.Empty,
                LastName = dto.LastName ?? string.Empty,

                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);

            if (result.Succeeded)
            {
                // await _userManager.AddToRoleAsync(user, "Customer");
                return Enumerable.Empty<string>();
            }

            return result.Errors.Select(e => e.Description);
        }

        public async Task<string?> LoginAsync(LoginUserDto dto)
        {
            // 1. Ищем пользователя по Email или UserName
            ApplicationUser? user = await _userManager.FindByEmailAsync(dto.UsernameOrEmail)
                                 ?? await _userManager.FindByNameAsync(dto.UsernameOrEmail);

            // 2. Если пользователя нет или пароль не подошел — вход отклонен
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                return null;
            }

            // 3. Вызываем наш чистый приватный метод для создания токена
            return await GenerateJwtTokenAsync(user);
        }

        private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
        {
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim("UserName", user.UserName!),
                new Claim("FirstName", user.FirstName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Добавляем роли пользователя в токен
            var userRoles = await _userManager.GetRolesAsync(user);
            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var jwtKey = _configuration["JwtSettings:JwtKey"];
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!));

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
