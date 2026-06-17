using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.UserDTOs;
using SigmaElectronix.Server.Entities.UserModels;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public UserService(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var users = await _userManager.Users.AsNoTracking().ToListAsync();
            var userDtos = new List<UserDto>();

            // Получаем роли для каждого пользователя
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(MapToDto(user, roles));
            }

            return userDtos;
        }

        public async Task<UserDto?> GetUserByIdAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return null;

            var roles = await _userManager.GetRolesAsync(user);
            return MapToDto(user, roles);
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
        {
            var user = new ApplicationUser
            {
                UserName = dto.UserName, // 🚀 Теперь берем логин из DTO
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Ошибка создания: {errors}");
            }

            // Назначаем роль
            if (!string.IsNullOrWhiteSpace(dto.Role))
            {
                await _userManager.AddToRoleAsync(user, dto.Role);
            }

            var roles = await _userManager.GetRolesAsync(user);
            return MapToDto(user, roles);
        }

        public async Task<UserDto?> UpdateUserAsync(string id, UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return null;

            user.UserName = dto.UserName; // 🚀 Позволяем изменять логин независимо
            user.Email = dto.Email;
            user.PhoneNumber = dto.PhoneNumber;
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.BonusBalance = dto.BonusBalance;
            user.IsActive = dto.IsActive;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Ошибка обновления пользователя: {errors}");
            }

            var roles = await _userManager.GetRolesAsync(user);
            return MapToDto(user, roles);
        }

        public async Task<bool> ChangePasswordAsync(string id, string newPassword)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return false;

            // Генерируем специальный токен сброса (Admin bypass)
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, newPassword);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Ошибка смены пароля: {errors}");
            }

            return true;
        }

        public async Task<bool> ToggleUserStatusAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return false;

            user.IsActive = !user.IsActive;
            await _userManager.UpdateAsync(user);
            return true;
        }

        public async Task<bool> DeleteUserAsync(string id)
        {
            var user = await _context.Users
                .Include(u => u.Orders) // Проверяем, есть ли заказы
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return false;

            // Если у пользователя уже есть заказы, физически удалять его НЕЛЬЗЯ! 
            // Иначе сломается база заказов. Делаем Soft Delete (Бан).
            if (user.Orders.Any())
            {
                user.IsActive = false;
                user.FirstName = "[Удален]";
                user.LastName = "[Удален]";
                user.Email = $"deleted_{user.Id}@sigma.com"; // Защита персональных данных
                user.UserName = $"deleted_{user.Id}"; // 🚀 Освобождаем логин, если захочет создать новый акк
                user.PhoneNumber = null;

                await _userManager.UpdateAsync(user);
                return true;
            }

            // Если заказов нет, удаляем физически
            var result = await _userManager.DeleteAsync(user);
            return result.Succeeded;
        }

        private UserDto MapToDto(ApplicationUser u, IList<string> roles)
        {
            return new UserDto
            {
                Id = u.Id,
                UserName = u.UserName ?? string.Empty, // 🚀 Возвращаем UserName на фронт
                Email = u.Email ?? "",
                PhoneNumber = u.PhoneNumber ?? "",
                FirstName = u.FirstName,
                LastName = u.LastName,
                FullName = u.FullName,
                IsActive = u.IsActive,
                BonusBalance = u.BonusBalance,
                CreatedAt = u.CreatedAt,
                Roles = roles
            };
        }
    }
}