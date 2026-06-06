using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.OrderDTOs;
using SigmaElectronix.Server.Entities.OrderModels;
using SigmaElectronix.Server.Entities.StoreModels;
using SigmaElectronix.Server.Enums;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    // Services/OrderService.cs
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<OrderService> _logger;

        public OrderService(ApplicationDbContext db, ILogger<OrderService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<OrderDto> CreateOrderAsync(string? userId, CreateOrderDto dto)
        {
            if (dto.Items == null || !dto.Items.Any())
                throw new InvalidOperationException("Заказ не может быть пустым");

            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // === Определяем срок резерва ===
                var reservationHours = dto.PaymentMethod switch
                {
                    PaymentMethod.InStore => 72,        // 3 дня
                    PaymentMethod.CashOnDelivery => 72,
                    PaymentMethod.Online => 0.25,       // 15 минут до оплаты
                    _ => 24
                };

                var order = new Order
                {
                    OrderNumber = GenerateOrderNumber(),
                    UserId = userId,
                    StoreId = dto.StoreId,
                    ShippingFullName = dto.ShippingFullName,
                    ShippingPhone = dto.ShippingPhone,
                    ShippingEmail = dto.ShippingEmail,
                    ShippingAddress = dto.ShippingAddress,
                    ShippingCost = dto.ShippingCost,
                    PaymentMethod = dto.PaymentMethod,
                    PaymentStatus = PaymentStatus.Pending,
                    Status = OrderStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    ReservationExpiresAt = DateTime.UtcNow.AddHours(reservationHours)
                };

                // Подгружаем товары и остатки
                var productIds = dto.Items.Select(i => i.ProductId).ToList();
                var products = await _db.Products
                    .Include(p => p.Images)
                    .Where(p => productIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id);

                var inventories = await _db.Set<StoreInventory>()
                    .Where(i => productIds.Contains(i.ProductId))
                    .ToListAsync();

                var stockByProduct = inventories
                    .GroupBy(i => i.ProductId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                decimal subtotal = 0;

                foreach (var item in dto.Items)
                {
                    if (!products.TryGetValue(item.ProductId, out var product))
                        throw new InvalidOperationException($"Товар {item.ProductId} не найден");

                    var primaryImage = product.Images.FirstOrDefault(i => i.IsPrimary)
                                    ?? product.Images.FirstOrDefault();

                    if (!stockByProduct.TryGetValue(product.Id, out var productInventories))
                        throw new InvalidOperationException($"Товар {product.Name} отсутствует на складах");

                    // === ГЛАВНАЯ ЛОГИКА: приоритет магазина получения ===
                    var inventory = await FindAndReserveStockAsync(
                        productInventories, dto.StoreId, item.Quantity);

                    if (inventory == null)
                    {
                        var totalStock = productInventories.Sum(i => i.Quantity);
                        throw new InvalidOperationException(
                            $"Недостаточно товара {product.Name}. Доступно: {totalStock}");
                    }

                    var orderItem = new OrderItem
                    {
                        Order = order,
                        ProductId = item.ProductId,
                        StoreId = inventory.StoreId, // Реальный источник товара
                        ProductName = product.Name,
                        ProductImageUrl = primaryImage?.Url,
                        UnitPrice = product.DiscountPrice ?? product.Price,
                        Quantity = item.Quantity
                    };

                    order.Items.Add(orderItem);
                    subtotal += orderItem.TotalPrice;
                }

                decimal discount = 0;
                if (!string.IsNullOrWhiteSpace(dto.PromoCode))
                    discount = await ApplyPromoCodeAsync(dto.PromoCode, subtotal);

                order.DiscountAmount = discount;
                order.TotalAmount = subtotal + dto.ShippingCost - discount;

                _db.Orders.Add(order);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Создан заказ {OrderNumber} (метод: {Method}, резерв до: {Expiry})",
                    order.OrderNumber, dto.PaymentMethod, order.ReservationExpiresAt);

                return MapToDto(order);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<OrderDto?> GetByIdAsync(int id)
        {
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            return order == null ? null : MapToDto(order);
        }

        public async Task<List<OrderDto>> GetUserOrdersAsync(string userId)
        {
            var orders = await _db.Orders
                .Include(o => o.Items)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(MapToDto).ToList();
        }

        public async Task<List<OrderDto>> GetAllOrdersAsync()
        {
            var orders = await _db.Orders
                .Include(o => o.Items)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(MapToDto).ToList();
        }

        public async Task<OrderDto?> UpdateStatusAsync(int id, OrderStatus newStatus)
        {
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return null;

            order.Status = newStatus;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return MapToDto(order);
        }

        public async Task<bool> CancelOrderAsync(int id, string userId)
        {
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

            if (order == null) return false;
            if (order.Status != OrderStatus.Pending)
                throw new InvalidOperationException("Можно отменить только ожидающий заказ");

            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // Возвращаем товары в те же магазины
                foreach (var item in order.Items)
                {
                    var inventory = await _db.Set<StoreInventory>()
                        .FirstOrDefaultAsync(i =>
                            i.ProductId == item.ProductId &&
                            i.StoreId == item.StoreId);

                    if (inventory != null)
                    {
                        inventory.Quantity += item.Quantity;
                        inventory.LastUpdated = DateTime.UtcNow;
                    }
                }

                order.Status = OrderStatus.Cancelled;
                order.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // === Приватные хелперы ===

        private static string GenerateOrderNumber()
        {
            // Формат: ORD-20260606-XXXXX
            var date = DateTime.UtcNow.ToString("yyyyMMdd");
            var random = Random.Shared.Next(10000, 99999);
            return $"ORD-{date}-{random}";
        }

        private async Task<decimal> ApplyPromoCodeAsync(string code, decimal subtotal)
        {
            // Заглушка — позже можно сделать через таблицу PromoCodes
            if (code == "SALE10")
                return subtotal * 0.10m;
            return 0;
        }

        private static OrderDto MapToDto(Order o) => new OrderDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            UserId = o.UserId,
            TotalAmount = o.TotalAmount,
            ShippingCost = o.ShippingCost,
            DiscountAmount = o.DiscountAmount,
            Status = o.Status.ToString(),
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
                ProductName = i.ProductName,
                ProductImageUrl = i.ProductImageUrl,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice
            }).ToList()
        };
        private async Task<StoreInventory?> FindAndReserveStockAsync(
    List<StoreInventory> inventories,
    int? preferredStoreId,
    int quantity)
        {
            // 1. Сначала ищем в предпочтительном магазине
            if (preferredStoreId.HasValue)
            {
                var preferred = inventories.FirstOrDefault(
                    i => i.StoreId == preferredStoreId.Value
                      && i.IsReservable
                      && i.Quantity >= quantity);

                if (preferred != null)
                {
                    preferred.Quantity -= quantity;
                    preferred.LastUpdated = DateTime.UtcNow;
                    return preferred;
                }
            }

            // 2. Если там нет — берём из любого другого магазина
            // (логика "товар придёт из другого магазина")
            var anyAvailable = inventories
                .Where(i => i.IsReservable && i.Quantity >= quantity)
                .OrderByDescending(i => i.Quantity)
                .FirstOrDefault();

            if (anyAvailable != null)
            {
                anyAvailable.Quantity -= quantity;
                anyAvailable.LastUpdated = DateTime.UtcNow;
            }

            return anyAvailable;
        }
    }
}
