using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.DTOs.ProfileDTOs;
using SigmaElectronix.Server.Entities.UserModels;
using System.Security.Claims;

namespace SigmaElectronix.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Все методы требуют авторизации
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(UserManager<ApplicationUser> userManager, ILogger<ProfileController> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        // Вспомогательный метод — получить текущего пользователя
        private async Task<ApplicationUser?> GetCurrentUserAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return null;

            return await _userManager.FindByIdAsync(userId);
        }

        /// <summary>
        /// Получить профиль текущего пользователя
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<UserProfileDto>> GetProfile()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                AvatarUrl = user.AvatarUrl,
                PreferredCityId = user.PreferredCityId,
                PreferredStoreId = user.PreferredStoreId,
                CreatedAt = user.CreatedAt
            });
        }

        /// <summary>
        /// Обновить только Имя (FirstName)
        /// </summary>
        [HttpPut("first-name")]
        public async Task<IActionResult> UpdateFirstName([FromBody] UpdateFirstNameDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            user.FirstName = dto.FirstName;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {UserId} updated FirstName to {FirstName}", user.Id, dto.FirstName);
            return Ok(new { user.FirstName, user.FullName });
        }

        /// <summary>
        /// Обновить только Фамилию (LastName)
        /// </summary>
        [HttpPut("last-name")]
        public async Task<IActionResult> UpdateLastName([FromBody] UpdateLastNameDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            user.LastName = dto.LastName;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {UserId} updated LastName to {LastName}", user.Id, dto.LastName);
            return Ok(new { user.LastName, user.FullName });
        }

        /// <summary>
        /// Обновить только Email
        /// </summary>
        [HttpPut("email")]
        public async Task<IActionResult> UpdateEmail([FromBody] UpdateEmailDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Проверяем, что email не занят
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null && existingUser.Id != user.Id)
                return BadRequest(new { error = "Этот email уже используется другим пользователем" });

            var token = await _userManager.GenerateChangeEmailTokenAsync(user, dto.Email);
            var result = await _userManager.ChangeEmailAsync(user, dto.Email, token);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            // Также обновляем UserName, если он = email
            user.UserName = dto.Email;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {UserId} changed email to {Email}", user.Id, dto.Email);
            return Ok(new { user.Email });
        }

        /// <summary>
        /// Обновить только телефон
        /// </summary>
        [HttpPut("phone")]
        public async Task<IActionResult> UpdatePhone([FromBody] UpdatePhoneDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var token = await _userManager.GenerateChangePhoneNumberTokenAsync(user, dto.PhoneNumber);
            var result = await _userManager.ChangePhoneNumberAsync(user, dto.PhoneNumber, token);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            _logger.LogInformation("User {UserId} changed phone to {Phone}", user.Id, dto.PhoneNumber);
            return Ok(new { user.PhoneNumber });
        }

        /// <summary>
        /// Смена пароля
        /// </summary>
        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            _logger.LogInformation("User {UserId} changed password", user.Id);
            return Ok(new { message = "Пароль успешно изменён" });
        }

        /// <summary>
        /// Обновить аватар (ссылку на изображение)
        /// </summary>
        [HttpPut("avatar")]
        public async Task<IActionResult> UpdateAvatar([FromBody] UpdateAvatarDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            user.AvatarUrl = dto.AvatarUrl;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {UserId} updated avatar", user.Id);
            return Ok(new { user.AvatarUrl });
        }

        /// <summary>
        /// Обновить любимый город
        /// </summary>
        [HttpPut("preferred-city")]
        public async Task<IActionResult> UpdatePreferredCity([FromBody] UpdatePreferredCityDto dto)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            user.PreferredCityId = dto.CityId;
            await _userManager.UpdateAsync(user);

            return Ok(new { user.PreferredCityId });
        }

        /// <summary>
        /// Обновить любимый магазин
        /// </summary>
        [HttpPut("preferred-store")]
        public async Task<IActionResult> UpdatePreferredStore([FromBody] UpdatePreferredStoreDto dto)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            user.PreferredStoreId = dto.StoreId;
            await _userManager.UpdateAsync(user);

            return Ok(new { user.PreferredStoreId });
        }

        /// <summary>
        /// История заказов пользователя
        /// </summary>
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            var user = await _userManager.Users
                .Include(u => u.Orders)
                    .ThenInclude(o => o.Items)
                .FirstOrDefaultAsync(u => u.Id == User.FindFirstValue(ClaimTypes.NameIdentifier));

            if (user == null) return Unauthorized();

            return Ok(user.Orders.OrderByDescending(o => o.CreatedAt));
        }

        /// <summary>
        /// Адреса пользователя
        /// </summary>
        [HttpGet("addresses")]
        public async Task<IActionResult> GetAddresses()
        {
            var user = await _userManager.Users
                .Include(u => u.Addresses)
                .FirstOrDefaultAsync(u => u.Id == User.FindFirstValue(ClaimTypes.NameIdentifier));

            if (user == null) return Unauthorized();

            return Ok(user.Addresses);
        }
    }
}