namespace SigmaElectronix.Server.Middleware
{
    public class SessionIdMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SessionIdMiddleware> _logger;

        public SessionIdMiddleware(RequestDelegate next, ILogger<SessionIdMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Проверяем, авторизован ли пользователь
            var isAuthenticated = context.User.Identity?.IsAuthenticated == true;

            if (!isAuthenticated)
            {
                // Для гостей проверяем наличие sessionId в куках
                var hasSessionId = context.Request.Cookies.ContainsKey("sessionId");

                if (!hasSessionId)
                {
                    // Генерируем новый уникальный идентификатор
                    var sessionId = Guid.NewGuid().ToString();

                    // Устанавливаем куки
                    context.Response.Cookies.Append("sessionId", sessionId, new CookieOptions
                    {
                        HttpOnly = true,                    // JS не может прочитать
                        Secure = true,                      // Только HTTPS
                        SameSite = SameSiteMode.Strict,     // Защита от CSRF
                        Expires = DateTimeOffset.UtcNow.AddDays(30), // Живет 30 дней
                        IsEssential = true                  // Обязательно (не требует согласия GDPR)
                    });

                    _logger.LogInformation("Создан новый sessionId для гостя: {SessionId}", sessionId);
                }
            }

            // Передаем запрос дальше по цепочке middleware
            await _next(context);
        }
    }
}
