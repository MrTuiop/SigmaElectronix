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
            // 🚀 ИСПРАВЛЕНИЕ N+1 ПРОБЛЕМЫ: 
            // Делаем один сложный запрос к БД, который сразу вытягивает юзеров и их роли.
            // Вместо 1000 запросов к БД будет выполнен всего 1 запрос.
            var usersWithRoles = await _context.Users
                .AsNoTracking()
                .Select(user => new
                {
                    User = user,
                    Roles = _context.UserRoles
                        .Where(ur => ur.UserId == user.Id)
                        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .ToList()
                })
                .ToListAsync();

            return usersWithRoles.Select(u => MapToDto(u.User, u.Roles!)).ToList();
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
                UserName = dto.UserName,
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

            user.UserName = dto.UserName;
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

            // 🚀 ИСПРАВЛЕНИЕ: Обновление роли пользователя
            var currentRoles = await _userManager.GetRolesAsync(user);
            var currentRole = currentRoles.FirstOrDefault(); // Предполагаем, что у юзера 1 основная роль

            // Если роль пришла с фронтенда и она отличается от текущей
            if (!string.IsNullOrWhiteSpace(dto.Role) && currentRole != dto.Role)
            {
                if (currentRoles.Any())
                {
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                }
                await _userManager.AddToRoleAsync(user, dto.Role);
            }

            var updatedRoles = await _userManager.GetRolesAsync(user);
            return MapToDto(user, updatedRoles);
        }

        public async Task<bool> ChangePasswordAsync(string id, string newPassword)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return false;

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

            // 🚀 БЕЗОПАСНОСТЬ: Если мы баним юзера, нужно сбросить его SecurityStamp,
            // чтобы его существующие JWT-токены/Cookie мгновенно стали недействительными.
            if (!user.IsActive)
            {
                await _userManager.UpdateSecurityStampAsync(user);
            }

            return true;
        }

        public async Task<bool> DeleteUserAsync(string id)
        {
            var user = await _context.Users
                .Include(u => u.Orders)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return false;

            if (user.Orders.Any())
            {
                user.IsActive = false;
                user.FirstName = "[Удален]";
                user.LastName = "[Удален]";
                user.Email = $"deleted_{user.Id}@sigma.com";
                user.UserName = $"deleted_{user.Id}";
                user.PhoneNumber = null;

                await _userManager.UpdateAsync(user);

                // 🚀 БЕЗОПАСНОСТЬ: Инвалидируем сессии удаленного аккаунта
                await _userManager.UpdateSecurityStampAsync(user);
                return true;
            }

            var result = await _userManager.DeleteAsync(user);
            return result.Succeeded;
        }

        private UserDto MapToDto(ApplicationUser u, IList<string> roles)
        {
            return new UserDto
            {
                Id = u.Id,
                UserName = u.UserName ?? string.Empty,
                Email = u.Email ?? "",
                PhoneNumber = u.PhoneNumber ?? "",
                FirstName = u.FirstName,
                LastName = u.LastName,
                FullName = u.FullName,
                IsActive = u.IsActive,
                BonusBalance = u.BonusBalance,
                CreatedAt = u.CreatedAt,
                Roles = roles,
                AvatarUrl = u.AvatarUrl
            };
        }
    }
}