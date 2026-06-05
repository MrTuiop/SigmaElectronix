using Microsoft.AspNetCore.Identity;
using SigmaElectronix.Server.Entities.UserModels;

namespace SigmaElectronix.Server.Data
{
    public static class RoleInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            // Получаем менеджеры из системы
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // 1. Создаем роли, если их нет
            string[] roles = { "Admin", "Customer", "Manager" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // 2. ИЩЕМ ЛЮБЫХ АДМИНОВ В БАЗЕ (Вместо поиска по конкретному Email)
            var existingAdmins = await userManager.GetUsersInRoleAsync("Admin");

            // Если список пуст (в базе 0 админов), только тогда создаем первого
            if (existingAdmins.Count == 0)
            {
                string adminEmail = "admin@sigma.com";
                string adminPassword = "AdminPassword123!"; // Ваш надежный пароль

                var adminUser = new ApplicationUser
                {
                    UserName = "SigmaAdmin",
                    Email = adminEmail,
                    FirstName = "Главный",
                    LastName = "Администратор",
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
        }
    }
}
