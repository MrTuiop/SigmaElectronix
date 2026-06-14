using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.CouponDTOs;
using SigmaElectronix.Server.Entities.OrderModels;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class CouponService : ICouponService
    {
        private readonly ApplicationDbContext _context;

        public CouponService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<CouponDto>> GetAllAsync()
        {
            return await _context.Coupons
                .AsNoTracking()
                .OrderByDescending(c => c.Id)
                .Select(c => MapToDto(c))
                .ToListAsync();
        }

        public async Task<CouponDto?> GetByIdAsync(int id)
        {
            var coupon = await _context.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
            return coupon != null ? MapToDto(coupon) : null;
        }

        public async Task<CouponDto?> GetByCodeAsync(string code)
        {
            var normalizedCode = code.Trim().ToUpperInvariant();
            var coupon = await _context.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Code == normalizedCode);
            return coupon != null ? MapToDto(coupon) : null;
        }

        public async Task<CouponDto> CreateAsync(CreateUpdateCouponDto dto)
        {
            var normalizedCode = dto.Code.Trim().ToUpperInvariant();

            if (await _context.Coupons.AnyAsync(c => c.Code == normalizedCode))
                throw new InvalidOperationException("Промокод с таким кодом уже существует.");

            var coupon = new Coupon
            {
                Code = normalizedCode,
                Description = dto.Description,
                DiscountValue = dto.DiscountValue,
                IsPercentage = dto.IsPercentage,
                MinOrderAmount = dto.MinOrderAmount,
                StartDate = dto.StartDate.ToUniversalTime(),
                EndDate = dto.EndDate.ToUniversalTime(),
                MaxUsageCount = dto.MaxUsageCount,
                CurrentUsageCount = 0,
                IsActive = dto.IsActive
            };

            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();

            return MapToDto(coupon);
        }

        public async Task<CouponDto?> UpdateAsync(int id, CreateUpdateCouponDto dto)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return null;

            var normalizedCode = dto.Code.Trim().ToUpperInvariant();

            // Проверяем, не занял ли кто-то другой этот код
            if (coupon.Code != normalizedCode && await _context.Coupons.AnyAsync(c => c.Code == normalizedCode))
                throw new InvalidOperationException("Промокод с таким кодом уже существует.");

            coupon.Code = normalizedCode;
            coupon.Description = dto.Description;
            coupon.DiscountValue = dto.DiscountValue;
            coupon.IsPercentage = dto.IsPercentage;
            coupon.MinOrderAmount = dto.MinOrderAmount;
            coupon.StartDate = dto.StartDate.ToUniversalTime();
            coupon.EndDate = dto.EndDate.ToUniversalTime();
            coupon.MaxUsageCount = dto.MaxUsageCount;
            coupon.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return MapToDto(coupon);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return false;

            // Если купон уже использовался, лучше его деактивировать (Soft Delete), 
            // чтобы не сломать историю заказов. Но если нужно удалять физически:
            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool IsValid, string Message, CouponDto? Coupon)> ValidateCouponAsync(string code, decimal cartTotal)
        {
            var normalizedCode = code.Trim().ToUpperInvariant();
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == normalizedCode);

            if (coupon == null)
                return (false, "Промокод не найден", null);

            if (!coupon.IsActive)
                return (false, "Данный промокод отключен", null);

            var now = DateTime.UtcNow;
            if (now < coupon.StartDate)
                return (false, "Время действия этого промокода еще не наступило", null);

            if (now > coupon.EndDate)
                return (false, "Срок действия промокода истек", null);

            if (coupon.MaxUsageCount > 0 && coupon.CurrentUsageCount >= coupon.MaxUsageCount)
                return (false, "Лимит использования данного промокода исчерпан", null);

            if (cartTotal < coupon.MinOrderAmount)
                return (false, $"Минимальная сумма заказа для применения: {coupon.MinOrderAmount} ₽", null);

            return (true, "Промокод успешно применен", MapToDto(coupon));
        }

        private static CouponDto MapToDto(Coupon c)
        {
            return new CouponDto
            {
                Id = c.Id,
                Code = c.Code,
                Description = c.Description,
                DiscountValue = c.DiscountValue,
                IsPercentage = c.IsPercentage,
                MinOrderAmount = c.MinOrderAmount,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                MaxUsageCount = c.MaxUsageCount,
                CurrentUsageCount = c.CurrentUsageCount,
                IsActive = c.IsActive
            };
        }
    }
}