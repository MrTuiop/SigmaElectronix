using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.Entities.StoreModels;
using SigmaElectronix.Server.Enums;
using Microsoft.EntityFrameworkCore;

namespace SigmaElectronix.Server.Workers
{
    // Workers/OrderReservationWorker.cs
    public class OrderReservationWorker : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<OrderReservationWorker> _logger;

        public OrderReservationWorker(
            IServiceProvider services,
            ILogger<OrderReservationWorker> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("OrderReservationWorker запущен");

            // Проверяем раз в час
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessExpirediredReservationsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ошибка в OrderReservationWorker");
                }

                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        private async Task ProcessExpirediredReservationsAsync(CancellationToken ct)
        {
            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var expiredOrders = await db.Orders
                .Include(o => o.Items)
                .Where(o => o.PaymentStatus == PaymentStatus.Pending
                         && o.ReservationExpiresAt != null
                         && o.ReservationExpiresAt < DateTime.UtcNow)
                .ToListAsync(ct);

            if (!expiredOrders.Any()) return;

            _logger.LogInformation("Найдено просроченных заказов: {Count}", expiredOrders.Count);

            foreach (var order in expiredOrders)
            {
                // Возвращаем товары на склад
                foreach (var item in order.Items)
                {
                    var inventory = await db.Set<StoreInventory>()
                        .FirstOrDefaultAsync(i =>
                            i.ProductId == item.ProductId &&
                            i.StoreId == item.StoreId, ct);

                    if (inventory != null)
                    {
                        inventory.Quantity += item.Quantity;
                        inventory.LastUpdated = DateTime.UtcNow;
                    }
                }

                order.Status = OrderStatus.Cancelled;
                order.PaymentStatus = PaymentStatus.Expired;
                order.UpdatedAt = DateTime.UtcNow;

                _logger.LogInformation("Заказ {OrderNumber} автоматически отменён (истёк резерв)",
                    order.OrderNumber);
            }

            await db.SaveChangesAsync(ct);
        }
    }
}
