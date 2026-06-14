using SigmaElectronix.Server.DTOs.CouponDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface ICouponService
    {
        Task<List<CouponDto>> GetAllAsync();
        Task<CouponDto?> GetByIdAsync(int id);
        Task<CouponDto?> GetByCodeAsync(string code);
        Task<CouponDto> CreateAsync(CreateUpdateCouponDto dto);
        Task<CouponDto?> UpdateAsync(int id, CreateUpdateCouponDto dto);
        Task<bool> DeleteAsync(int id);

        // Главный бизнес-метод: проверка промокода на валидность
        Task<(bool IsValid, string Message, CouponDto? Coupon)> ValidateCouponAsync(string code, decimal cartTotal);
    }
}