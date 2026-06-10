using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Entities.BrandModels;
using SigmaElectronix.Server.Entities.CartModels;
using SigmaElectronix.Server.Entities.OrderModels;
using SigmaElectronix.Server.Entities.ProductModels;
using SigmaElectronix.Server.Entities.StoreModels;
using SigmaElectronix.Server.Entities.UserModels;
using SigmaElectronix.Server.Entities.WishlistModels;
using System.Text.Json;

namespace SigmaElectronix.Server.Data
{
    // Указываем ApplicationUser в качестве типа пользователя для IdentityDbContext
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        #region DbSets - Все таблицы базы данных

        // Каталог товаров
        public DbSet<Category> Categories { get; set; }
        public DbSet<Brand> Brands { get; set; }
        public DbSet<BrandImage> BrandImages { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }

        // Корзина
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }

        // Заказы
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Shipment> Shipments { get; set; }

        // Отзывы
        public DbSet<Review> Reviews { get; set; }

        // Промокоды
        public DbSet<Coupon> Coupons { get; set; }

        // География и магазины
        public DbSet<Region> Regions { get; set; }
        public DbSet<City> Cities { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<StoreInventory> StoreInventories { get; set; }

        // Адреса пользователей
        public DbSet<Address> Addresses { get; set; }

        // История бонусов
        public DbSet<BonusTransaction> BonusTransactions { get; set; }

        // Статистика
        public DbSet<ProductView> ProductViews { get; set; }
        
        // Список желаемого
        public DbSet<Wishlist> Wishlists { get; set; }
        public DbSet<WishlistItem> WishlistItems { get; set; }

        #endregion

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // КРИТИЧЕСКИ ВАЖНО для ASP.NET Core Identity! Настраивает таблицы пользователей и ролей.
            base.OnModelCreating(modelBuilder);

            #region 1. Каталог товаров (Product & Category & Brand)

            // Продукт
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(p => p.Id);

                // Настройка точности цен
                entity.Property(p => p.Price).HasPrecision(18, 2);
                entity.Property(p => p.DiscountPrice).HasPrecision(18, 2);

                // Конвертация Dictionary в JSON строку для базы данных
                entity.Property(p => p.Specifications)
                    .HasColumnType("jsonb") // ИСПРАВЛЕНО для PostgreSQL
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                        v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions)null!) ?? new Dictionary<string, string>())
                    // Этот метод указывает EF Core, как правильно отслеживать изменения внутри словаря
                    .Metadata.SetValueComparer(new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<Dictionary<string, string>>(
                        (c1, c2) => c1!.SequenceEqual(c2!),
                        c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.Key.GetHashCode(), v.Value.GetHashCode())),
                        c => c.ToDictionary(k => k.Key, v => v.Value)));

                // Связь с Категорией (Защита от удаления)
                entity.HasOne(p => p.Category)
                    .WithMany(c => c.Products)
                    .HasForeignKey(p => p.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Связь с Брендом (Защита от удаления)
                entity.HasOne(p => p.Brand)
                    .WithMany(b => b.Products)
                    .HasForeignKey(p => p.BrandId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Ограничения строк для индексов и SEO
                entity.Property(p => p.Name).IsRequired().HasMaxLength(255);
                entity.Property(p => p.Slug).IsRequired().HasMaxLength(255);
                entity.HasIndex(p => p.Slug).IsUnique();
            });

            // Картинки товаров
            modelBuilder.Entity<ProductImage>(entity =>
            {
                entity.HasOne(pi => pi.Product)
                    .WithMany(p => p.Images)
                    .HasForeignKey(pi => pi.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Категория
            modelBuilder.Entity<Category>(entity =>
            {
                entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
                entity.Property(c => c.Slug).IsRequired().HasMaxLength(100);
                entity.HasIndex(c => c.Slug).IsUnique();

                // Настройка иерархической связи (Самоссылающаяся таблица: Главная -> Подкатегории)
                entity.HasOne(c => c.ParentCategory)
                    .WithMany(c => c.SubCategories)
                    .HasForeignKey(c => c.ParentCategoryId)
                    .OnDelete(DeleteBehavior.Restrict); // Запрещаем удалять родительскую категорию, если есть подкатегории
            });

            // Бренд
            modelBuilder.Entity<Brand>(entity =>
            {
                entity.Property(b => b.Name).IsRequired().HasMaxLength(100);
                entity.Property(b => b.Slug).IsRequired().HasMaxLength(150);
                entity.HasIndex(b => b.Slug).IsUnique();
            });

            modelBuilder.Entity<BrandImage>(entity =>
            {
                entity.HasOne(bi => bi.Brand)
                    .WithMany(b => b.Images)
                    .HasForeignKey(bi => bi.BrandId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            #endregion

            #region 2. Корзина (Cart & CartItem)

            modelBuilder.Entity<Cart>(entity =>
            {
                // У одного пользователя может быть только ОДНА корзина
                entity.HasOne(c => c.User)
                    .WithOne(u => u.Cart)
                    .HasForeignKey<Cart>(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade); // Удаляется пользователь -> удаляется корзина
            });

            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.Property(ci => ci.UnitPrice).HasPrecision(18, 2);

                entity.HasOne(ci => ci.Cart)
                    .WithMany(c => c.Items)
                    .HasForeignKey(ci => ci.CartId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            #endregion

            #region 3. Заказы (Order, OrderItem, Payment, Shipment)

            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("Orders"); // Явно указываем имя таблицы для порядка
                entity.HasKey(o => o.Id);

                entity.Property(o => o.OrderNumber).IsRequired().HasMaxLength(50);
                entity.HasIndex(o => o.OrderNumber).IsUnique();

                entity.Property(o => o.TotalAmount).HasPrecision(18, 2);
                entity.Property(o => o.ShippingCost).HasPrecision(18, 2);
                entity.Property(o => o.DiscountAmount).HasPrecision(18, 2);

                // Сохраняем Enum статуса заказа как СТРОКУ в БД
                entity.Property(o => o.Status)
                    .HasConversion<string>()
                    .HasMaxLength(50);

                // НАСТРОЙКА СНАПШОТОВ (Ограничиваем длину строк)
                entity.Property(o => o.ShippingFullName).IsRequired().HasMaxLength(255);
                entity.Property(o => o.ShippingPhone).IsRequired().HasMaxLength(30);
                entity.Property(o => o.ShippingEmail).IsRequired(false).HasMaxLength(150); // Может быть NULL у гостя
                entity.Property(o => o.ShippingAddress).IsRequired().HasMaxLength(1000);

                // ИСПРАВЛЕНО: Связь с пользователем делаем опциональной
                entity.HasOne(o => o.User)
                    .WithMany(u => u.Orders)
                    .HasForeignKey(o => o.UserId)
                    .IsRequired(false) // КРИТИЧЕСКИ ВАЖНО: разрешаем гостевые заказы (UserId = NULL)
                    .OnDelete(DeleteBehavior.Restrict); // Не удаляем пользователя, если у него есть заказы
            });

            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.Property(oi => oi.UnitPrice).HasPrecision(18, 2);
                entity.Property(oi => oi.ProductName).IsRequired().HasMaxLength(255);

                entity.HasOne(oi => oi.Order)
                    .WithMany(o => o.Items)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Связь один-к-одному: Заказ -> Платеж
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.Property(p => p.Amount).HasPrecision(18, 2);
                entity.Property(p => p.Status).HasMaxLength(50);
                entity.Property(p => p.PaymentMethod).HasMaxLength(50);

                entity.HasOne(p => p.Order)
                    .WithOne(o => o.Payment)
                    .HasForeignKey<Payment>(p => p.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Связь один-к-одному: Заказ -> Доставка
            modelBuilder.Entity<Shipment>(entity =>
            {
                entity.Property(s => s.Status).HasMaxLength(50);
                entity.Property(s => s.Carrier).HasMaxLength(100);

                entity.HasOne(s => s.Order)
                    .WithOne(o => o.Shipment)
                    .HasForeignKey<Shipment>(s => s.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            #endregion

            #region 4. География и Магазины (Region, City, Store, StoreInventory)

            modelBuilder.Entity<City>(entity =>
            {
                entity.Property(c => c.Name).IsRequired().HasMaxLength(100);

                // Точность для географических координат на карте
                entity.Property(c => c.Latitude).HasPrecision(11, 8);
                entity.Property(c => c.Longitude).HasPrecision(11, 8);

                entity.HasOne(c => c.Region)
                    .WithMany(r => r.Cities)
                    .HasForeignKey(c => c.RegionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Store>(entity =>
            {
                entity.Property(s => s.Name).IsRequired().HasMaxLength(150);
                entity.Property(s => s.Code).IsRequired().HasMaxLength(50);
                entity.HasIndex(s => s.Code).IsUnique();

                entity.Property(s => s.Latitude).HasPrecision(11, 8);
                entity.Property(s => s.Longitude).HasPrecision(11, 8);

                // Сохраняем тип магазина (Retail/Warehouse) как строку
                entity.Property(s => s.Type)
                    .HasConversion<string>()
                    .HasMaxLength(50);

                entity.HasOne(s => s.City)
                    .WithMany(c => c.Stores)
                    .HasForeignKey(s => s.CityId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<StoreInventory>(entity =>
            {
                // Создаем уникальный индекс: один и тот же товар в одном магазине может упоминаться только 1 раз
                entity.HasIndex(si => new { si.StoreId, si.ProductId }).IsUnique();

                entity.HasOne(si => si.Store)
                    .WithMany(s => s.Inventory)
                    .HasForeignKey(si => si.StoreId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(si => si.Product)
                    .WithMany() // Навигационное свойство из Product к инвентарю мы не делали, оставляем пустым
                    .HasForeignKey(si => si.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            #endregion

            #region 5. Пользователи и Адреса (ApplicationUser & Address & Review)

            modelBuilder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(u => u.FirstName).HasMaxLength(100);
                entity.Property(u => u.LastName).HasMaxLength(100);

                entity.Property(u => u.BonusBalance).HasPrecision(18, 2);

                // Привязка любимого города (настройка внешнего ключа)
                entity.HasOne(u => u.PreferredCity)
                    .WithMany(c => c.Users)
                    .HasForeignKey(u => u.PreferredCityId)
                    .OnDelete(DeleteBehavior.SetNull); // Если город удалят, у юзера просто станет Null

                // Привязка любимого магазина
                entity.HasOne(u => u.PreferredStore)
                    .WithMany()
                    .HasForeignKey(u => u.PreferredStoreId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<BonusTransaction>(entity =>
            {
                entity.HasKey(bt => bt.Id);
                entity.Property(bt => bt.Amount).HasPrecision(18, 2);
                entity.Property(bt => bt.Reason).IsRequired().HasMaxLength(255);

                // Связь: Один Пользователь -> Много Транзакций
                entity.HasOne(bt => bt.User)
                    .WithMany(u => u.BonusTransactions)
                    .HasForeignKey(bt => bt.UserId)
                    .OnDelete(DeleteBehavior.Cascade); // Удаляем юзера -> удаляем его историю бонусов

                // Связь: Транзакция -> Заказ (опционально)
                entity.HasOne(bt => bt.Order)
                    .WithMany() // Со стороны Order коллекцию транзакций мы не делали, поэтому пустые скобки
                    .HasForeignKey(bt => bt.OrderId)
                    .OnDelete(DeleteBehavior.SetNull); // Если удалили заказ из БД, пусть история списания бонусов останется (просто OrderId станет null)
            });

            modelBuilder.Entity<Address>(entity =>
            {
                entity.Property(a => a.Street).IsRequired().HasMaxLength(150);
                entity.Property(a => a.Building).IsRequired().HasMaxLength(20);
                entity.Property(a => a.Latitude).HasPrecision(11, 8);
                entity.Property(a => a.Longitude).HasPrecision(11, 8);

                entity.HasOne(a => a.User)
                    .WithMany(u => u.Addresses)
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(a => a.City)
                    .WithMany(c => c.Addresses)
                    .HasForeignKey(a => a.CityId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Review>(entity =>
            {
                entity.Property(r => r.Title).HasMaxLength(150);
                entity.Property(r => r.Comment).IsRequired().HasMaxLength(2000);

                entity.HasOne(r => r.Product)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(r => r.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.User)
                    .WithMany(u => u.Reviews)
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            #endregion

            #region 6. Купоны (Coupon)

            modelBuilder.Entity<Coupon>(entity =>
            {
                entity.Property(c => c.Code).IsRequired().HasMaxLength(50);
                entity.HasIndex(c => c.Code).IsUnique();
                entity.Property(c => c.DiscountValue).HasPrecision(18, 2);
                entity.Property(c => c.MinOrderAmount).HasPrecision(18, 2);
            });

            #endregion

            #region 7. Статистика (View)

            modelBuilder.Entity<ProductView>(entity =>
            {
                entity.ToTable("ProductViews");
                entity.HasKey(pv => pv.Id);

                entity.Property(pv => pv.SessionId).HasMaxLength(100);
                entity.Property(pv => pv.UserId).IsRequired(false); // Тоже может быть null

                // Индексы для ускорения аналитических запросов
                entity.HasIndex(pv => pv.ViewedAt);
                entity.HasIndex(pv => pv.SessionId);

                entity.HasOne(pv => pv.Product)
                    .WithMany()
                    .HasForeignKey(pv => pv.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            #endregion
        }
    }
}