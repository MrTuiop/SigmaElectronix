using Microsoft.EntityFrameworkCore;
// Не забудьте поменять на ваш реальный namespace, где лежит ApplicationDbContext:
using SigmaElectronix.Server.Data;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. НАСТРОЙКА СЕРВИСОВ (КОНТЕЙНЕР DI)
// =========================================================================

builder.Services.AddControllers();

// [ДОБАВЛЕНО] Регистрация контекста базы данных PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// [ДОБАВЛЕНО] Настройка CORS для совместной разработки бэкенда и фронтенда
builder.Services.AddCors(options =>
    options.AddPolicy("CorsPolicy", policy =>
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200") // Порты Angular
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()));

var app = builder.Build();

// =========================================================================
// 2. НАСТРОЙКА КОНВЕЙЕРА HTTP-ЗАПРОСОВ (MIDDLEWARE)
// =========================================================================

// [ДОБАВЛЕНО] Включаем CORS (должен стоять до маршрутизации и авторизации!)
app.UseCors("CorsPolicy");

// Обслуживание статических файлов Angular (index.html, js, css)
app.UseDefaultFiles();
app.UseStaticFiles(); // [ДОБАВЛЕНО] Без этого файлы из wwwroot могут не отдаваться
app.MapStaticAssets();

app.UseHttpsRedirection();

// Маршрутизация и авторизация
app.UseRouting(); // [РЕКОМЕНДУЕТСЯ] Явно указать перед UseAuthorization
app.UseAuthorization();

// Маппинг API-контроллеров ([Route("api/[controller]")])
app.MapControllers();

// [ВАЖНО] Если запрос не для API и не для статического файла, 
// отдаем index.html, чтобы роутер Angular сам обработал страницу (например, /cart или /catalog)
app.MapFallbackToFile("/index.html");

app.Run();