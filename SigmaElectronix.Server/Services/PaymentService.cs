using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.OrderDTOs;
using SigmaElectronix.Server.Entities.OrderModels;
using SigmaElectronix.Server.Enums;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(ApplicationDbContext db, ILogger<PaymentService> logger)
        {
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Имитация онлайн-оплаты. В реальном проекте тут был бы вызов платёжного шлюза.
        /// </summary>
        public async Task<OrderDto> ProcessPaymentAsync(int orderId, string userId)
        {
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

            if (order == null)
                throw new InvalidOperationException("Заказ не найден");

            if (order.Status == OrderStatus.Cancelled)
                throw new InvalidOperationException("Заказ отменён");

            // ============================================
            // ✅ ИДЕМПОТЕНТНОСТЬ: заказ уже оплачен
            // ============================================
            if (order.PaymentStatus == PaymentStatus.Paid)
            {
                _logger.LogWarning(
                    "Повторная попытка оплаты уже оплаченного заказа {OrderNumber} (id={OrderId})",
                    order.OrderNumber, orderId);

                // Не бросаем исключение, возвращаем текущее состояние.
                // Клиент получит 200 OK с актуальными данными заказа.
                return MapToDto(order);
            }

            // Проверяем, что резерв не истёк
            if (order.ReservationExpiresAt.HasValue &&
                order.ReservationExpiresAt.Value < DateTime.UtcNow)
            {
                throw new InvalidOperationException(
                    "Срок резерва истёк. Пожалуйста, оформите заказ заново.");
            }

            // === ИМИТАЦИЯ ОПЛАТЫ ===
            // В реальности: редирект на ЮKassa / Stripe / CloudPayments
            await Task.Delay(1000); // "Обработка платежа"

            // Генерируем уникальный номер транзакции
            order.PaymentReference = $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
            order.PaymentStatus = PaymentStatus.Paid;
            order.PaidAt = DateTime.UtcNow;
            order.Status = OrderStatus.Confirmed;
            order.UpdatedAt = DateTime.UtcNow;

            // Снимаем ограничение по резерву — теперь это реальный заказ
            order.ReservationExpiresAt = null;

            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Заказ {OrderNumber} оплачен онлайн. Транзакция: {Ref}",
                order.OrderNumber, order.PaymentReference);

            // TODO: тут можно отправить email с подтверждением

            return MapToDto(order);
        }

        /// <summary>
        /// Пометка, что заказ оплачен в магазине (кассир нажимает кнопку)
        /// </summary>
        public async Task<OrderDto> MarkAsPaidInStoreAsync(int orderId, string userId)
        {
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

            if (order == null)
                throw new InvalidOperationException("Заказ не найден");

            // ✅ Идемпотентность и тут — кассир мог случайно нажать дважды
            if (order.PaymentStatus == PaymentStatus.Paid)
            {
                _logger.LogWarning(
                    "Повторная пометка оплаты в магазине для уже оплаченного заказа {OrderNumber}",
                    order.OrderNumber);
                return MapToDto(order);
            }

            if (order.PaymentMethod != PaymentMethod.InStore &&
                order.PaymentMethod != PaymentMethod.CashOnDelivery)
                throw new InvalidOperationException("Этот заказ нельзя оплатить в магазине");

            order.PaymentReference = $"STORE-{DateTime.UtcNow:yyyyMMddHHmmss}";
            order.PaymentStatus = PaymentStatus.Paid;
            order.PaidAt = DateTime.UtcNow;
            order.Status = OrderStatus.Confirmed;
            order.UpdatedAt = DateTime.UtcNow;
            order.ReservationExpiresAt = null;

            await _db.SaveChangesAsync();

            return MapToDto(order);
        }

        private static OrderDto MapToDto(Order o) => new OrderDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            UserId = o.UserId,
            StoreId = o.StoreId,
            TotalAmount = o.TotalAmount,
            ShippingCost = o.ShippingCost,
            DiscountAmount = o.DiscountAmount,
            Status = o.Status.ToString(),
            PaymentStatus = o.PaymentStatus.ToString(),
            PaymentMethod = o.PaymentMethod.ToString(),
            PaidAt = o.PaidAt,
            ReservationExpiresAt = o.ReservationExpiresAt,
            ShippingFullName = o.ShippingFullName,
            ShippingPhone = o.ShippingPhone,
            ShippingEmail = o.ShippingEmail,
            ShippingAddress = o.ShippingAddress,
            CreatedAt = o.CreatedAt,
            UpdatedAt = o.UpdatedAt,
            Items = o.Items.Select(i => new OrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                StoreId = i.StoreId,
                ProductName = i.ProductName,
                ProductImageUrl = i.ProductImageUrl,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice
            }).ToList()
        };
    }
}