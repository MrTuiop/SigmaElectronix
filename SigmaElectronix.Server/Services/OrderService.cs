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
        private const string DefaultLanguage = "ru"; // 🎯 Дефолтный язык

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
                var reservationHours = dto.PaymentMethod switch
                {
                    PaymentMethod.InStore => 72,
                    PaymentMethod.CashOnDelivery => 72,
                    PaymentMethod.Online => 0.25,
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

                var productIds = dto.Items.Select(i => i.ProductId).ToList();

                // 🚀 ДОБАВЛЕНО: Подтягиваем переводы товаров
                var products = await _db.Products
                    .Include(p => p.Images)
                    .Include(p => p.Translations)
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

                    // 🚀 ИЗВЛЕКАЕМ ИМЯ ТОВАРА ИЗ ПЕРЕВОДОВ (Делаем "снимок" для истории заказа)
                    var productName = product.Translations.FirstOrDefault(t => t.LanguageCode == DefaultLanguage)?.Name
                                   ?? product.Translations.FirstOrDefault()?.Name
                                   ?? $"Товар #{product.Id}";

                    var primaryImage = product.Images.FirstOrDefault(i => i.IsPrimary)
                                    ?? product.Images.FirstOrDefault();

                    if (!stockByProduct.TryGetValue(product.Id, out var productInventories))
                        throw new InvalidOperationException($"Товар {productName} отсутствует на складах");

                    var inventory = await FindAndReserveStockAsync(
                        productInventories, dto.StoreId, item.Quantity);

                    if (inventory != null)
                    {
                        _db.Set<InventoryTransaction>().Add(new InventoryTransaction
                        {
                            StoreId = inventory.StoreId,
                            ProductId = item.ProductId,
                            QuantityChange = -item.Quantity,
                            TransactionType = InventoryTransactionType.Sale,
                            ReferenceId = order.OrderNumber,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    if (inventory == null)
                    {
                        var totalStock = productInventories.Sum(i => i.Quantity);
                        throw new InvalidOperationException(
                            $"Недостаточно товара {productName}. Доступно: {totalStock}");
                    }

                    var orderItem = new OrderItem
                    {
                        Order = order,
                        ProductId = item.ProductId,
                        StoreId = inventory.StoreId,
                        ProductName = productName, // 🚀 Сохраняем "снимок" названия
                        ProductImageUrl = primaryImage?.Url,
                        UnitPrice = product.DiscountPrice ?? product.Price,
                        Quantity = item.Quantity
                    };

                    order.Items.Add(orderItem);
                    subtotal += orderItem.TotalPrice;
                }

                decimal promoDiscount = 0;
                if (!string.IsNullOrWhiteSpace(dto.PromoCode))
                    promoDiscount = await ApplyPromoCodeAsync(dto.PromoCode, subtotal);

                // ===============================================
                // РАСЧЕТ И ПРИМЕНЕНИЕ БОНУСОВ (Только списание)
                // ===============================================
                decimal bonusesSpent = 0;

                if (userId != null && dto.BonusesToSpend > 0)
                {
                    var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
                    if (user != null)
                    {
                        var maxBonuses = (subtotal - promoDiscount) * 0.3m;
                        if (dto.BonusesToSpend > user.BonusBalance || dto.BonusesToSpend > maxBonuses)
                            throw new InvalidOperationException("Некорректная сумма списания бонусов");

                        bonusesSpent = dto.BonusesToSpend;
                        user.BonusBalance -= bonusesSpent;
                    }
                }

                order.DiscountAmount = promoDiscount + bonusesSpent;
                order.TotalAmount = subtotal + dto.ShippingCost - promoDiscount - bonusesSpent;

                _db.Orders.Add(order);
                await _db.SaveChangesAsync();

                // ЗАПИСЬ ТРАНЗАКЦИИ О СПИСАНИИ В ИСТОРИЮ
                if (userId != null && bonusesSpent > 0)
                {
                    _db.Set<BonusTransaction>().Add(new BonusTransaction
                    {
                        UserId = userId,
                        OrderId = order.Id,
                        Amount = -bonusesSpent,
                        Reason = "Списание для оплаты заказа",
                        CreatedAt = DateTime.UtcNow
                    });
                    await _db.SaveChangesAsync();
                }

                // Завершаем транзакцию
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

        public async Task AwardCashbackAsync(int orderId)
        {
            var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null || string.IsNullOrEmpty(order.UserId)) return;

            if (order.PaymentStatus != PaymentStatus.Paid) return;

            bool alreadyAwarded = await _db.Set<BonusTransaction>()
                .AnyAsync(bt => bt.OrderId == orderId && bt.Amount > 0 && bt.Reason == "Кэшбек за покупку");

            if (alreadyAwarded) return;

            bool wasBonusesSpent = await _db.Set<BonusTransaction>()
                .AnyAsync(bt => bt.OrderId == orderId && bt.Amount < 0);

            if (wasBonusesSpent) return;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == order.UserId);
            if (user != null)
            {
                decimal baseAmount = order.TotalAmount - order.ShippingCost;
                if (baseAmount > 0)
                {
                    decimal cashback = Math.Floor(baseAmount * 0.05m);

                    user.BonusBalance += cashback;

                    _db.Set<BonusTransaction>().Add(new BonusTransaction
                    {
                        UserId = user.Id,
                        OrderId = order.Id,
                        Amount = cashback,
                        Reason = "Кэшбек за покупку",
                        CreatedAt = DateTime.UtcNow
                    });

                    await _db.SaveChangesAsync();
                    _logger.LogInformation("Пользователю {UserId} начислен кэшбек {Amount} за заказ {OrderId}", user.Id, cashback, order.Id);
                }
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

                        _db.Set<InventoryTransaction>().Add(new InventoryTransaction
                        {
                            StoreId = inventory.StoreId,
                            ProductId = item.ProductId,
                            QuantityChange = item.Quantity,
                            TransactionType = InventoryTransactionType.Return,
                            ReferenceId = order.OrderNumber,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
                var bonusTxs = await _db.Set<BonusTransaction>().Where(bt => bt.OrderId == order.Id).ToListAsync();

                if (user != null && bonusTxs.Any())
                {
                    foreach (var tx in bonusTxs)
                    {
                        user.BonusBalance -= tx.Amount;

                        _db.Set<BonusTransaction>().Add(new BonusTransaction
                        {
                            UserId = userId,
                            OrderId = order.Id,
                            Amount = -tx.Amount,
                            Reason = "Отмена заказа",
                            CreatedAt = DateTime.UtcNow
                        });
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
            var date = DateTime.UtcNow.ToString("yyyyMMdd");
            var random = Random.Shared.Next(10000, 99999);
            return $"ORD-{date}-{random}";
        }

        private async Task<decimal> ApplyPromoCodeAsync(string code, decimal subtotal)
        {
            var normalizedCode = code.Trim().ToUpperInvariant();

            var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Code == normalizedCode);

            if (coupon == null)
                throw new InvalidOperationException("Промокод не найден.");

            if (!coupon.IsActive)
                throw new InvalidOperationException("Данный промокод отключен.");

            var now = DateTime.UtcNow;
            if (now < coupon.StartDate || now > coupon.EndDate)
                throw new InvalidOperationException("Срок действия промокода истек или еще не наступил.");

            if (coupon.MaxUsageCount > 0 && coupon.CurrentUsageCount >= coupon.MaxUsageCount)
                throw new InvalidOperationException("Лимит использования данного промокода исчерпан.");

            if (subtotal < coupon.MinOrderAmount)
                throw new InvalidOperationException($"Минимальная сумма заказа для применения: {coupon.MinOrderAmount} ₽");

            decimal discountAmount = 0;
            if (coupon.IsPercentage)
            {
                discountAmount = Math.Round(subtotal * (coupon.DiscountValue / 100m), 2);
            }
            else
            {
                discountAmount = Math.Min(subtotal, coupon.DiscountValue);
            }

            coupon.CurrentUsageCount++;

            return discountAmount;
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

        private async Task<StoreInventory?> FindAndReserveStockAsync(
            List<StoreInventory> inventories,
            int? preferredStoreId,
            int quantity)
        {
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

        public async Task<bool> LinkGuestOrderAsync(string orderNumber, string userId)
        {
            var order = await _db.Orders.FirstOrDefaultAsync(o => o.OrderNumber.ToLower() == orderNumber.ToLower());

            if (order == null) return false;

            if (!string.IsNullOrEmpty(order.UserId))
            {
                if (order.UserId == userId) return true;
                throw new InvalidOperationException("Этот заказ уже привязан к другому аккаунту.");
            }

            order.UserId = userId;
            order.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> LinkGuestOrdersByPhoneAsync(string phone, string userId)
        {
            var orders = await _db.Orders
                .Where(o => o.UserId == null && o.ShippingPhone == phone)
                .ToListAsync();

            if (!orders.Any()) return 0;

            foreach (var order in orders)
            {
                order.UserId = userId;
                order.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return orders.Count;
        }
    }
}